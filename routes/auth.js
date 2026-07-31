const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();


// ==========================
// Signup
// ==========================

router.post("/signup", async (req, res) => {

    try {

        const { name, mobile, password } = req.body;

        const user = await User.findOne({ mobile });

        if (user) {
            return res.status(400).json({
                success: false,
                message: "Mobile already registered"
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            mobile,
            password: hash
        });

        await newUser.save();

        res.json({
            success: true,
            message: "Signup Successful"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});



// ==========================
// Login
// ==========================

router.post("/login", async (req, res) => {

    try {

        const { mobile, password } = req.body;

        const user = await User.findOne({ mobile });

        if (!user) {

            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });

        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {

            return res.status(401).json({
                success: false,
                message: "Wrong Password"
            });

        }

        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked by Admin.",
                reason: user.blockReason
            });
        }

        // Student ને Online કરો
        user.isOnline = true;
        user.lastSeen = new Date();

        await user.save();

        const token = jwt.sign(

            {
                id: user._id
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }

        );

        res.json({

            success: true,

            token,

            user

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

// ==========================
// Student Heartbeat
// ==========================

router.post("/heartbeat", async (req, res) => {

    try {

        // Token check
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        const token = authHeader.split(" ")[1];

        // Token verify
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // User find
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Student online
        user.isOnline = true;

        // Last heartbeat time
        user.lastSeen = new Date();

        await user.save();

        res.json({
            success: true,
            message: "Heartbeat updated"
        });

    } catch (err) {

        console.error("Heartbeat Error:", err);

        res.status(401).json({
            success: false,
            message: "Invalid token"
        });

    }

});

// ==========================
// Student Warning / Block System
// 1st, 2nd, 3rd violation = Warning
// 4th violation = Account Blocked
// ==========================
const auth = require("../middleware/auth");

router.post("/block-me", auth, async (req, res) => {

    try {

        const { reason } = req.body;

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Already blocked
        if (user.isBlocked) {
            return res.json({
                success: true,
                blocked: true,
                warning: false,
                warningCount: user.warningCount || 0,
                message: "Account is already blocked"
            });
        }

        // Increase warning count for every confirmed violation.
        user.warningCount = (user.warningCount || 0) + 1;
        user.blockReason = reason || "Cheating Detected";

        // First 3 violations: warning only.
        if (user.warningCount <= 3) {
            await user.save();

            return res.json({
                success: true,
                blocked: false,
                warning: true,
                warningCount: user.warningCount,
                remainingWarnings: 3 - user.warningCount,
                message: `Warning ${user.warningCount}/3`
            });
        }

        // 4th violation: block account.
        user.isBlocked = true;
        await user.save();

        return res.json({
            success: true,
            blocked: true,
            warning: false,
            warningCount: user.warningCount,
            message: "Account Blocked"
        });

    } catch (err) {

        console.error("Warning/Block Error:", err);

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
