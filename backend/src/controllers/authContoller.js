const supabase = require("../config/supabase");

async function register(req, res) {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Full name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        full_name: fullName,
      });

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Login successful",
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
}

async function me(req, res) {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", req.user.id)
      .single();

    return res.json({
      success: true,
      user: req.user,
      profile: profile || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Unable to load profile",
    });
  }
}

async function logout(req, res) {
  return res.json({
    success: true,
    message: "Logged out successfully",
  });
}

module.exports = {
  register,
  login,
  me,
  logout,
};