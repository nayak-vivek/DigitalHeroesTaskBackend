// ============================================
// src/routes/score.routes.js
// GET    /api/scores          → get my scores
// POST   /api/scores          → add new score
// PUT    /api/scores/:entryId → update one entry
// DELETE /api/scores/:entryId → delete one entry
// ============================================

const express = require("express");
const router  = express.Router();
const {
  getMyScores, addScore, updateScore, deleteScore,
} = require("../controllers/score.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect); // All score routes require login

router.route("/")
  .get(getMyScores)
  .post(addScore);

router.route("/:entryId")
  .put(updateScore)
  .delete(deleteScore);

module.exports = router;
