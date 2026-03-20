// ============================================
// winner.routes.js
// GET  /api/winners/my-wins           → my winnings
// POST /api/winners/:id/upload-proof  → upload proof image
// ============================================
const express  = require("express");
const router   = express.Router();
const upload   = require("../middleware/upload.middleware");
const { protect } = require("../middleware/auth.middleware");
const { uploadProof, getMyWins } = require("../controllers/winner.controller");

router.use(protect); // all routes need login

router.get("/my-wins",                getMyWins);
router.post("/:id/upload-proof",      upload.single("proof"), uploadProof);

module.exports = router;
