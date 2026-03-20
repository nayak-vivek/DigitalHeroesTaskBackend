

const User         = require("../models/User");
const Subscription = require("../models/Subscription");


exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const sub  = await Subscription.findOne({ user: req.user.id }).populate("charity", "name image tagline");
    res.json({ success: true, data: { user, subscription: sub } });
  } catch (error) {
    next(error);
  }
};


exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    );
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};


exports.updateCharity = async (req, res, next) => {
  try {
    const { charityId, charityPercent } = req.body;

    if (charityPercent < 10) {
      return res.status(400).json({ success: false, message: "Minimum charity contribution is 10%" });
    }

    const sub = await Subscription.findOneAndUpdate(
      { user: req.user.id },
      { charity: charityId, charityPercent },
      { new: true }
    ).populate("charity", "name image");

    res.json({ success: true, data: sub });
  } catch (error) {
    next(error);
  }
};


exports.getSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ user: req.user.id })
      .populate("charity", "name image tagline");
    if (!sub) {
      return res.status(404).json({ success: false, message: "No subscription found" });
    }
    res.json({ success: true, data: sub });
  } catch (error) {
    next(error);
  }
};


exports.createSubscription = async (req, res, next) => {
  try {
    const { plan, charityId, charityPercent, stripeCustomerId, stripeSubscriptionId } = req.body;

    const amount      = plan === "yearly" ? 4999 : 499;
    const renewalDate = new Date();
    if (plan === "yearly") renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    else renewalDate.setMonth(renewalDate.getMonth() + 1);

    // Upsert — create or update existing
    const sub = await Subscription.findOneAndUpdate(
      { user: req.user.id },
      {
        plan, amount, renewalDate, status: "active",
        charity: charityId, charityPercent: charityPercent || 10,
        stripeCustomerId, stripeSubscriptionId,
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({ success: true, data: sub });
  } catch (error) {
    next(error);
  }
};


exports.cancelSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findOneAndUpdate(
      { user: req.user.id },
      { status: "cancelled" },
      { new: true }
    );
    res.json({ success: true, message: "Subscription cancelled", data: sub });
  } catch (error) {
    next(error);
  }
};
