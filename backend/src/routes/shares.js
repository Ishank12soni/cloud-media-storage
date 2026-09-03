
const express = require("express");
const auth = require("../middleware/auth");
const {
  createShare, getShares, deleteShare, getSharedWithMe,
  createPublicLink, getPublicLinks, deletePublicLink
} = require("../controllers/shareController");
const router = express.Router();
router.use(auth);
router.post("/", createShare);
router.get("/", getShares);
router.delete("/:id", deleteShare);
router.get("/shared-with-me", getSharedWithMe);
router.get("/public", getPublicLinks);
router.post("/public", createPublicLink);
router.delete("/public/:id", deletePublicLink);
module.exports = router;
