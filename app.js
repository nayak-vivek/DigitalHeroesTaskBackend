// ============================================
// app.js — Express Application Setup
// ============================================
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const dotenv  = require("dotenv");

dotenv.config();

const connectDB = require("./src/config/db");
connectDB();

const app = express();

// ── Middleware ──────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded files as static ─────────
// Access via: http://localhost:5000/uploads/proofs/filename.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Routes ──────────────────────────────────
app.use("/api/auth",      require("./src/routes/auth.routes"));
app.use("/api/users",     require("./src/routes/user.routes"));
app.use("/api/scores",    require("./src/routes/score.routes"));
app.use("/api/draws",     require("./src/routes/draw.routes"));
app.use("/api/charities", require("./src/routes/charity.routes"));
app.use("/api/winners",   require("./src/routes/winner.routes"));  // ← NEW
app.use("/api/admin",     require("./src/routes/admin.routes"));

// Health check
app.get("/api/health", (_req, res) =>
  res.json({ status: "OK", message: "GolfGives API running ⛳" })
);

// 404
app.use((_req, res) =>
  res.status(404).json({ success: false, message: "Route not found" })
);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
