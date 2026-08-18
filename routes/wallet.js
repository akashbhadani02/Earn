const express = require("express");
const router = express.Router();

const User = require("../models/User");
const auth = require("../middleware/auth");

const DAILY_REWARD_AMOUNT = 5;
const QUIZ_CORRECT_REWARD = 0.20;
const QUIZ_WRONG_PENALTY = 0.30;
// No daily spin limit. One spin is earned for every 100 answered questions.

// India (IST) date so "daily questions" follows the student's local day.
function todayKey() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
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
        dailyQuestionsAnswered: Number(user.dailyQuestionsAnswered || 0),
        dailyQuestionsDate: user.dailyQuestionsDate || "",
        totalQuestionsAnswered: Number(user.totalQuestionsAnswered || 0),
        spinCycleQuestionsAnswered: Number(user.spinCycleQuestionsAnswered ?? user.dailyQuestionsAnswered ?? 0),
        spinQuestionsRemaining: Math.max(0, 100 - Number(user.spinCycleQuestionsAnswered ?? user.dailyQuestionsAnswered ?? 0)),
        canSpinAfterQuestions: Number(user.spinCycleQuestionsAnswered ?? user.dailyQuestionsAnswered ?? 0) >= 100,
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
// Quiz rewards are now granted ONLY by /api/questions/answer after the
// server verifies the active question and selected option. This endpoint
// intentionally refuses direct client-supplied reward claims.
// =============================
router.post("/quiz", auth, async (req, res) => {
    return res.status(409).json({
        success:false,
        message:"Quiz reward is granted only after the active question is verified."
    });
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
// Spin Wheel - 1 Spin Per 100 Questions
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

        // A student must answer 100 quiz questions today
        // before the Spin Wheel becomes available.
        if (user.dailyQuestionsDate !== today) {
            user.dailyQuestionsDate = today;
            user.dailyQuestionsAnswered = 0;
            user.spinCycleQuestionsAnswered = 0;
        }

        // Spin eligibility uses the current 100-question cycle.
        // Today's total count is NOT reset after spinning.
        const cycleCount = Number(user.spinCycleQuestionsAnswered ?? user.dailyQuestionsAnswered ?? 0);

        if (cycleCount < 100) {
            const remaining = 100 - cycleCount;

            return res.status(400).json({
                success: false,
                message: `Spin કરવા માટે આજે હજુ ${remaining} પ્રશ્નોના જવાબ આપવાના બાકી છે. 100 પ્રશ્નો પૂર્ણ કર્યા પછી જ Spin કરી શકશો.`,
                remainingQuestions: remaining,
                ...walletResponse(user)
            });
        }

        // Every completed set of 100 questions gives one spin.
        // There is no daily spin limit: after each spin the current
        // 100-question cycle starts again from 0.
//************************************************************* */
        const prize = Math.floor(Math.random() * 50) + 1;
//************************************************************* */
        user.spinCount = Number(user.spinCount || 0) + 1;
        user.lastSpinDate = today;
        user.lastSpin = today;

        // Reset ONLY the current spin-cycle counter.
        // Today's total and lifetime total remain unchanged.
        user.spinCycleQuestionsAnswered = 0;

        user.wallet = Number(user.wallet || 0) + prize;
        user.totalEarn = Number(user.totalEarn || 0) + prize;
        user.spinReward = Number(user.spinReward || 0) + prize;

        await user.save();

        return res.json({
            ...walletResponse(user),
            prize,
            remainingSpins: null,
            nextSpinQuestions: 100
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
// Minimum Wallet: ₹500
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

        // Minimum ₹500 required
        if (wallet < 500) {
            return res.status(400).json({
                success: false,
                message: "Withdraw કરવા માટે Wallet માં ઓછામાં ઓછા ₹500 હોવા જોઈએ.",
                ...walletResponse(user)
            });
        }

        // Only one Pending request at a time
        const pendingRequest = (user.withdrawRequests || []).find(
            request => request.status === "Pending"
        );

        if (pendingRequest) {
            return res.status(400).json({
                success: false,
                message: "તમારી Withdraw Request પહેલેથી Pending છે.",
                ...walletResponse(user)
            });
        }

        const {
    paymentMethod,
    upiId,
    bankName,
    accountHolderName,
    accountNumber,
    ifscCode
} = req.body;

        const amount = wallet;

        // Save withdraw request in the same User document
        user.withdrawRequests.push({

    amount,

    fullName: user.name,
    mobileNumber: user.mobile,

    paymentMethod, 

    upiId,

    bankName,

    accountHolderName,

    accountNumber,

    ifscCode,

    status: "Pending",

    date: new Date()

});

        // Lock/deduct the requested wallet amount while request is pending.
        // If Admin rejects it, admin route refunds this amount.
        user.wallet = 0;

        await user.save();

        return res.json({
            ...walletResponse(user),
            message: "Withdraw Request Admin ને મોકલવામાં આવી છે.",
            withdrawAmount: amount
        });

    } catch (err) {
        console.error("Withdraw Request Error:", err);

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;
