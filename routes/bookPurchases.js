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
const JWT_SECRET = process.env.JWT_SECRET;

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
        adminVerified: purchase.status === "admin_verified" && !!purchase.accessGranted && !!purchase.verifiedBy,
        downloadCount: Number(purchase.downloadCount || 0),
        lastDownloadAt: purchase.lastDownloadAt,
        createdAt: purchase.createdAt,
        verifiedAt: purchase.verifiedAt
      },
      canDownload: purchase.status === "admin_verified" && !!purchase.accessGranted && !!purchase.verifiedBy
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

// Admin: decline a pending payment confirmation. The student will no longer see a pending request.
router.put("/admin/:userId/decline", adminAuth, async (req, res) => {
  try {
    const purchase = await BookPurchase.findOne({ user: req.params.userId }).sort({ createdAt: -1 });
    if (!purchase) return res.status(404).json({ success: false, message: "No book purchase request found." });
    if (purchase.status === "admin_verified" && purchase.accessGranted) {
      return res.status(400).json({ success: false, message: "Book access is active. Close access before declining this request." });
    }
    purchase.status = "rejected";
    purchase.accessGranted = false;
    purchase.verifiedAt = null;
    purchase.verifiedBy = req.admin.id;
    await purchase.save();
    res.json({ success: true, message: "Payment request declined. It is no longer shown as pending to the student.", purchase });
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

// Create a short-lived viewer token. The browser PDF viewer can then load the
// PDF directly (streamed) without downloading the whole file into JavaScript.
router.get("/viewer-token", auth, async (req, res) => {
  try {
    const purchase = await BookPurchase.findOne({
      user: req.user.id,
      status: "admin_verified",
      status: "admin_verified",
      accessGranted: true,
      verifiedBy: { $exists: true, $ne: null }
    }).sort({ createdAt: -1 }).lean();
    if (!purchase) return res.status(403).json({ success: false, message: "Book access is not active." });
    const token = require("jsonwebtoken").sign(
      { uid: String(req.user.id), type: "book-view" },
      JWT_SECRET,
      { expiresIn: "5m" }
    );
    return res.json({ success: true, token });
  } catch (err) {
    console.error("Book viewer token error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Stream the PDF to the browser's built-in viewer. This is NOT a download endpoint.
router.get("/view", async (req, res) => {
  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(String(req.query.vt || ""), JWT_SECRET);
    if (decoded.type !== "book-view" || !decoded.uid) return res.status(403).end();

    const purchase = await BookPurchase.findOne({
      user: decoded.uid,
      status: "admin_verified",
      accessGranted: true,
      verifiedBy: { $exists: true, $ne: null }
    }).lean();
    if (!purchase) return res.status(403).end();

    const bookPath = path.join(__dirname, "..", "public", "books", "book.pdf");
    if (!fs.existsSync(bookPath)) return res.status(404).end();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=book.pdf");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "private, no-store, no-cache, must-revalidate");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.sendFile(bookPath);
  } catch (err) {
    return res.status(403).end();
  }
});
module.exports = router;
