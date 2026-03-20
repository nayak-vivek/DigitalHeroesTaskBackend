
const Winner = require("../models/Winner");
const path   = require("path");


exports.uploadProof = async (req, res, next) => {
  try {
    const winner = await Winner.findById(req.params.id);

    if (!winner) {
      return res.status(404).json({ success: false, message: "Winner record not found" });
    }

    // Only the winner themselves can upload proof
    if (winner.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload an image file" });
    }

    // Save the uploaded file URL
    const proofUrl = `${req.protocol}://${req.get("host")}/uploads/proofs/${req.file.filename}`;
    winner.proofImage = proofUrl;
    await winner.save();

    res.json({
      success: true,
      message: "Proof uploaded successfully! Admin will review it.",
      data: { proofImage: proofUrl },
    });
  } catch (error) {
    next(error);
  }
};


exports.getMyWins = async (req, res, next) => {
  try {
    const wins = await Winner.find({ user: req.user.id })
      .populate("draw", "month drawDate drawnNumbers")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: wins });
  } catch (error) {
    next(error);
  }
};
