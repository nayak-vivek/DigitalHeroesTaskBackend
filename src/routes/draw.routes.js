// ============================================
// src/routes/draw.routes.js
// GET  /api/draws              → all draws
// GET  /api/draws/my-history   → my wins
// GET  /api/draws/:id          → single draw
// POST /api/draws/simulate     → admin simulate
// POST /api/draws/:id/publish  → admin publish
// ============================================

const express = require("express");
const router  = express.Router();
const {
  getDraws, getDraw,
  simulateDraw, publishDraw,
  getMyDrawHistory,
} = require("../controllers/draw.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

router.use(protect); // All draw routes require login

router.get("/",           getDraws);
router.get("/my-history", getMyDrawHistory);
router.get("/:id",        getDraw);

// Admin only
router.post("/simulate",      adminOnly, simulateDraw);
router.post("/:id/publish",   adminOnly, publishDraw);

module.exports = router;
