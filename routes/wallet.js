const express = require("express");
const router = express.Router();

const User = require("../models/User");
const auth = require("../middleware/auth");

const DAILY_REWARD_AMOUNT = 1;
const QUIZ_CORRECT_REWARD = 0.20;
const QUIZ_WRONG_PENALTY = 0.30;
const MAX_SPINS_PER_DAY = 2;

function todayKey() {
    return new Date().toISOString().split("T")[0];
}

function walletResponse(user) {
    return {
        success: true,
        wallet: Number(user.wallet || 0),
        totalEarn: Number(user.totalEarn || 0),
        quizScore: Number(user.quizScore || 0),
        dailyReward: Number(user.dailyReward || 0),
        spinReward: Number(user.spinReward || 0),
        lastClaim: user.lastClaim || "",
        lastSpin: user.lastSpin || "",
        spinCount: Number(user.spinCount || 0),
        lastSpinDate: user.lastSpinDate || "",
        withdrawRequests: user.withdrawRequests || []
    };
}

// =============================
// Load Wallet - Database Source
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

        return res.json(walletResponse(user));
    } catch (err) {
        console.error("Load Wallet Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// =============================
// Quiz Reward
// Server decides the reward amount.
// Frontend can only tell whether
// the selected answer was correct.
// =============================
router.post("/quiz", auth, async (req, res) => {
    try {
        const { correct } = req.body;

        if (typeof correct !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "Invalid quiz result"
            });
        }

        const amount = correct
            ? QUIZ_CORRECT_REWARD
            : -QUIZ_WRONG_PENALTY;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        user.wallet = Number(user.wallet || 0) + amount;

        // Wallet should never become negative.
        if (user.wallet < 0) {
            user.wallet = 0;
        }

        // totalEarn = only actual positive earnings.
        if (correct) {
            user.totalEarn = Number(user.totalEarn || 0) + QUIZ_CORRECT_REWARD;
            user.quizScore = Number(user.quizScore || 0) + QUIZ_CORRECT_REWARD;
        }

        await user.save();

        return res.json({
            ...walletResponse(user),
            reward: amount,
            correct
        });
    } catch (err) {
        console.error("Quiz Reward Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// =============================
// Daily Reward - Once Per Day
// =============================
router.post("/daily-reward", auth, async (req, res) => {
    try {
        const today = todayKey();
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.lastClaim === today) {
            return res.status(400).json({
                success: false,
                message: "તમે આજનો Daily Reward લઈ લીધો છે! કાલે ફરી લઈ શકશો.",
                ...walletResponse(user)
            });
        }

        user.wallet = Number(user.wallet || 0) + DAILY_REWARD_AMOUNT;
        user.totalEarn = Number(user.totalEarn || 0) + DAILY_REWARD_AMOUNT;
        user.dailyReward = Number(user.dailyReward || 0) + DAILY_REWARD_AMOUNT;
        user.lastClaim = today;

        await user.save();

        return res.json({
            ...walletResponse(user),
            reward: DAILY_REWARD_AMOUNT
        });
    } catch (err) {
        console.error("Daily Reward Error:", err);
        return res.status(500).json({
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
        const today = todayKey();
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.lastSpinDate !== today) {
            user.spinCount = 0;
            user.lastSpinDate = today;
        }

        if (Number(user.spinCount || 0) >= MAX_SPINS_PER_DAY) {
            return res.status(400).json({
                success: false,
                message: "તમે આજે 2 Spin કરી લીધા છે! કાલે ફરી Spin કરી શકશો.",
                ...walletResponse(user)
            });
        }

        const prize = Math.floor(Math.random() * 10) + 1;

        user.spinCount = Number(user.spinCount || 0) + 1;
        user.lastSpinDate = today;
        user.lastSpin = today;
        user.wallet = Number(user.wallet || 0) + prize;
        user.totalEarn = Number(user.totalEarn || 0) + prize;
        user.spinReward = Number(user.spinReward || 0) + prize;

        await user.save();

        return res.json({
            ...walletResponse(user),
            prize,
            remainingSpins: MAX_SPINS_PER_DAY - user.spinCount
        });
    } catch (err) {
        console.error("Spin Error:", err);
        return res.status(500).json({
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
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const wallet = Number(user.wallet || 0);

        // ₹500 અથવા વધુ હોય તો Withdraw Request નહીં મોકલી શકાય
        if (wallet >= 500) {
            return res.status(400).json({
                success: false,
                message: "તમારું Wallet ₹500 અથવા તેથી વધુ છે, તેથી તમે Withdraw Request મોકલી શકતા નથી.",
                ...walletResponse(user)
            });
        }

        // ₹500 થી ઓછું હોય તો પણ request નહીં
        if (wallet < 500) {
            return res.status(400).json({
                success: false,
                message: "Withdraw કરવા માટે Wallet માં ઓછામાં ઓછા ₹500 હોવા જોઈએ.",
                ...walletResponse(user)
            });
        }

        user.withdrawRequests.push({
            amount: wallet,
            status: "Pending",
            date: new Date()
        });

        await user.save();

        return res.json({
            ...walletResponse(user),
            message: "Withdraw Request Submitted"
        });

    } catch (err) {
        console.error("Withdraw Error:", err);

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;
