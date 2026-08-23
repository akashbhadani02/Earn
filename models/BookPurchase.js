const mongoose = require("mongoose");

const bookPurchaseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  studentName: { type: String, required: true, trim: true },
  mobile: { type: String, default: "", trim: true },
  amount: { type: Number, default: 499 },
  upiId: { type: String, default: "baa836610@okaxis" },
  receiptId: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ["student_confirmed", "admin_verified", "rejected"], default: "student_confirmed" },
  createdAt: { type: Date, default: Date.now },
  verifiedAt: { type: Date, default: null },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null }
}, { timestamps: true });

module.exports = mongoose.model("BookPurchase", bookPurchaseSchema);
