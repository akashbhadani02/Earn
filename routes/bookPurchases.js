const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const BookPurchase = require("../models/BookPurchase");

router.post("/confirm", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name mobile");
    if (!user) return res.status(404).json({ success: false, message: "Student not found" });
    const receiptId = "ADU-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const purchase = await BookPurchase.create({
      user: user._id,
      studentName: user.name,
      mobile: user.mobile,
      amount: 499,
      upiId: "baa836610@okaxis",
      receiptId,
      status: "student_confirmed"
    });
    res.json({ success: true, purchase: { receiptId, studentName: user.name, mobile: user.mobile, amount: 499, upiId: purchase.upiId, status: purchase.status, createdAt: purchase.createdAt } });
  } catch (err) {
    console.error("Book purchase confirm error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
