// ============================================
// src/models/Draw.js — Monthly Draw Schema
// ============================================

const mongoose = require("mongoose");

const DrawSchema = new mongoose.Schema(
  {
    month:    { type: String, required: true, unique: true }, // e.g. "March 2026"
    drawDate: { type: Date,   required: true },
    status: {
      type:    String,
      enum:    ["upcoming", "simulated", "completed"],
      default: "upcoming",
    },
    // Draw logic: random or weighted by user scores
    drawMode: {
      type:    String,
      enum:    ["random", "algorithm"],
      default: "random",
    },
    // The 5 winning numbers (1-45), empty until draw runs
    drawnNumbers: {
      type:     [Number],
      default:  [],
      validate: {
        validator: (arr) => arr.length === 0 || arr.length === 5,
        message:   "Draw must have exactly 5 numbers",
      },
    },
    // Prize pool breakdown
    prizePool: {
      total:           { type: Number, default: 0 },
      fiveMatch:       { type: Number, default: 0 }, // 40%
      fourMatch:       { type: Number, default: 0 }, // 35%
      threeMatch:      { type: Number, default: 0 }, // 25%
      jackpotRollover: { type: Number, default: 0 }, // From prev month
    },
    participants: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Calculate prize pool from subscriber count
DrawSchema.methods.calculatePrizePool = function (subscriberCount, subscriptionFee) {
  const total = subscriberCount * subscriptionFee * 0.5; // 50% of all fees
  this.prizePool.total      = Math.round(total + this.prizePool.jackpotRollover);
  this.prizePool.fiveMatch  = Math.round(this.prizePool.total * 0.40);
  this.prizePool.fourMatch  = Math.round(this.prizePool.total * 0.35);
  this.prizePool.threeMatch = Math.round(this.prizePool.total * 0.25);
  return this;
};

// Generate random draw numbers
DrawSchema.methods.generateNumbers = function () {
  const nums = new Set();
  while (nums.size < 5) {
    nums.add(Math.floor(Math.random() * 45) + 1);
  }
  this.drawnNumbers = [...nums];
  return this;
};

module.exports = mongoose.model("Draw", DrawSchema);
