
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

const supabase = require("./config/supabase");

const authRoutes = require("./routes/auth");
const folderRoutes = require("./routes/folders");
const fileRoutes = require("./routes/files");
const shareRoutes = require("./routes/shares");
const starRoutes = require("./routes/stars");
const profileRoutes = require("./routes/profile");
const searchRoutes = require("./routes/search");
const publicRoutes = require("./routes/public");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Cloud Media Storage Backend is running" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const { data, error } = await supabase.from("health_check").select("*").limit(1);
    if (error) throw error;
    res.json({ success: true, message: "Database connection successful", data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Database connection failed" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/shares", shareRoutes);
app.use("/api/stars", starRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/public", publicRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "API route not found" });
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Cloud Media Storage Backend running on port ${PORT}`);
});
