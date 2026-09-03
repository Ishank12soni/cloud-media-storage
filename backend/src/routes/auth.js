const express = require("express");

const {
  register,
  login,
  logout,
  getMe,
} = require("../controllers/authController");

const auth = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", auth, logout);

router.get("/me", auth, getMe);

module.exports = router;