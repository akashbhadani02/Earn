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

    userId: user._id,

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
router.put("/", auth, async (req, res) => {

    try {

        const {

            wallet,
            totalEarn,
            quizScore,
            dailyReward,
            spinReward,
            lastClaim,
            lastSpin

        } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {

            return res.status(404).json({

                success: false,
                message: "User not found"

            });

        }

        if (wallet !== undefined)
            user.wallet = wallet;

        if (totalEarn !== undefined)
            user.totalEarn = totalEarn;

        if (quizScore !== undefined)
            user.quizScore = quizScore;

        if (dailyReward !== undefined)
            user.dailyReward = dailyReward;

        if (spinReward !== undefined)
            user.spinReward = spinReward;

        if (lastClaim !== undefined)
            user.lastClaim = lastClaim;

        if (lastSpin !== undefined)
            user.lastSpin = lastSpin;

        await user.save();

        res.json({

            success: true,
            message: "Wallet Updated",
            wallet: user.wallet

        });

    } catch (err) {

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