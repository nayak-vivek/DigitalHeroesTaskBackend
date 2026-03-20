// ============================================
// src/middleware/auth.middleware.js
// Protects routes — verifies JWT token
// ============================================

const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// --- protect ---
// Use on any route that requires login
// Reads token from Authorization header: "Bearer <token>"
const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized — no token provided",
    });
  }

  try {
    // Verify token signature and expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the logged-in user to req.user (available in controllers)
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized — token invalid or expired",
    });
  }
};

// --- adminOnly ---
// Use AFTER protect middleware
// Checks that the logged-in user is an admin
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: "Access denied — admin only",
  });
};

module.exports = { protect, adminOnly };
