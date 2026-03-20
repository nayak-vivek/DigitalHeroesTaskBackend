// ============================================
// src/routes/admin.routes.js
// ALL routes: protect + adminOnly middleware
// ============================================

const express = require("express");
const router  = express.Router();
const {
  getAllUsers, getUserDetail, updateUser, editUserScores, deleteUser,
  createDraw,
  getAllWinners, verifyWinner, markPaid,
  getAnalytics,
} = require("../controllers/admin.controller");
const { protect, adminOnly } = require("../middleware/auth.middleware");

// Apply both middlewares to all admin routes
router.use(protect, adminOnly);

// --- Users ---
router.get("/users",                  getAllUsers);
router.get("/users/:id",              getUserDetail);
router.put("/users/:id",              updateUser);
router.put("/users/:id/scores",       editUserScores);
router.delete("/users/:id",           deleteUser);

// --- Draws ---
router.post("/draws",                 createDraw);

// --- Winners ---
router.get("/winners",                getAllWinners);
router.put("/winners/:id/verify",     verifyWinner);
router.put("/winners/:id/pay",        markPaid);

// --- Analytics ---
router.get("/analytics",              getAnalytics);

module.exports = router;
