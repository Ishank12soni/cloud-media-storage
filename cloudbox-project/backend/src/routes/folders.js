
const express = require("express");
const auth = require("../middleware/auth");
const {
  getFolders, getAllFolders, getFolder, createFolder, updateFolder,
  deleteFolder, restoreFolder, permanentDeleteFolder
} = require("../controllers/folderController");

const router = express.Router();
router.use(auth);
router.get("/all", getAllFolders);
router.get("/", getFolders);
router.post("/", createFolder);
router.get("/:id", getFolder);
router.patch("/:id/restore", restoreFolder);
router.patch("/:id", updateFolder);
router.delete("/:id", deleteFolder);
router.delete("/:id/permanent", permanentDeleteFolder);
module.exports = router;
