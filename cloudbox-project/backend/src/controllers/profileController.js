
const supabase = require("../config/supabase");

async function getProfile(req, res) {
  try {
    let { data, error } = await supabase.from("profiles").select("*").eq("id", req.user.id).maybeSingle();
    if (error) throw error;
    if (!data) {
      const { data: created, error: createError } = await supabase.from("profiles").upsert({
        id: req.user.id, email: req.user.email, full_name: req.user.user_metadata?.full_name || ""
      }).select().single();
      if (createError) throw createError;
      data = created;
    }
    res.json({ success: true, profile: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to load profile" });
  }
}

async function updateProfile(req, res) {
  try {
    const fullName = String(req.body.fullName || "").replace(/\s+/g, " ").trim();
    if (!fullName) return res.status(400).json({ success: false, message: "Name is required" });

    const { data, error } = await supabase.from("profiles").upsert({
      id: req.user.id, email: req.user.email, full_name: fullName, updated_at: new Date().toISOString()
    }).select().single();
    if (error) throw error;

    const { error: authError } = await supabase.auth.admin.updateUserById(req.user.id, {
      user_metadata: { ...(req.user.user_metadata || {}), full_name: fullName }
    });
    if (authError) throw authError;

    res.json({ success: true, profile: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Unable to update profile" });
  }
}

async function changePassword(req, res) {
  try {
    const password = String(req.body.password || "");
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must contain at least 6 characters" });
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, { password });
    if (error) throw error;
    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || "Unable to change password" });
  }
}

module.exports = { getProfile, updateProfile, changePassword };
