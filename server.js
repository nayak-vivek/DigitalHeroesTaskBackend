// ============================================
// server.js — Entry Point
// Starts the HTTP server
// ============================================

const app = require("./app");

// Load env variables
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// Start listening
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections (e.g. DB errors)
process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
