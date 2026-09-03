
const express = require("express");
const auth = require("../middleware/auth");
const { getStars, addStar, removeStar } = require("../controllers/starController");
const router = express.Router();
router.use(auth);
router.get("/", getStars);
router.post("/", addStar);
router.delete("/", removeStar);
module.exports = router;
