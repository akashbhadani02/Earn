const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const BookPurchase = require("../models/BookPurchase");
const adminAuth = require("../middleware/adminAuth");

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


// Student: read the admin-controlled book visibility flag.
router.get("/access", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("bookAccess isDeleted isBlocked").lean();
    if (!user || user.isDeleted || user.isBlocked) {
      return res.status(401).json({ success: false, message: "Account is not available" });
    }
    return res.json({ success: true, bookAccess: !!user.bookAccess });
  } catch (err) {
    console.error("Book access read error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Student: download the protected book only after admin has enabled access.
router.get("/download", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("bookAccess isDeleted isBlocked").lean();
    if (!user || user.isDeleted || user.isBlocked) {
      return res.status(401).json({ success: false, message: "Account is not available" });
    }
    if (!user.bookAccess) {
      return res.status(403).json({ success: false, message: "Book is not available yet. Please contact admin." });
    }
    return res.download(require("path").join(__dirname, "../public/books/book.pdf"), "book.pdf");
  } catch (err) {
    console.error("Book download error:", err);
    if (!res.headersSent) return res.status(500).json({ success: false, message: "Book download failed" });
  }
});

// Admin: Show/Close Book for a specific student.
router.put("/access/:id", adminAuth, async (req, res) => {
  try {
    const enabled = !!req.body.enabled;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { bookAccess: enabled },
      { new: true }
    ).select("_id name mobile bookAccess");
    if (!user) return res.status(404).json({ success: false, message: "User Not Found" });
    return res.json({
      success: true,
      message: enabled ? "Book shown to student." : "Book closed for student.",
      user: { id: String(user._id), name: user.name, mobile: user.mobile, bookAccess: !!user.bookAccess }
    });
  } catch (err) {
    console.error("Admin book access update error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;
