// ============================================
// src/models/Score.js — Golf Score Schema
// Rules: max 5 scores, range 1-45, newest first
// ============================================

const mongoose = require("mongoose");

// Sub-schema for a single score entry
const ScoreEntrySchema = new mongoose.Schema({
  score: {
    type:     Number,
    required: [true, "Score value is required"],
    min:      [1,  "Score must be at least 1"],
    max:      [45, "Score cannot exceed 45 (Stableford max)"],
  },
  date: {
    type:     Date,
    required: [true, "Date is required"],
  },
}, { _id: true });

// Main scores document (one per user)
const ScoreSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true, // One scores document per user
    },
    // Array of up to 5 score entries
    entries: {
      type:     [ScoreEntrySchema],
      validate: {
        validator: (arr) => arr.length <= 5,
        message:   "Cannot store more than 5 scores",
      },
    },
  },
  { timestamps: true }
);

// =====================
// METHODS
// =====================

// Add a new score — replaces oldest if already 5
ScoreSchema.methods.addScore = function (score, date) {
  // Add new score at the beginning (newest first)
  this.entries.unshift({ score, date });

  // If more than 5, remove the oldest (last element)
  if (this.entries.length > 5) {
    this.entries.pop();
  }

  return this.save();
};

module.exports = mongoose.model("Score", ScoreSchema);
