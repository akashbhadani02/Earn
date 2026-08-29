const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

const BOOK_PRICE = 499;

// Student: see current book access status
router.get("/status", auth, async (req, res) => {
    const user = await User.findById(req.user.id).select("bookPurchase").lean();
    res.set("Cache-Control", "no-store");
    res.json({ success: true, bookPurchase: user?.bookPurchase || { status: "none", price: BOOK_PRICE } });
});

// Student: submit payment reference for manual admin verification
router.post("/request", auth, async (req, res) => {
    const paymentReference = String(req.body?.paymentReference || "").trim();
    if (paymentReference.length < 3) {
        return res.status(400).json({ success: false, message: "Please enter a valid payment reference / UTR." });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "Student not found" });
    if (user.bookPurchase?.status === "approved") {
        return res.json({ success: true, message: "Book access is already approved.", status: "approved" });
    }
    user.bookPurchase = {
        status: "pending",
        price: BOOK_PRICE,
        paymentReference,
        requestedAt: new Date(),
        approvedAt: null,
        adminNote: "",
        access: false
    };
    await user.save();
    res.json({ success: true, message: "Payment request sent to admin for verification.", status: "pending" });
});


// Student: purchase book directly using available wallet balance.
// Wallet payment is immediately verifiable, so access is approved automatically.
router.post("/wallet-purchase", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "Student not found" });
        if (user.bookPurchase?.status === "approved") {
            return res.json({ success: true, message: "Book is already purchased and approved.", status: "approved", wallet: Number(user.wallet || 0) });
        }
        const balance = Number(user.wallet || 0);
        if (balance < BOOK_PRICE) {
            return res.status(400).json({ success: false, message: `Insufficient wallet balance. You need ₹${BOOK_PRICE}, but your balance is ₹${balance.toFixed(2)}.` });
        }
        user.wallet = Math.round((balance - BOOK_PRICE) * 100) / 100;
        user.walletTransactions = user.walletTransactions || [];
        user.walletTransactions.push({
            time: new Date(),
            type: "DEBIT",
            amount: BOOK_PRICE,
            reason: "Book purchase — ₹499",
            adminId: "SYSTEM"
        });
        user.bookPurchase = {
            status: "approved",
            price: BOOK_PRICE,
            paymentReference: "WALLET-" + Date.now(),
            requestedAt: new Date(),
            approvedAt: new Date(),
            adminNote: "Purchased successfully using student wallet.",
            access: true
        };
        await user.save();
        res.json({ success: true, message: "₹499 deducted from wallet successfully. Book access is now unlocked.", status: "approved", wallet: user.wallet });
    } catch (err) {
        console.error("Wallet book purchase error:", err);
        res.status(500).json({ success: false, message: "Unable to complete wallet purchase." });
    }
});

// Student: securely stream the purchased book only after admin approval
router.get("/content", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("bookPurchase.status bookPurchase.access").lean();
        if (!user || user.bookPurchase?.status !== "approved" || user.bookPurchase?.access === false) {
            return res.status(403).json({ success: false, message: "Book access is currently disabled by admin." });
        }
        const path = require("path");
        const fs = require("fs");
        const bookPath = path.join(__dirname, "..", "book.pdf");
        if (!fs.existsSync(bookPath)) {
            return res.status(404).json({ success: false, message: "Book file is not available." });
        }
        // The PDF is rendered inside the protected in-app reader.
        // Do not expose a normal attachment/download response or allow browser caching.
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": "inline",
            "Cache-Control": "private, no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Content-Type-Options": "nosniff",
            "X-Download-Options": "noopen",
            "Referrer-Policy": "no-referrer"
        });
        fs.createReadStream(bookPath).pipe(res);
    } catch (err) {
        console.error("Book content error:", err);
        res.status(500).json({ success: false, message: "Unable to open book." });
    }
});

module.exports = router;
