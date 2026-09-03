
const express = require("express");
const multer = require("multer");
const auth = require("../middleware/auth");
const {
  getFiles, getFile, uploadFile, downloadFile, renameFile, moveFile,
  deleteFile, restoreFile, permanentDelete
} = require("../controllers/fileController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.use(auth);
router.get("/", getFiles);
router.post("/upload", upload.single("file"), uploadFile);
router.get("/:id/download", downloadFile);
router.get("/:id", getFile);
router.patch("/:id/rename", renameFile);
router.patch("/:id/move", moveFile);
router.patch("/:id/restore", restoreFile);
router.delete("/:id", deleteFile);
router.delete("/:id/permanent", permanentDelete);

module.exports = router;
