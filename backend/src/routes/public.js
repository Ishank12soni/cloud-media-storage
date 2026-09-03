
const express = require("express");
const { getPublicLink, publicDownload } = require("../controllers/shareController");
const router = express.Router();
router.get("/:token", getPublicLink);
router.post("/:token/download", publicDownload);
module.exports = router;
