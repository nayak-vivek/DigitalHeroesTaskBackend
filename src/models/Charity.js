// ============================================
// src/models/Charity.js — Charity Schema
// ============================================

const mongoose = require("mongoose");

const CharitySchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Charity name is required"],
      trim:     true,
      unique:   true,
    },
    tagline:     { type: String, required: true },
    description: { type: String, required: true },
    category:    { type: String, required: true },
    image:       { type: String, default: "" },
    featured:    { type: Boolean, default: false },
    isActive:    { type: Boolean, default: true },
    // Fundraising stats
    raised:      { type: Number, default: 0 },
    goal:        { type: Number, required: true },
    supporters:  { type: Number, default: 0 },
    // Upcoming events
    upcomingEvents: [
      {
        name:     { type: String },
        date:     { type: Date },
        location: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Charity", CharitySchema);
