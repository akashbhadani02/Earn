const express = require("express");
const router = express.Router();

const User = require("../models/User");
const auth = require("../middleware/auth");

// =============================
// Load Wallet
// =============================
router.get("/", auth, async (req, res) => {

    try {

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({

            success: true,

            wallet: user.wallet,
            totalEarn: user.totalEarn,
            quizScore: user.quizScore,
            dailyReward: user.dailyReward,
            spinReward: user.spinReward,
            lastClaim: user.lastClaim,
            lastSpin: user.lastSpin,
            withdrawRequests: user.withdrawRequests

        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});


// =============================
// Update Wallet
// =============================
// IMPORTANT:
// Student cannot directly change wallet,
// totalEarn, spinReward, quizScore, etc.
// These values should only be changed
// by trusted backend APIs.

router.put("/", auth, async (req, res) => {

    try {

        const user = await User.findById(req.user.id);

        if (!user) {

            return res.status(404).json({

                success: false,
                message: "User not found"

            });

        }

        // Only return current data.
        // Do NOT accept wallet values from frontend.

        res.json({

            success: true,

            message:
                "Wallet can only be updated by server",

            wallet: user.wallet,

            totalEarn: user.totalEarn

        });

    } catch (err) {

        console.error(
            "Wallet Update Error:",
            err
        );

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

// =============================
// Spin Wheel - Maximum 2 Spins Per Day
// =============================
router.post("/spin", auth, async (req, res) => {

    try {

        const user = await User.findById(req.user.id);

        if (!user) {

            return res.status(404).json({

                success: false,
                message: "User not found"

            });

        }


        // =============================
        // Today's Date
        // =============================

        const today = new Date()
            .toISOString()
            .split("T")[0];


        // =============================
        // Reset Spin Count On New Day
        // =============================

        if (user.lastSpinDate !== today) {

            user.spinCount = 0;

            user.lastSpinDate = today;

        }


        // =============================
        // Maximum 2 Spins Per Day
        // =============================

        if (user.spinCount >= 2) {

            return res.status(400).json({

                success: false,

                message:
                    "તમે આજે 2 Spin કરી લીધા છે! કાલે ફરી Spin કરી શકશો."

            });

        }


        // =============================
        // Generate Prize
        // ₹1 to ₹20
        // =============================

        const prize =
            Math.floor(Math.random() * 20) + 1;


        // =============================
        // Increase Spin Count
        // =============================

        user.spinCount += 1;


        // =============================
        // Update Last Spin Date
        // =============================

        user.lastSpinDate = today;


        // =============================
        // Add Money To Wallet
        // =============================

        user.wallet =
            Number(user.wallet || 0) + prize;


        // =============================
        // Add Money To Total Earn
        // =============================

        user.totalEarn =
            Number(user.totalEarn || 0) + prize;


        // =============================
        // Save To MongoDB
        // =============================

        await user.save();


        // =============================
        // Response
        // =============================

        res.json({

            success: true,

            message: "Spin Successful",

            prize: prize,

            spinCount: user.spinCount,

            remainingSpins:
                2 - user.spinCount,

            wallet: user.wallet,

            totalEarn: user.totalEarn

        });


    } catch (err) {

        console.error(
            "Spin Error:",
            err
        );


        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

// =============================
// Withdraw Request
// =============================
router.post("/withdraw", auth, async (req, res) => {

    try {

        const { amount } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {

            return res.status(404).json({

                success: false,
                message: "User not found"

            });

        }

        if (user.wallet < amount) {

            return res.status(400).json({

                success: false,
                message: "Insufficient Balance"

            });

        }

        user.wallet -= amount;

        user.withdrawRequests.push({

            amount,

            status: "Pending",

            date: new Date()

        });

        await user.save();

        res.json({

            success: true,
            wallet: user.wallet,
            message: "Withdraw Request Submitted"

        });

    } catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

});

module.exports = router;