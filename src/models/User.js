// ============================================
// src/models/User.js — User Schema
// Stores: name, email, hashed password, role
// ============================================

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Name is required"],
      trim:     true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type:     String,
      required: [true, "Email is required"],
      unique:   true,
      lowercase: true,
      trim:     true,
      match:    [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type:     String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select:   false, // Don't return password in queries by default
    },
    role: {
      type:    String,
      enum:    ["subscriber", "admin"],
      default: "subscriber",
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// =====================
// MIDDLEWARE (Hooks)
// =====================

// Hash password BEFORE saving to DB
UserSchema.pre("save", async function (next) {
  // Only hash if password was modified (not on profile updates)
  if (!this.isModified("password")) return next();

  // bcrypt salt rounds = 10 (higher = more secure but slower)
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// =====================
// METHODS
// =====================

// Compare entered password with hashed password in DB
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token for this user
UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role }, // Payload
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

module.exports = mongoose.model("User", UserSchema);
