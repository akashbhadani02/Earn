const mongoose = require("mongoose");

const brandingSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: "global" },
  logoData: { type: String, default: "" },
  version: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("Branding", brandingSchema);
