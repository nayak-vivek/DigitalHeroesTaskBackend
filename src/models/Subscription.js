// ============================================
// src/models/Subscription.js
// Tracks user subscription plan & status
// ============================================

const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema(
  {
    // Reference to User
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      unique:   true, // One subscription per user
    },
    plan: {
      type:     String,
      enum:     ["monthly", "yearly"],
      required: true,
    },
    status: {
      type:    String,
      enum:    ["active", "inactive", "lapsed", "cancelled"],
      default: "active",
    },
    amount: {
      type:     Number,
      required: true,
      // monthly = 499, yearly = 4999
    },
    startDate: {
      type:    Date,
      default: Date.now,
    },
    renewalDate: {
      type:     Date,
      required: true,
    },
    // Stripe payment info (stored after successful payment)
    stripeCustomerId:     { type: String },
    stripeSubscriptionId: { type: String },
    // Charity this subscription supports
    charity: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "Charity",
    },
    // What % of subscription goes to charity (min 10%)
    charityPercent: {
      type:    Number,
      default: 10,
      min:     [10, "Minimum charity contribution is 10%"],
      max:     [100, "Cannot exceed 100%"],
    },
  },
  { timestamps: true }
);

// Virtual: calculated charity amount per month
SubscriptionSchema.virtual("charityAmount").get(function () {
  const monthly = this.plan === "yearly" ? this.amount / 12 : this.amount;
  return Math.round(monthly * (this.charityPercent / 100));
});

module.exports = mongoose.model("Subscription", SubscriptionSchema);
