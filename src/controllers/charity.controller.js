
const Charity = require("../models/Charity");
const path    = require("path");
const fs      = require("fs");

const getImageUrl = (req, filename) => {
  if (!filename) return "";
  // If already a full URL (e.g. from seeder), return as-is
  if (filename.startsWith("http")) return filename;
  return `${req.protocol}://${req.get("host")}/uploads/charities/${filename}`;
};


exports.getCharities = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name:    { $regex: search, $options: "i" } },
        { tagline: { $regex: search, $options: "i" } },
      ];
    }
    if (category && category !== "All") {
      query.category = category;
    }

    const charities = await Charity.find(query).sort({ featured: -1, createdAt: -1 });

    // Add full image URL to each charity
    const data = charities.map((c) => ({
      ...c.toObject(),
      image: getImageUrl(req, c.image),
    }));

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};


exports.getCharity = async (req, res, next) => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) {
      return res.status(404).json({ success: false, message: "Charity not found" });
    }
    res.json({
      success: true,
      data: { ...charity.toObject(), image: getImageUrl(req, charity.image) },
    });
  } catch (error) {
    next(error);
  }
};

exports.createCharity = async (req, res, next) => {
  try {
    const {
      name, tagline, description, category,
      goal, featured, upcomingEvents,
    } = req.body;

    // Validate required fields
    if (!name || !tagline || !description || !category || !goal) {
      return res.status(400).json({
        success: false,
        message: "name, tagline, description, category, goal are required",
      });
    }

    // Image filename from multer (if uploaded)
    const imageFile = req.file ? req.file.filename : "";

    // Parse upcomingEvents if sent as JSON string
    let events = [];
    if (upcomingEvents) {
      try { events = JSON.parse(upcomingEvents); } catch (_) { events = []; }
    }

    const charity = await Charity.create({
      name,
      tagline,
      description,
      category,
      goal:            Number(goal),
      featured:        featured === "true" || featured === true,
      image:           imageFile,
      upcomingEvents:  events,
    });

    res.status(201).json({
      success: true,
      data: { ...charity.toObject(), image: getImageUrl(req, charity.image) },
    });
  } catch (error) {
    next(error);
  }
};


exports.updateCharity = async (req, res, next) => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) {
      return res.status(404).json({ success: false, message: "Charity not found" });
    }

    const { name, tagline, description, category, goal, featured, upcomingEvents } = req.body;

    // If new image uploaded → delete old image file
    if (req.file) {
      const oldPath = path.join(__dirname, "../../uploads/charities", charity.image);
      if (charity.image && !charity.image.startsWith("http") && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath); // delete old file
      }
      charity.image = req.file.filename;
    }

    if (name)        charity.name        = name;
    if (tagline)     charity.tagline     = tagline;
    if (description) charity.description = description;
    if (category)    charity.category    = category;
    if (goal)        charity.goal        = Number(goal);
    if (featured !== undefined) charity.featured = featured === "true" || featured === true;
    if (upcomingEvents) {
      try { charity.upcomingEvents = JSON.parse(upcomingEvents); } catch (_) {}
    }

    await charity.save();

    res.json({
      success: true,
      data: { ...charity.toObject(), image: getImageUrl(req, charity.image) },
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCharity = async (req, res, next) => {
  try {
    const charity = await Charity.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!charity) {
      return res.status(404).json({ success: false, message: "Charity not found" });
    }
    res.json({ success: true, message: "Charity removed" });
  } catch (error) {
    next(error);
  }
};
