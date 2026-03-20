

const Draw   = require("../models/Draw");
const Winner = require("../models/Winner");
const Score  = require("../models/Score");
const Subscription = require("../models/Subscription");


exports.getDraws = async (req, res, next) => {
  try {
    const draws = await Draw.find().sort({ drawDate: -1 });
    res.json({ success: true, data: draws });
  } catch (error) {
    next(error);
  }
};


exports.getDraw = async (req, res, next) => {
  try {
    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, message: "Draw not found" });

    const winners = await Winner.find({ draw: req.params.id })
      .populate("user", "name email");

    res.json({ success: true, data: { draw, winners } });
  } catch (error) {
    next(error);
  }
};


exports.simulateDraw = async (req, res, next) => {
  try {
    const { drawId, mode = "random" } = req.body;

    const draw = await Draw.findById(drawId);
    if (!draw) return res.status(404).json({ success: false, message: "Draw not found" });

    let numbers;

    if (mode === "random") {
      // Standard lottery — pick 5 unique numbers from 1-45
      const numSet = new Set();
      while (numSet.size < 5) {
        numSet.add(Math.floor(Math.random() * 45) + 1);
      }
      numbers = [...numSet];
    } else {
      // Algorithmic — weighted by most/least frequent user scores
      const allScores = await Score.find();
      const freq = {};
      allScores.forEach(doc => {
        doc.entries.forEach(e => {
          freq[e.score] = (freq[e.score] || 0) + 1;
        });
      });
      // Sort by frequency descending, pick top 5
      const sorted = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([num]) => Number(num));
      numbers = sorted.length === 5
        ? sorted
        : [...new Set([...sorted, ...Array.from({ length: 5 }, () => Math.floor(Math.random() * 45) + 1)])].slice(0, 5);
    }

    res.json({ success: true, data: { numbers, mode, drawId } });
  } catch (error) {
    next(error);
  }
};


exports.publishDraw = async (req, res, next) => {
  try {
    const { drawnNumbers, mode = "random" } = req.body;

    if (!drawnNumbers || drawnNumbers.length !== 5) {
      return res.status(400).json({ success: false, message: "Exactly 5 numbers required" });
    }

    const draw = await Draw.findById(req.params.id);
    if (!draw) return res.status(404).json({ success: false, message: "Draw not found" });
    if (draw.status === "completed") {
      return res.status(400).json({ success: false, message: "Draw already completed" });
    }

    // Save drawn numbers
    draw.drawnNumbers = drawnNumbers;
    draw.drawMode     = mode;
    draw.status       = "completed";

  
    const activeSubs = await Subscription.find({ status: "active" }).select("user");
    const userIds = activeSubs.map(s => s.user);

    const winners = { "5-Number Match": [], "4-Number Match": [], "3-Number Match": [] };

    for (const userId of userIds) {
      const scoreDoc = await Score.findOne({ user: userId });
      if (!scoreDoc || scoreDoc.entries.length < 5) continue;

      const userNums = scoreDoc.entries.map(e => e.score);
      const matches  = userNums.filter(n => drawnNumbers.includes(n)).length;

      if (matches >= 3) {
        const key = `${matches}-Number Match`;
        winners[key].push(userId);
      }
    }

    // Create winner records, split prizes equally per tier
    const createdWinners = [];

    for (const [matchType, userList] of Object.entries(winners)) {
      if (userList.length === 0) continue;

      let poolKey = matchType === "5-Number Match" ? "fiveMatch"
                  : matchType === "4-Number Match" ? "fourMatch" : "threeMatch";

      // If no jackpot winner, rollover to next draw
      if (matchType === "5-Number Match" && userList.length === 0) {
        // handled below
      }

      const totalPrize  = draw.prizePool[poolKey];
      const prizeEach   = Math.round(totalPrize / userList.length);

      for (const userId of userList) {
        const winner = await Winner.create({
          draw: draw._id,
          user: userId,
          matchType,
          prize: prizeEach,
        });
        createdWinners.push(winner);
      }
    }

    // Jackpot rollover if no 5-match winner
    if (winners["5-Number Match"].length === 0) {
      const nextDraw = await Draw.findOne({ status: "upcoming" }).sort({ drawDate: 1 });
      if (nextDraw) {
        nextDraw.prizePool.jackpotRollover += draw.prizePool.fiveMatch;
        await nextDraw.save();
      }
    }

    await draw.save();

    res.json({
      success: true,
      message: "Draw published successfully",
      data: { draw, winners: createdWinners },
    });
  } catch (error) {
    next(error);
  }
};


exports.getMyDrawHistory = async (req, res, next) => {
  try {
    const myWins = await Winner.find({ user: req.user.id })
      .populate("draw", "month drawDate status drawnNumbers prizePool");

    res.json({ success: true, data: myWins });
  } catch (error) {
    next(error);
  }
};
