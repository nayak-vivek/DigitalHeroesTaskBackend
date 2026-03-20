
const User         = require("../models/User");
const Subscription = require("../models/Subscription");
const Score        = require("../models/Score");

// Helper: send JWT token in response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
};


exports.register = async (req, res, next) => {
  try {
    const {
      name, email, password,
      role = "subscriber",        // accept role from frontend
      plan, charityId, charityPercent,
    } = req.body;

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create user with role
    const user = await User.create({ name, email, password, role });

    // Create subscription (admin gets a default yearly subscription)
    const actualPlan  = plan || (role === "admin" ? "yearly" : "monthly");
    const amount      = actualPlan === "yearly" ? 4999 : 499;
    const renewalDate = new Date();
    if (actualPlan === "yearly") renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    else renewalDate.setMonth(renewalDate.getMonth() + 1);

    await Subscription.create({
      user:           user._id,
      plan:           actualPlan,
      amount,
      renewalDate,
      status:         "active",
      charity:        charityId || null,
      charityPercent: charityPercent || 10,
    });

    // Create empty scores document
    await Score.create({ user: user._id, entries: [] });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};


exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user — password is select:false by default so we override
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};



exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const subscription = await Subscription.findOne({ user: req.user.id })
      .populate("charity", "name image tagline");

    res.json({
      success: true,
      data: { user, subscription },
    });
  } catch (error) {
    next(error);
  }
};
