
const express = require("express");
const auth = require("../middleware/auth");
const { search, recent, trash } = require("../controllers/searchController");
const router = express.Router();
router.use(auth);
router.get("/", search);
router.get("/recent", recent);
router.get("/trash", trash);
module.exports = router;
