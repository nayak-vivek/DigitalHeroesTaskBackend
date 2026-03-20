// ============================================
// upload.middleware.js — Multer File Upload
// Winner proof screenshots save honge:
//   /uploads/proofs/
// ============================================
const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

// Create upload folders if they don't exist
const proofDir = path.join(__dirname, "../../uploads/proofs");
if (!fs.existsSync(proofDir)) fs.mkdirSync(proofDir, { recursive: true });

// Disk storage — original filename + timestamp prefix
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, proofDir),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `proof_${Date.now()}${ext}`;
    cb(null, name);
  },
});

// Only allow image files
const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, png, gif, webp)"), false);
  }
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});
