// ============================================
// charity.routes.js
// GET  /api/charities       → public
// POST /api/charities       → admin + image upload
// PUT  /api/charities/:id   → admin + image upload
// DELETE /api/charities/:id → admin
// ============================================
const express  = require("express");
const router   = express.Router();
const upload   = require("../middleware/upload.middleware");
const { protect, adminOnly } = require("../middleware/auth.middleware");
const {
  getCharities, getCharity,
  createCharity, updateCharity, deleteCharity,
} = require("../controllers/charity.controller");

// Public
router.get("/",    getCharities);
router.get("/:id", getCharity);

// Admin — upload.single("image") multer middleware lagate hain
router.post("/",    protect, adminOnly, upload.single("image"), createCharity);
router.put("/:id",  protect, adminOnly, upload.single("image"), updateCharity);
router.delete("/:id", protect, adminOnly, deleteCharity);

module.exports = router;
