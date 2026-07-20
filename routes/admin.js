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
// ===========================

router.get("/users", adminAuth, async (req, res) => {

    try {

        const users = await User.find().select("-password");

        res.json({

            success: true,

            users

        });

    } catch (err) {

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

        let withdraws = [];

        users.forEach(user => {

            user.withdrawRequests.forEach(request => {

                withdraws.push({

                    userId: user._id,

                    name: user.name,

                    mobile: user.mobile,

                    amount: request.amount,

                    status: request.status,

                    date: request.date,

                    requestId: request._id

                });

            });

        });

        res.json({

            success: true,

            withdraws

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

router.put("/withdraw/approve/:userId/:requestId", adminAuth, async (req, res) => {

    try {

        const user = await User.findById(req.params.userId);

        const request = user.withdrawRequests.id(req.params.requestId);

        if (!request) {

            return res.status(404).json({

                success: false,

                message: "Request Not Found"

            });

        }

        request.status = "Approved";

        await user.save();

        res.json({

            success: true,

            message: "Withdraw Approved"

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

router.put("/withdraw/reject/:userId/:requestId", adminAuth, async (req, res) => {

    try {

        const user = await User.findById(req.params.userId);

        const request = user.withdrawRequests.id(req.params.requestId);

        if (!request) {

            return res.status(404).json({

                success: false,

                message: "Request Not Found"

            });

        }

        request.status = "Rejected";

        user.wallet += request.amount;

        await user.save();

        res.json({

            success: true,

            message: "Withdraw Rejected"

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

module.exports = router;