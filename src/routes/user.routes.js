// ============================================
// src/routes/user.routes.js
// All routes require JWT (protect middleware)
// ============================================

const express = require("express");
const router  = express.Router();
const {
  getProfile, updateProfile,
  getSubscription, createSubscription, cancelSubscription,
  updateCharity,
} = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

// All user routes are protected
router.use(protect);

router.get("/profile",                getProfile);
router.put("/profile",                updateProfile);
router.put("/charity",                updateCharity);
router.get("/subscription",           getSubscription);
router.post("/subscription",          createSubscription);
router.put("/subscription/cancel",    cancelSubscription);

module.exports = router;
