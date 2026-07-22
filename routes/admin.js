const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const User = require("../models/User");
const adminAuth = require("../middleware/adminAuth");

// ===========================
// Admin Login
// ===========================

router.post("/login", async (req, res) => {

    try {

        const { username, password } = req.body;

        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: "Admin Not Found"
            });
        }

        const match = await bcrypt.compare(password, admin.password);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Wrong Password"
            });
        }

        const token = jwt.sign(
            {
                id: admin._id,
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        res.json({
            success: true,
            token
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ===========================
// Dashboard
// ===========================

router.get("/dashboard", adminAuth, async (req, res) => {

    try {

        const users = await User.find();

        let totalWallet = 0;
        let totalEarn = 0;
        let pendingWithdraw = 0;

        users.forEach(user => {

            totalWallet += user.wallet || 0;
            totalEarn += user.totalEarn || 0;

            if (user.withdrawRequests) {

                user.withdrawRequests.forEach(w => {

                    if (w.status === "Pending") {

                        pendingWithdraw++;

                    }

                });

            }

        });

        res.json({

            success: true,

            totalUsers: users.length,

            totalWallet,

            totalEarn,

            pendingWithdraw

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

// ===========================
// All Users
// Online / Offline Status
// ===========================

router.get("/users", adminAuth, async (req, res) => {

    try {

        const users = await User.find().select("-password");

        const currentTime = Date.now();

        const updatedUsers = users.map(user => {

            let online = false;

            // જો lastSeen ઉપલબ્ધ છે
            if (user.lastSeen) {

                const lastSeenTime =
                    new Date(user.lastSeen).getTime();

                const difference =
                    currentTime - lastSeenTime;

                // છેલ્લો heartbeat 3 secondsની અંદર હોય
                if (difference <= 3000) {

                    online = true;

                }

            }

            return {

                ...user.toObject(),

                isOnline: online

            };

        });

        res.json({

            success: true,

            users: updatedUsers

        });

    } catch (err) {

        console.error("Users API Error:", err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});
// ===========================
// Update Wallet
// ===========================

router.put("/wallet/:id", adminAuth, async (req, res) => {

    try {

        const { wallet } = req.body;

        await User.findByIdAndUpdate(

            req.params.id,

            {

                wallet

            }

        );

        res.json({

            success: true,

            message: "Wallet Updated"

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

// ===========================
// Delete User
// ===========================

router.delete("/user/:id", adminAuth, async (req, res) => {

    try {

        await User.findByIdAndDelete(req.params.id);

        res.json({

            success: true,

            message: "User Deleted"

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

router.get("/withdraws", adminAuth, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        const withdraws = [];

        users.forEach(user => {
            (user.withdrawRequests || []).forEach(request => {
                withdraws.push({
                    userId: String(user._id),
                    name: user.name || "-",
                    mobile: user.mobile || "-",
                    amount: Number(request.amount || 0),
                    status: request.status || "Pending",
                    date: request.date || request.createdAt || user.createdAt,
                    requestId: String(request._id)
                });
            });
        });

        // Latest requests first
        withdraws.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

        return res.json({
            success: true,
            withdraws
        });

    } catch (err) {
        console.error("Load Withdraws Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

router.put("/withdraw/approve/:userId/:requestId", adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        const request = user.withdrawRequests.id(req.params.requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request Not Found"
            });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "This request is already " + request.status
            });
        }

        request.status = "Approved";
        await user.save();

        return res.json({
            success: true,
            message: "Withdraw Approved",
            request: request
        });

    } catch (err) {
        console.error("Approve Withdraw Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

router.put("/withdraw/reject/:userId/:requestId", adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        const request = user.withdrawRequests.id(req.params.requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: "Request Not Found"
            });
        }

        if (request.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message: "This request is already " + request.status
            });
        }

        request.status = "Rejected";

        // Refund the locked withdraw amount to the student's wallet.
        user.wallet = Number(user.wallet || 0) + Number(request.amount || 0);

        await user.save();

        return res.json({
            success: true,
            message: "Withdraw Rejected and amount refunded",
            wallet: user.wallet,
            request: request
        });

    } catch (err) {
        console.error("Reject Withdraw Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

router.delete("/withdraw/delete/:userId/:requestId", adminAuth, async (req, res) => {

    try {

        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        const request = user.withdrawRequests.id(req.params.requestId);

        if (!request) {

            return res.status(404).json({
                success: false,
                message: "Request Not Found"
            });

        }

        request.deleteOne();   // અથવા request.remove(); (Mongoose version પ્રમાણે)

        await user.save();

        res.json({

            success: true,
            message: "Withdraw Request Deleted"

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

module.exports = router;