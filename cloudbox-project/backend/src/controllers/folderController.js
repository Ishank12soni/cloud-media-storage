
const supabase = require("../config/supabase");

function cleanName(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 100);
}

async function folderOwned(userId, folderId) {
  if (!folderId) return true;
  const { data, error } = await supabase.from("folders").select("id")
    .eq("id", folderId).eq("user_id", userId).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  return Boolean(data);
}


async function accessibleFolder(userId, email, folderId) {
  const { data: folder, error } = await supabase.from("folders").select("*")
    .eq("id", folderId).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  if (!folder) return { folder: null, permission: "none" };
  if (folder.user_id === userId) return { folder, permission: "owner" };

  let cursor = folder;
  for (let i = 0; i < 30 && cursor; i++) {
    const { data: shares, error: shareError } = await supabase.from("shares").select("permission")
      .eq("item_type", "folder").eq("item_id", cursor.id)
      .eq("shared_with_email", String(email || "").toLowerCase());
    if (shareError) throw shareError;
    if ((shares || []).some(s => s.permission === "editor")) return { folder, permission: "editor" };
    if ((shares || []).length) return { folder, permission: "viewer" };
    if (!cursor.parent_id) break;
    const { data: parent, error: parentError } = await supabase.from("folders").select("*")
      .eq("id", cursor.parent_id).is("deleted_at", null).maybeSingle();
    if (parentError) throw parentError;
    cursor = parent;
  }
  return { folder, permission: "none" };
}

async function getAccessibleChildren(req, res) {
  try {
    const parentId = req.query.parentId || null;
    if (!parentId) return getFolders(req, res);
    const access = await accessibleFolder(req.user.id, req.user.email, parentId);
    if (access.permission === "none") return res.status(403).json({ success: false, message: "You do not have access to this folder" });

    const { data, error } = await supabase.from("folders").select("*")
      .eq("parent_id", parentId).is("deleted_at", null).order("name", { ascending: true });
    if (error) throw error;
    res.json({ success: true, folders: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load folders" });
  }
}

async function isDescendant(userId, folderId, possibleParentId) {
  let cursor = possibleParentId;
  for (let i = 0; i < 30 && cursor; i++) {
    if (cursor === folderId) return true;
    const { data, error } = await supabase.from("folders").select("parent_id")
      .eq("id", cursor).eq("user_id", userId).is("deleted_at", null).maybeSingle();
    if (error) throw error;
    if (!data) break;
    cursor = data.parent_id;
  }
  return false;
}

async function getFolders(req, res) {
  try {
    const parentId = req.query.parentId || null;
    if (parentId) {
      const access = await accessibleFolder(req.user.id, req.user.email, parentId);
      if (access.permission === "none") return res.status(403).json({ success: false, message: "You do not have access to this folder" });
    }
    let query = supabase.from("folders")
      .select("id,user_id,parent_id,name,created_at,updated_at,deleted_at")
      .eq("user_id", req.user.id).is("deleted_at", null).order("name", { ascending: true });
    query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, folders: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load folders" });
  }
}

async function getAllFolders(req, res) {
  try {
    const { data, error } = await supabase.from("folders").select("*")
      .eq("user_id", req.user.id).is("deleted_at", null).order("name", { ascending: true });
    if (error) throw error;
    res.json({ success: true, folders: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load folders" });
  }
}

async function getFolder(req, res) {
  try {
    const access = await accessibleFolder(req.user.id, req.user.email, req.params.id);
    if (!access.folder || access.permission === "none") {
      return res.status(404).json({ success: false, message: "Folder not found" });
    }
    res.json({ success: true, folder: access.folder, permission: access.permission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load folder" });
  }
}

async function createFolder(req, res) {
  try {
    const name = cleanName(req.body.name);
    const parentId = req.body.parentId || null;
    if (!name) return res.status(400).json({ success: false, message: "Folder name is required" });
    if (!(await folderOwned(req.user.id, parentId))) return res.status(403).json({ success: false, message: "Invalid parent folder" });

    const { data: existing } = await supabase.from("folders").select("id")
      .eq("user_id", req.user.id).eq("name", name).eq("parent_id", parentId)
      .is("deleted_at", null).maybeSingle();
    if (existing) return res.status(409).json({ success: false, message: "A folder with this name already exists" });

    const { data, error } = await supabase.from("folders").insert({
      user_id: req.user.id, parent_id: parentId, name
    }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, folder: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to create folder" });
  }
}

async function updateFolder(req, res) {
  try {
    const name = req.body.name !== undefined ? cleanName(req.body.name) : undefined;
    const parentId = req.body.parentId !== undefined ? (req.body.parentId || null) : undefined;

    if (name !== undefined && !name) return res.status(400).json({ success: false, message: "Folder name cannot be empty" });
    if (parentId !== undefined) {
      if (parentId === req.params.id) return res.status(400).json({ success: false, message: "A folder cannot be its own parent" });
      if (parentId && !(await folderOwned(req.user.id, parentId))) return res.status(403).json({ success: false, message: "Invalid destination folder" });
      if (parentId && await isDescendant(req.user.id, req.params.id, parentId)) {
        return res.status(400).json({ success: false, message: "A folder cannot be moved inside itself or its child folder" });
      }
    }

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (parentId !== undefined) updates.parent_id = parentId;
    if (Object.keys(updates).length === 1) return res.status(400).json({ success: false, message: "No changes provided" });

    const { data, error } = await supabase.from("folders").update(updates)
      .eq("id", req.params.id).eq("user_id", req.user.id).is("deleted_at", null).select().single();
    if (error || !data) return res.status(404).json({ success: false, message: error?.message || "Folder not found" });
    res.json({ success: true, folder: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to update folder" });
  }
}

async function deleteFolder(req, res) {
  try {
    const id = req.params.id;
    const [{ data: childFolders }, { data: childFiles }] = await Promise.all([
      supabase.from("folders").select("id").eq("parent_id", id).eq("user_id", req.user.id).is("deleted_at", null).limit(1),
      supabase.from("files").select("id").eq("folder_id", id).eq("user_id", req.user.id).is("deleted_at", null).limit(1),
    ]);
    if ((childFolders || []).length || (childFiles || []).length) {
      return res.status(409).json({ success: false, message: "Empty the folder before moving it to Trash." });
    }

    const { data, error } = await supabase.from("folders").update({
      deleted_at: new Date().toISOString(), updated_at: new Date().toISOString()
    }).eq("id", id).eq("user_id", req.user.id).is("deleted_at", null).select().single();
    if (error || !data) return res.status(404).json({ success: false, message: error?.message || "Folder not found" });
    res.json({ success: true, folder: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to delete folder" });
  }
}

async function restoreFolder(req, res) {
  try {
    const { data: folder, error: findError } = await supabase.from("folders").select("*")
      .eq("id", req.params.id).eq("user_id", req.user.id).not("deleted_at", "is", null).maybeSingle();
    if (findError) throw findError;
    if (!folder) return res.status(404).json({ success: false, message: "Folder not found in Trash" });

    let parentId = folder.parent_id;
    if (parentId) {
      const { data: parent } = await supabase.from("folders").select("id").eq("id", parentId).eq("user_id", req.user.id).is("deleted_at", null).maybeSingle();
      if (!parent) parentId = null;
    }

    const { data, error } = await supabase.from("folders").update({
      deleted_at: null, parent_id: parentId, updated_at: new Date().toISOString()
    }).eq("id", folder.id).select().single();
    if (error) throw error;
    res.json({ success: true, folder: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to restore folder" });
  }
}

async function permanentDeleteFolder(req, res) {
  try {
    const { data: folder, error } = await supabase.from("folders").select("id")
      .eq("id", req.params.id).eq("user_id", req.user.id).not("deleted_at", "is", null).maybeSingle();
    if (error) throw error;
    if (!folder) return res.status(404).json({ success: false, message: "Folder not found in Trash" });
    const { error: delError } = await supabase.from("folders").delete().eq("id", folder.id).eq("user_id", req.user.id);
    if (delError) throw delError;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to permanently delete folder" });
  }
}

module.exports = {
  getFolders, getAllFolders, getFolder, createFolder, updateFolder,
  deleteFolder, restoreFolder, permanentDeleteFolder
};
