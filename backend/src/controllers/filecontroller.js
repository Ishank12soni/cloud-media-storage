
const crypto = require("crypto");
const path = require("path");
const supabase = require("../config/supabase");

const BUCKET = "cloudbox-files";
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function sanitizeFileName(name) {
  return String(name || "file")
    .replace(/[\/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

async function ownFolder(userId, folderId) {
  if (!folderId) return true;
  const { data, error } = await supabase.from("folders").select("id,user_id,parent_id")
    .eq("id", folderId).eq("user_id", userId).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function folderPermission(userId, email, folderId) {
  if (!folderId) return "none";
  const { data: folder, error } = await supabase.from("folders").select("id,user_id,parent_id,deleted_at")
    .eq("id", folderId).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  if (!folder) return "none";
  if (folder.user_id === userId) return "owner";

  let cursor = folder;
  for (let i = 0; i < 30 && cursor; i++) {
    const { data: shares, error: shareError } = await supabase.from("shares")
      .select("permission").eq("item_type", "folder").eq("item_id", cursor.id).eq("shared_with_email", String(email || "").toLowerCase());
    if (shareError) throw shareError;
    if ((shares || []).some(s => s.permission === "editor")) return "editor";
    if ((shares || []).length) return "viewer";
    if (!cursor.parent_id) break;
    const { data: parent, error: parentError } = await supabase.from("folders").select("id,user_id,parent_id,deleted_at")
      .eq("id", cursor.parent_id).is("deleted_at", null).maybeSingle();
    if (parentError) throw parentError;
    cursor = parent;
  }
  return "none";
}

async function filePermission(userId, email, fileId) {
  const { data: file, error } = await supabase.from("files").select("*")
    .eq("id", fileId).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  if (!file) return { permission: "none", file: null };
  if (file.user_id === userId) return { permission: "owner", file };

  const { data: direct, error: directError } = await supabase.from("shares").select("permission")
    .eq("item_type", "file").eq("item_id", fileId).eq("shared_with_email", String(email || "").toLowerCase());
  if (directError) throw directError;
  if ((direct || []).some(s => s.permission === "editor")) return { permission: "editor", file };
  if ((direct || []).length) return { permission: "viewer", file };

  const permission = await folderPermission(userId, email, file.folder_id);
  return { permission, file };
}

async function logActivity(userId, action, itemType, itemId, metadata = {}) {
  await supabase.from("activities").insert({ user_id: userId, action, item_type: itemType, item_id: itemId, metadata });
}

async function getFiles(req, res) {
  try {
    const folderId = req.query.folderId || null;
    let query = supabase.from("files").select("*").is("deleted_at", null);

    if (folderId) {
      const permission = await folderPermission(req.user.id, req.user.email, folderId);
      if (permission === "none") return res.status(403).json({ success: false, message: "You do not have access to this folder" });
      query = query.eq("folder_id", folderId);
    } else {
      query = query.eq("user_id", req.user.id).is("folder_id", null);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, files: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load files" });
  }
}

async function uploadFile(req, res) {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
    if (req.file.size > MAX_FILE_SIZE) return res.status(413).json({ success: false, message: "Maximum file size is 50 MB" });

    const folderId = req.body.folderId && req.body.folderId !== "null" ? req.body.folderId : null;
    const folderAccess = folderId
      ? await folderPermission(req.user.id, req.user.email, folderId)
      : "owner";

    if (!["owner", "editor"].includes(folderAccess)) {
      return res.status(403).json({ success: false, message: "You cannot upload to this folder" });
    }

    const originalName = sanitizeFileName(req.file.originalname);
    const extension = path.extname(originalName);
    const base = path.basename(originalName, extension) || "file";
    const ownerId = req.user.id;
    const storagePath = `${ownerId}/${folderId || "root"}/${crypto.randomUUID()}-${sanitizeFileName(base)}${extension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET).upload(
      storagePath,
      req.file.buffer,
      { contentType: req.file.mimetype || "application/octet-stream", upsert: false }
    );
    if (uploadError) throw uploadError;

    const { data: file, error: dbError } = await supabase.from("files").insert({
      user_id: ownerId,
      folder_id: folderId,
      name: originalName,
      original_name: originalName,
      mime_type: req.file.mimetype || "application/octet-stream",
      size_bytes: req.file.size,
      storage_path: uploadData.path,
    }).select().single();

    if (dbError) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw dbError;
    }

    await logActivity(ownerId, "upload", "file", file.id, { name: file.name });
    res.status(201).json({ success: true, file });
  } catch (error) {
    console.error("UPLOAD FILE ERROR:", error);
    res.status(500).json({ success: false, message: error.message || "Unable to upload file" });
  }
}

async function getFile(req, res) {
  try {
    const result = await filePermission(req.user.id, req.user.email, req.params.id);
    if (result.permission === "none") return res.status(404).json({ success: false, message: "File not found" });
    res.json({ success: true, file: result.file, permission: result.permission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load file" });
  }
}

async function downloadFile(req, res) {
  try {
    const result = await filePermission(req.user.id, req.user.email, req.params.id);
    if (result.permission === "none") return res.status(404).json({ success: false, message: "File not found" });

    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(result.file.storage_path, 300, {
      download: result.file.name,
    });
    if (error) throw error;

    await logActivity(req.user.id, "download", "file", result.file.id, { name: result.file.name });
    res.json({ success: true, url: data.signedUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to generate download link" });
  }
}

async function renameFile(req, res) {
  try {
    const result = await filePermission(req.user.id, req.user.email, req.params.id);
    if (!["owner", "editor"].includes(result.permission)) return res.status(403).json({ success: false, message: "You do not have edit access" });

    const name = sanitizeFileName(req.body.name);
    if (!name) return res.status(400).json({ success: false, message: "File name is required" });

    const { data, error } = await supabase.from("files").update({ name, updated_at: new Date().toISOString() })
      .eq("id", req.params.id).select().single();
    if (error) throw error;
    await logActivity(req.user.id, "rename", "file", data.id, { name });
    res.json({ success: true, file: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to rename file" });
  }
}

async function moveFile(req, res) {
  try {
    const result = await filePermission(req.user.id, req.user.email, req.params.id);
    if (!["owner", "editor"].includes(result.permission)) return res.status(403).json({ success: false, message: "You do not have edit access" });

    const folderId = req.body.folderId || null;
    if (folderId) {
      const destinationPermission = await folderPermission(req.user.id, req.user.email, folderId);
      if (!["owner", "editor"].includes(destinationPermission)) return res.status(403).json({ success: false, message: "You cannot move this file into that folder" });
    }

    const { data, error } = await supabase.from("files").update({ folder_id: folderId, updated_at: new Date().toISOString() })
      .eq("id", req.params.id).select().single();
    if (error) throw error;
    await logActivity(req.user.id, "move", "file", data.id, { folder_id: folderId });
    res.json({ success: true, file: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to move file" });
  }
}

async function deleteFile(req, res) {
  try {
    const result = await filePermission(req.user.id, req.user.email, req.params.id);
    if (!["owner", "editor"].includes(result.permission)) return res.status(403).json({ success: false, message: "You do not have delete access" });

    const { data, error } = await supabase.from("files").update({
      deleted_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }).eq("id", req.params.id).select().single();
    if (error) throw error;
    await logActivity(req.user.id, "trash", "file", data.id, { name: data.name });
    res.json({ success: true, file: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to move file to trash" });
  }
}

async function restoreFile(req, res) {
  try {
    const { data, error } = await supabase.from("files").update({ deleted_at: null, updated_at: new Date().toISOString() })
      .eq("id", req.params.id).eq("user_id", req.user.id).not("deleted_at", "is", null).select().single();
    if (error || !data) return res.status(404).json({ success: false, message: "File not found in trash" });
    res.json({ success: true, file: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to restore file" });
  }
}

async function permanentDelete(req, res) {
  try {
    const { data: file, error: findError } = await supabase.from("files").select("storage_path")
      .eq("id", req.params.id).eq("user_id", req.user.id).not("deleted_at", "is", null).maybeSingle();
    if (findError) throw findError;
    if (!file) return res.status(404).json({ success: false, message: "File not found in trash" });
    await supabase.storage.from(BUCKET).remove([file.storage_path]);
    const { error } = await supabase.from("files").delete().eq("id", req.params.id).eq("user_id", req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to permanently delete file" });
  }
}

module.exports = { getFiles, getFile, uploadFile, downloadFile, renameFile, moveFile, deleteFile, restoreFile, permanentDelete };
