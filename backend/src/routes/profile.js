
const express = require("express");
const auth = require("../middleware/auth");
const { getProfile, updateProfile, changePassword } = require("../controllers/profileController");
const router = express.Router();
router.use(auth);
router.get("/", getProfile);
router.patch("/", updateProfile);
router.patch("/password", changePassword);
module.exports = router;
