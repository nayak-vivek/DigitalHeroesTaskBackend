// ============================================
// src/models/Winner.js — Draw Winner Schema
// Tracks verification and payout state
// ============================================

const mongoose = require("mongoose");

const WinnerSchema = new mongoose.Schema(
  {
    draw:  { type: mongoose.Schema.Types.ObjectId, ref: "Draw",  required: true },
    user:  { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
    matchType: {
      type:     String,
      enum:     ["5-Number Match", "4-Number Match", "3-Number Match"],
      required: true,
    },
    prize:   { type: Number, required: true },
    // Verification
    verificationStatus: {
      type:    String,
      enum:    ["pending", "approved", "rejected"],
      default: "pending",
    },
    proofImage: { type: String, default: "" }, // Uploaded screenshot path
    // Payment
    paymentStatus: {
      type:    String,
      enum:    ["pending", "paid"],
      default: "pending",
    },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Winner", WinnerSchema);
