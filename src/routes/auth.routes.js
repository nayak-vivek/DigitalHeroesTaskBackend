// ============================================
// src/routes/auth.routes.js
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me
// ============================================

const express    = require("express");
const router     = express.Router();
const { register, login, getMe } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", register);
router.post("/login",    login);
router.get("/me",        protect, getMe);  // Protected — needs JWT

module.exports = router;
