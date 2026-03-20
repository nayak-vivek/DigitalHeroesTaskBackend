// ============================================
// src/utils/seeder.js
// Run: node src/utils/seeder.js
// Seeds DB with sample users, charities, draws
// ============================================

const mongoose = require("mongoose");
const dotenv   = require("dotenv");
dotenv.config();

const User         = require("../models/User");
const Subscription = require("../models/Subscription");
const Score        = require("../models/Score");
const Charity      = require("../models/Charity");
const Draw         = require("../models/Draw");

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB connected for seeding...");
});

// ---- Sample Charities ----
const charities = [
  {
    name:        "Green Fairways Foundation",
    tagline:     "Bringing golf to underprivileged youth",
    description: "We provide free golf training, equipment, and coaching to children from low-income families across India.",
    category:    "Youth Sports",
    image:       "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&q=80",
    featured:    true,
    raised:      1245000,
    goal:        2000000,
    supporters:  342,
    upcomingEvents: [{ name: "Charity Golf Day", date: new Date("2026-04-12"), location: "DLF Golf, Gurugram" }],
  },
  {
    name:        "Fore the Children",
    tagline:     "Every stroke helps a child smile",
    description: "We fund education and healthcare for orphaned children.",
    category:    "Child Welfare",
    image:       "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&q=80",
    featured:    true,
    raised:      875000,
    goal:        1500000,
    supporters:  218,
  },
  {
    name:        "Caddie Support Trust",
    tagline:     "Supporting those who support the game",
    description: "We provide financial aid, insurance, and skill training to golf caddies.",
    category:    "Livelihoods",
    image:       "https://images.unsplash.com/photo-1461897104016-0b3b00cc81ee?w=400&q=80",
    featured:    false,
    raised:      430000,
    goal:        800000,
    supporters:  154,
  },
  {
    name:        "Swing for Seniors",
    tagline:     "Keeping seniors active and connected",
    description: "We organise free golf programmes for the elderly.",
    category:    "Elder Care",
    image:       "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    featured:    false,
    raised:      210000,
    goal:        500000,
    supporters:  89,
  },
];

// ---- Sample Draws ----
const getDraws = (charityIds) => [
  {
    month:       "March 2026",
    drawDate:    new Date("2026-03-31"),
    status:      "upcoming",
    participants: 170,
    prizePool:   { total: 85000, fiveMatch: 34000, fourMatch: 29750, threeMatch: 21250, jackpotRollover: 12000 },
  },
  {
    month:        "February 2026",
    drawDate:     new Date("2026-02-28"),
    status:       "completed",
    drawnNumbers: [38, 12, 27, 5, 41],
    participants: 146,
    prizePool:    { total: 73000, fiveMatch: 29200, fourMatch: 25550, threeMatch: 18250, jackpotRollover: 0 },
  },
];

// ---- Main seed function ----
const seedDB = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Subscription.deleteMany();
    await Score.deleteMany();
    await Charity.deleteMany();
    await Draw.deleteMany();
    console.log("🗑️  Cleared existing data");

    // Insert charities
    const insertedCharities = await Charity.insertMany(charities);
    console.log(`✅ ${insertedCharities.length} charities seeded`);

    // Insert draws
    const insertedDraws = await Draw.insertMany(getDraws(insertedCharities));
    console.log(`✅ ${insertedDraws.length} draws seeded`);

    // Create admin user
    const admin = await User.create({
      name:     "Admin User",
      email:    "admin@golfgives.in",
      password: "admin123",
      role:     "admin",
    });
    await Subscription.create({
      user: admin._id, plan: "yearly", amount: 4999,
      renewalDate: new Date("2027-01-01"), status: "active",
      charityPercent: 10,
    });
    await Score.create({ user: admin._id, entries: [] });

    // Create test subscriber
    const subscriber = await User.create({
      name:     "Arjun Sharma",
      email:    "arjun@example.com",
      password: "test123",
      role:     "subscriber",
    });
    const subRenewal = new Date();
    subRenewal.setMonth(subRenewal.getMonth() + 1);

    await Subscription.create({
      user:           subscriber._id,
      plan:           "monthly",
      amount:         499,
      renewalDate:    subRenewal,
      status:         "active",
      charity:        insertedCharities[0]._id,
      charityPercent: 15,
    });
    await Score.create({
      user: subscriber._id,
      entries: [
        { score: 38, date: new Date("2026-03-15") },
        { score: 35, date: new Date("2026-02-28") },
        { score: 42, date: new Date("2026-02-10") },
        { score: 31, date: new Date("2026-01-25") },
        { score: 36, date: new Date("2026-01-08") },
      ],
    });

    console.log("✅ Users seeded:");
    console.log("   Admin     → admin@golfgives.in   / admin123");
    console.log("   Subscriber→ arjun@example.com    / test123");
    console.log("\n🎉 Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

seedDB();
