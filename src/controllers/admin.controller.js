

const User         = require("../models/User");
const Subscription = require("../models/Subscription");
const Score        = require("../models/Score");
const Draw         = require("../models/Draw");
const Winner       = require("../models/Winner");
const Charity      = require("../models/Charity");


exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name:  { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

   
    const usersWithSubs = await Promise.all(
      users.map(async (u) => {
        const sub = await Subscription.findOne({ user: u._id }).select("plan status renewalDate");
        return { ...u.toObject(), subscription: sub };
      })
    );

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      data: usersWithSubs,
    });
  } catch (error) {
    next(error);
  }
};


exports.getUserDetail = async (req, res, next) => {
  try {
    const user  = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const sub    = await Subscription.findOne({ user: req.params.id }).populate("charity", "name");
    const scores = await Score.findOne({ user: req.params.id });
    const wins   = await Winner.find({ user: req.params.id }).populate("draw", "month");

    res.json({ success: true, data: { user, subscription: sub, scores, wins } });
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isActive },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.editUserScores = async (req, res, next) => {
  try {
    const { entries } = req.body; // Array of {score, date}
    const scoreDoc = await Score.findOneAndUpdate(
      { user: req.params.id },
      { entries },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: scoreDoc });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Subscription.findOneAndDelete({ user: req.params.id });
    await Score.findOneAndDelete({ user: req.params.id });
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    next(error);
  }
};


exports.createDraw = async (req, res, next) => {
  try {
    const { month, drawDate } = req.body;

    // Check for existing upcoming draw
    const existing = await Draw.findOne({ month });
    if (existing) {
      return res.status(400).json({ success: false, message: "Draw for this month already exists" });
    }

    // Auto-calculate prize pool from active subscribers
    const activeSubs = await Subscription.find({ status: "active" });
    const totalRevenue = activeSubs.reduce((sum, s) => {
      const monthly = s.plan === "yearly" ? s.amount / 12 : s.amount;
      return sum + monthly;
    }, 0);

    const draw = new Draw({ month, drawDate, participants: activeSubs.length });
    draw.calculatePrizePool(activeSubs.length, totalRevenue / activeSubs.length || 499);

    // Carry forward jackpot rollover from previous draw if any
    const prevDraw = await Draw.findOne({ status: "completed" }).sort({ drawDate: -1 });
    if (prevDraw && prevDraw.drawnNumbers.length > 0) {
      // Check if there was a jackpot winner last month
      const jackpotWin = await Winner.findOne({ draw: prevDraw._id, matchType: "5-Number Match" });
      if (!jackpotWin) {
        draw.prizePool.jackpotRollover = prevDraw.prizePool.fiveMatch;
        draw.prizePool.total += draw.prizePool.jackpotRollover;
        draw.prizePool.fiveMatch = Math.round(draw.prizePool.total * 0.40);
      }
    }

    await draw.save();
    res.status(201).json({ success: true, data: draw });
  } catch (error) {
    next(error);
  }
};

exports.getAllWinners = async (req, res, next) => {
  try {
    const winners = await Winner.find()
      .populate("user", "name email")
      .populate("draw", "month drawDate")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: winners.length, data: winners });
  } catch (error) {
    next(error);
  }
};


exports.verifyWinner = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body; // status: "approved" | "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
    }

    const winner = await Winner.findByIdAndUpdate(
      req.params.id,
      { verificationStatus: status, adminNote: adminNote || "" },
      { new: true }
    ).populate("user", "name email");

    if (!winner) return res.status(404).json({ success: false, message: "Winner not found" });

    res.json({ success: true, data: winner });
  } catch (error) {
    next(error);
  }
};

exports.markPaid = async (req, res, next) => {
  try {
    const winner = await Winner.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "paid" },
      { new: true }
    );
    if (!winner) return res.status(404).json({ success: false, message: "Winner not found" });
    res.json({ success: true, data: winner });
  } catch (error) {
    next(error);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeSubscribers,
      monthlyCount,
      yearlyCount,
      totalCharities,
      completedDraws,
      totalWinners,
    ] = await Promise.all([
      User.countDocuments(),
      Subscription.countDocuments({ status: "active" }),
      Subscription.countDocuments({ status: "active", plan: "monthly" }),
      Subscription.countDocuments({ status: "active", plan: "yearly" }),
      Charity.countDocuments({ isActive: true }),
      Draw.countDocuments({ status: "completed" }),
      Winner.countDocuments(),
    ]);

    // Total revenue (approximate)
    const subs = await Subscription.find({ status: "active" });
    const monthlyRevenue = subs.reduce((sum, s) => {
      return sum + (s.plan === "yearly" ? s.amount / 12 : s.amount);
    }, 0);

    // Total charity contributions
    const charityTotal = subs.reduce((sum, s) => {
      const monthly = s.plan === "yearly" ? s.amount / 12 : s.amount;
      return sum + (monthly * s.charityPercent) / 100;
    }, 0);

    // Upcoming draw pool
    const upcomingDraw = await Draw.findOne({ status: "upcoming" }).sort({ drawDate: 1 });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeSubscribers,
        monthlyCount,
        yearlyCount,
        totalCharities,
        completedDraws,
        totalWinners,
        monthlyRevenue: Math.round(monthlyRevenue),
        charityTotal:   Math.round(charityTotal),
        currentPrizePool: upcomingDraw?.prizePool.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
