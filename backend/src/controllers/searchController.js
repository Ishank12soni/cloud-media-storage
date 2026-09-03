
const supabase = require("../config/supabase");

async function search(req, res) {
  try {
    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "all");
    const sort = String(req.query.sort || "newest");
    if (!q) return res.json({ success: true, folders: [], files: [] });

    const { data: folders, error: folderError } = await supabase.from("folders").select("*")
      .eq("user_id", req.user.id).is("deleted_at", null).ilike("name", `%${q}%`);
    if (folderError) throw folderError;

    const { data: files, error: fileError } = await supabase.from("files").select("*")
      .eq("user_id", req.user.id).is("deleted_at", null).ilike("name", `%${q}%`);
    if (fileError) throw fileError;

    const sortFn = (a,b) => {
      if (sort === "name") return String(a.name).localeCompare(String(b.name));
      if (sort === "size") return Number(b.size_bytes || 0) - Number(a.size_bytes || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    };
    res.json({
      success: true,
      folders: type === "file" ? [] : (folders || []).sort(sortFn),
      files: type === "folder" ? [] : (files || []).sort(sortFn)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Search failed" });
  }
}

async function recent(req, res) {
  try {
    const [{ data: files, error: fe }, { data: folders, error: foe }] = await Promise.all([
      supabase.from("files").select("*").eq("user_id", req.user.id).is("deleted_at", null).order("updated_at", { ascending: false }).limit(50),
      supabase.from("folders").select("*").eq("user_id", req.user.id).is("deleted_at", null).order("updated_at", { ascending: false }).limit(50)
    ]);
    if (fe) throw fe; if (foe) throw foe;
    res.json({ success: true, files: files || [], folders: folders || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load recent items" });
  }
}

async function trash(req, res) {
  try {
    const [{ data: files, error: fe }, { data: folders, error: foe }] = await Promise.all([
      supabase.from("files").select("*").eq("user_id", req.user.id).not("deleted_at", "is", null).order("deleted_at", { ascending: false }),
      supabase.from("folders").select("*").eq("user_id", req.user.id).not("deleted_at", "is", null).order("deleted_at", { ascending: false })
    ]);
    if (fe) throw fe; if (foe) throw foe;
    res.json({ success: true, files: files || [], folders: folders || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load trash" });
  }
}

module.exports = { search, recent, trash };
