const express = require("express");
const supabase = require("../config/supabase");
const requireAuth = require("../middleware/auth");

const router = express.Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

// ============================================
// SIGN UP
// POST /api/auth/signup
// ============================================

router.post("/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const namePattern = /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/;

if (!fullName || !email || !password) {
  return res.status(400).json({
    success: false,
    message: "Full name, email and password are required",
  });
}

if (!namePattern.test(fullName.trim())) {
  return res.status(400).json({
    success: false,
    message: "Full name can contain letters, spaces, apostrophes and hyphens only",
  });
}

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Create Supabase Auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
      },
    });

    if (error) {
      console.error("SIGNUP ERROR:", error);

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const user = data.user;

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: fullName.trim(),
        email: normalizedEmail,
      });

    if (profileError) {
      console.error("PROFILE ERROR:", profileError);

      // Remove auth user if profile creation fails
      await supabase.auth.admin.deleteUser(user.id);

      return res.status(500).json({
        success: false,
        message: "Account could not be created",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        id: user.id,
        email: user.email,
        fullName: fullName.trim(),
      },
    });
  } catch (error) {
    console.error("SIGNUP SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ============================================
// LOGIN
// POST /api/auth/login
// ============================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      console.error("LOGIN ERROR:", error);

      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    res.cookie(
      "access_token",
      data.session.access_token,
      COOKIE_OPTIONS
    );

    res.cookie(
      "refresh_token",
      data.session.refresh_token,
      COOKIE_OPTIONS
    );

    return res.json({
      success: true,
      message: "Login successful",
      user: {
        id: data.user.id,
        email: data.user.email,
        fullName:
          data.user.user_metadata?.full_name || "",
      },
    });
  } catch (error) {
    console.error("LOGIN SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

// ============================================
// CURRENT USER
// GET /api/auth/me
// ============================================

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = req.user;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url, created_at")
      .eq("id", user.id)
      .single();

    if (error) {
      return res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName:
            user.user_metadata?.full_name || "",
        },
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: profile.full_name || "",
        avatarUrl: profile.avatar_url || null,
        createdAt: profile.created_at,
      },
    });
  } catch (error) {
    console.error("ME ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Could not retrieve user",
    });
  }
});

// ============================================
// LOGOUT
// POST /api/auth/logout
// ============================================

router.post("/logout", async (req, res) => {
  try {
    const accessToken = req.cookies?.access_token;

    if (accessToken) {
      await supabase.auth.signOut(accessToken);
    }

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("LOGOUT ERROR:", error);

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    return res.json({
      success: true,
      message: "Logout successful",
    });
  }
});

module.exports = router;