const express = require("express");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const router = express.Router();
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const User = require("../models/User");
const Admin = require("../models/Admin");
const BookPurchase = require("../models/BookPurchase");

const BOOK_PRICE = 499;
const UPI_ID = "baa836610@okaxis";

router.get("/status", auth, async (req, res) => {
  try {
    const purchase = await BookPurchase.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    if (!purchase) return res.json({ success: true, purchase: null, canDownload: false });
    return res.json({
      success: true,
      purchase: {
        receiptId: purchase.receiptId,
        studentName: purchase.studentName,
        mobile: purchase.mobile,
        amount: purchase.amount,
        upiId: purchase.upiId,
        status: purchase.status,
        accessGranted: !!purchase.accessGranted,
        downloadCount: Number(purchase.downloadCount || 0),
        lastDownloadAt: purchase.lastDownloadAt,
        createdAt: purchase.createdAt,
        verifiedAt: purchase.verifiedAt
      },
      canDownload: purchase.status === "admin_verified" && !!purchase.accessGranted
    });
  } catch (err) {
    console.error("Book status error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/confirm", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name mobile");
    if (!user) return res.status(404).json({ success: false, message: "Student not found" });

    const existingPending = await BookPurchase.findOne({ user: user._id, status: "student_confirmed" }).sort({ createdAt: -1 });
    if (existingPending) {
      return res.json({ success: true, message: "Payment confirmation already submitted. Admin verification is pending.", purchase: existingPending });
    }

    const receiptId = "ADU-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const purchase = await BookPurchase.create({
      user: user._id,
      studentName: user.name,
      mobile: user.mobile,
      amount: BOOK_PRICE,
      upiId: UPI_ID,
      receiptId,
      status: "student_confirmed",
      accessGranted: false
    });
    res.json({ success: true, purchase });
  } catch (err) {
    console.error("Book purchase confirm error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: list the latest purchase for every active student.
router.get("/admin/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find({ isDeleted: { $ne: true } }).select("name mobile").lean();
    const ids = users.map(u => u._id);
    const purchases = await BookPurchase.find({ user: { $in: ids } }).sort({ createdAt: -1 }).lean();
    const latest = new Map();
    for (const purchase of purchases) if (!latest.has(String(purchase.user))) latest.set(String(purchase.user), purchase);
    res.json({ success: true, users: users.map(u => ({
      userId: String(u._id), name: u.name || "Student", mobile: u.mobile || "", purchase: latest.get(String(u._id)) || null
    })) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: verify payment and grant book access.
router.put("/admin/:userId/show", adminAuth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId, isDeleted: { $ne: true } });
    if (!user) return res.status(404).json({ success: false, message: "Student not found" });
    const purchase = await BookPurchase.findOne({ user: user._id }).sort({ createdAt: -1 });
    if (!purchase) return res.status(404).json({ success: false, message: "No book payment confirmation found for this student." });
    purchase.status = "admin_verified";
    purchase.accessGranted = true;
    purchase.verifiedAt = new Date();
    purchase.verifiedBy = req.admin.id;
    await purchase.save();
    res.json({ success: true, message: "Payment verified and book access granted.", purchase });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: revoke access without deleting payment history.
router.put("/admin/:userId/close", adminAuth, async (req, res) => {
  try {
    const purchase = await BookPurchase.findOne({ user: req.params.userId }).sort({ createdAt: -1 });
    if (!purchase) return res.status(404).json({ success: false, message: "No book purchase found." });
    purchase.accessGranted = false;
    await purchase.save();
    res.json({ success: true, message: "Book access closed for this student." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Secure download: the PDF is not exposed through the public static folder.
router.get("/download", auth, async (req, res) => {
  try {
    const purchase = await BookPurchase.findOne({ user: req.user.id, status: "admin_verified", accessGranted: true }).sort({ createdAt: -1 });
    if (!purchase) return res.status(403).json({ success: false, message: "Book access is not active. Please wait for admin verification." });
    const bookPath = path.join(__dirname, "..", "public", "books", "book.pdf");
    if (!fs.existsSync(bookPath)) return res.status(404).json({ success: false, message: "Book PDF not found on server." });
    purchase.downloadCount = Number(purchase.downloadCount || 0) + 1;
    purchase.lastDownloadAt = new Date();
    await purchase.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="book.pdf"');
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    return res.sendFile(bookPath);
  } catch (err) {
    console.error("Secure book download error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
