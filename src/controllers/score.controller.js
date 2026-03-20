

const Score = require("../models/Score");


exports.getMyScores = async (req, res, next) => {
  try {
    let scoreDoc = await Score.findOne({ user: req.user.id });

    // If no document yet, create empty one
    if (!scoreDoc) {
      scoreDoc = await Score.create({ user: req.user.id, entries: [] });
    }

    res.json({ success: true, data: scoreDoc.entries });
  } catch (error) {
    next(error);
  }
};


exports.addScore = async (req, res, next) => {
  try {
    const { score, date } = req.body;

    // Validate
    if (!score || !date) {
      return res.status(400).json({ success: false, message: "Score and date are required" });
    }
    if (score < 1 || score > 45) {
      return res.status(400).json({ success: false, message: "Score must be between 1 and 45" });
    }

    let scoreDoc = await Score.findOne({ user: req.user.id });
    if (!scoreDoc) {
      scoreDoc = new Score({ user: req.user.id, entries: [] });
    }

    // addScore method handles the 5-score rolling logic
    await scoreDoc.addScore(Number(score), new Date(date));

    res.status(201).json({ success: true, data: scoreDoc.entries });
  } catch (error) {
    next(error);
  }
};


exports.updateScore = async (req, res, next) => {
  try {
    const { score, date } = req.body;

    if (score < 1 || score > 45) {
      return res.status(400).json({ success: false, message: "Score must be between 1 and 45" });
    }

    const scoreDoc = await Score.findOne({ user: req.user.id });
    if (!scoreDoc) {
      return res.status(404).json({ success: false, message: "No scores found" });
    }

    // Find the specific entry by its sub-document _id
    const entry = scoreDoc.entries.id(req.params.entryId);
    if (!entry) {
      return res.status(404).json({ success: false, message: "Score entry not found" });
    }

    entry.score = Number(score);
    if (date) entry.date = new Date(date);

    await scoreDoc.save();
    res.json({ success: true, data: scoreDoc.entries });
  } catch (error) {
    next(error);
  }
};

exports.deleteScore = async (req, res, next) => {
  try {
    const scoreDoc = await Score.findOne({ user: req.user.id });
    if (!scoreDoc) {
      return res.status(404).json({ success: false, message: "No scores found" });
    }

    // Pull removes sub-document by id
    scoreDoc.entries.pull({ _id: req.params.entryId });
    await scoreDoc.save();

    res.json({ success: true, data: scoreDoc.entries });
  } catch (error) {
    next(error);
  }
};
