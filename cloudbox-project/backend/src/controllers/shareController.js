
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const supabase = require("../config/supabase");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

async function getOwnerItem(userId, itemType, itemId) {
  const table = itemType === "file" ? "files" : "folders";
  const { data, error } = await supabase.from(table).select("*").eq("id", itemId).eq("user_id", userId).is("deleted_at", null).maybeSingle();
  if (error) throw error;
  return data;
}

async function createShare(req, res) {
  try {
    const { itemType, itemId, email, permission = "viewer" } = req.body;
    const targetEmail = normalizeEmail(email);
    if (!["file", "folder"].includes(itemType) || !itemId || !targetEmail) {
      return res.status(400).json({ success: false, message: "Item, type and email are required" });
    }
    if (!["viewer", "editor"].includes(permission)) {
      return res.status(400).json({ success: false, message: "Permission must be viewer or editor" });
    }
    const item = await getOwnerItem(req.user.id, itemType, itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    if (targetEmail === normalizeEmail(req.user.email)) {
      return res.status(400).json({ success: false, message: "You already own this item" });
    }

    const { data, error } = await supabase.from("shares").upsert({
      owner_id: req.user.id, item_type: itemType, item_id: itemId,
      shared_with_email: targetEmail, permission
    }, { onConflict: "item_type,item_id,shared_with_email" }).select().single();

    if (error) throw error;
    res.status(201).json({ success: true, share: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to share item" });
  }
}

async function getShares(req, res) {
  try {
    const { itemType, itemId } = req.query;
    const { data, error } = await supabase.from("shares").select("*")
      .eq("owner_id", req.user.id).eq("item_type", itemType).eq("item_id", itemId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, shares: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load shares" });
  }
}

async function deleteShare(req, res) {
  try {
    const { error } = await supabase.from("shares").delete().eq("id", req.params.id).eq("owner_id", req.user.id);
    if (error) throw error;
    res.json({ success: true, message: "Access revoked" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to revoke access" });
  }
}

async function getSharedWithMe(req, res) {
  try {
    const email = normalizeEmail(req.user.email);
    const { data: shares, error } = await supabase.from("shares").select("*")
      .eq("shared_with_email", email).order("created_at", { ascending: false });
    if (error) throw error;

    const result = [];
    for (const share of shares || []) {
      const table = share.item_type === "file" ? "files" : "folders";
      const { data: item } = await supabase.from(table).select("*").eq("id", share.item_id).is("deleted_at", null).maybeSingle();
      if (item) result.push({ ...share, item });
    }
    res.json({ success: true, shares: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load shared items" });
  }
}


async function getPublicLinks(req, res) {
  try {
    const { itemType, itemId } = req.query;
    const { data, error } = await supabase.from("link_shares")
      .select("id,item_type,item_id,token,expires_at,created_at")
      .eq("owner_id", req.user.id).eq("item_type", itemType).eq("item_id", itemId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, links: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load public links" });
  }
}

async function createPublicLink(req, res) {
  try {
    const { itemType, itemId, expiresAt, password } = req.body;
    if (!["file", "folder"].includes(itemType) || !itemId) {
      return res.status(400).json({ success: false, message: "Valid item is required" });
    }
    const item = await getOwnerItem(req.user.id, itemType, itemId);
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      return res.status(400).json({ success: false, message: "Expiry must be in the future" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const passwordHash = password ? await bcrypt.hash(String(password), 10) : null;
    const { data, error } = await supabase.from("link_shares").insert({
      owner_id: req.user.id, item_type: itemType, item_id: itemId, token,
      expires_at: expiresAt || null, password_hash: passwordHash
    }).select("id,item_type,item_id,token,expires_at,created_at").single();

    if (error) throw error;
    res.status(201).json({ success: true, link: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to create public link" });
  }
}

async function deletePublicLink(req, res) {
  try {
    const { error } = await supabase.from("link_shares").delete().eq("id", req.params.id).eq("owner_id", req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to delete public link" });
  }
}

async function getPublicLink(req, res) {
  try {
    const { data: link, error } = await supabase.from("link_shares").select("*").eq("token", req.params.token).maybeSingle();
    if (error) throw error;
    if (!link) return res.status(404).json({ success: false, message: "Share link not found" });
    if (link.expires_at && new Date(link.expires_at) <= new Date()) return res.status(410).json({ success: false, message: "This share link has expired" });

    const table = link.item_type === "file" ? "files" : "folders";
    const { data: item, error: itemError } = await supabase.from(table).select("*").eq("id", link.item_id).is("deleted_at", null).maybeSingle();
    if (itemError) throw itemError;
    if (!item) return res.status(404).json({ success: false, message: "Shared item no longer exists" });

    res.json({
      success: true,
      item: { ...item, passwordProtected: Boolean(link.password_hash) },
      link: { id: link.id, itemType: link.item_type, expiresAt: link.expires_at, passwordProtected: Boolean(link.password_hash) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load share link" });
  }
}

async function publicDownload(req, res) {
  try {
    const { data: link, error } = await supabase.from("link_shares").select("*").eq("token", req.params.token).maybeSingle();
    if (error) throw error;
    if (!link) return res.status(404).json({ success: false, message: "Share link not found" });
    if (link.expires_at && new Date(link.expires_at) <= new Date()) return res.status(410).json({ success: false, message: "This share link has expired" });
    if (link.item_type !== "file") return res.status(400).json({ success: false, message: "This share link is not a file" });

    if (link.password_hash) {
      const supplied = String(req.body.password || "");
      if (!supplied || !(await bcrypt.compare(supplied, link.password_hash))) {
        return res.status(401).json({ success: false, message: "Incorrect share password", requiresPassword: true });
      }
    }

    const { data: file } = await supabase.from("files").select("*").eq("id", link.item_id).is("deleted_at", null).maybeSingle();
    if (!file) return res.status(404).json({ success: false, message: "File no longer exists" });

    const { data: signed, error: signedError } = await supabase.storage.from("cloudbox-files")
      .createSignedUrl(file.storage_path, 300, { download: file.name });
    if (signedError) throw signedError;
    res.json({ success: true, url: signed.signedUrl, file });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to download shared file" });
  }
}

module.exports = {
  createShare, getShares, deleteShare, getSharedWithMe,
  createPublicLink, getPublicLinks, deletePublicLink, getPublicLink, publicDownload
};
