require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const supabase = require("./config/supabase");
const authRoutes = require("./routes/authRoutes");

const app = express();

const PORT = process.env.PORT || 5001;
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:3000";

// ============================================
// SECURITY
// ============================================

app.use(helmet());

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// ============================================
// BODY PARSING
// ============================================

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// ============================================
// LOGGING
// ============================================

app.use(morgan("dev"));

// ============================================
// ROOT
// ============================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Cloud Media Storage API is running",
  });
});

// ============================================
// HEALTH CHECK
// ============================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Cloud Media Storage Backend is running",
  });
});

// ============================================
// DATABASE TEST
// ============================================

app.get("/api/db-test", async (req, res) => {
  try {
    const { error } = await supabase
      .from("health_check")
      .select("id")
      .limit(1);

    if (error) {
      console.error("SUPABASE ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Supabase connection/table test failed",
        error: error.message,
        code: error.code,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Backend and Supabase database are connected",
    });
  } catch (error) {
    console.error("DATABASE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

app.use("/api/auth", authRoutes);

// ============================================
// 404
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// ============================================
// ERROR HANDLER
// ============================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log("----------------------------------------");
  console.log("Cloud Media Storage Backend");
  console.log("----------------------------------------");
  console.log(`Server running: http://localhost:${PORT}`);
  console.log(`Health check:   http://localhost:${PORT}/api/health`);
  console.log(`Database test:  http://localhost:${PORT}/api/db-test`);
  console.log(`Auth API:       http://localhost:${PORT}/api/auth`);
  console.log("----------------------------------------");
});