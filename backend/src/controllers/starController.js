
const supabase = require("../config/supabase");

async function getStars(req, res) {
  try {
    const { data, error } = await supabase.from("stars").select("*")
      .eq("user_id", req.user.id).order("created_at", { ascending: false });
    if (error) throw error;
    res.json({ success: true, stars: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load starred items" });
  }
}

async function addStar(req, res) {
  try {
    const { itemType, itemId } = req.body;
    if (!["file", "folder"].includes(itemType) || !itemId) {
      return res.status(400).json({ success: false, message: "Valid item information is required" });
    }
    const table = itemType === "file" ? "files" : "folders";
    const { data: item } = await supabase.from(table).select("id").eq("id", itemId).eq("user_id", req.user.id).maybeSingle();
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    const { data, error } = await supabase.from("stars").upsert({
      user_id: req.user.id, item_type: itemType, item_id: itemId
    }, { onConflict: "user_id,item_type,item_id" }).select().single();
    if (error) throw error;
    res.json({ success: true, star: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to star item" });
  }
}

async function removeStar(req, res) {
  try {
    const { itemType, itemId } = req.body;
    const { error } = await supabase.from("stars").delete().eq("user_id", req.user.id).eq("item_type", itemType).eq("item_id", itemId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to remove star" });
  }
}

module.exports = { getStars, addStar, removeStar };
