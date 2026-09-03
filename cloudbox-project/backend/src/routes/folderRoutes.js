const express = require("express");

const {
  createFolder,
  getFolders,
  getFolder,
  updateFolder,
  deleteFolder,
} = require("../controllers/folderController");

const authMiddleware = require("../middleware/auth");

const router = express.Router();

/*
  All folder routes require the user to be logged in.
*/

/* Get folders */
router.get("/", authMiddleware, getFolders);

/* Create folder */
router.post("/", authMiddleware, createFolder);

/* Get one folder */
router.get("/:id", authMiddleware, getFolder);

/* Rename / move folder */
router.patch("/:id", authMiddleware, updateFolder);

/* Move folder to trash */
router.delete("/:id", authMiddleware, deleteFolder);

module.exports = router;