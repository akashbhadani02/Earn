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


// ==========================
// Shared block remaining-time calculation
// Admin and Student login use the SAME server-side expiry.
// ==========================
function getBlockRemainingMs(user, nowMs = Date.now()) {
    if (user.finalBlocked) {
        return { untilMs: null, remainingMs: Infinity, permanent: true };
    }
    let untilMs = user.blockUntil ? new Date(user.blockUntil).getTime() : 0;
    if (!untilMs || Number.isNaN(untilMs)) {
        const startedMs = user.updatedAt ? new Date(user.updatedAt).getTime() : nowMs;
        untilMs = startedMs + 12 * 60 * 60 * 1000;
    }
    return { untilMs, remainingMs: Math.max(0, untilMs - nowMs), permanent: false };
}

router.post("/login", async (req, res) => {

    try {

        const { mobile, password } = req.body;

        const user = await User.findOne({ mobile, isDeleted: { $ne: true } });

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

        // Anti-cheating block. Blocks 1-3 have a 12-hour timer. Block 4 is
        // permanent until an admin explicitly unblocks the student.
        if (user.isBlocked) {
            const now = Date.now();
            const blockTime = getBlockRemainingMs(user, now);

            if (!blockTime.permanent && blockTime.remainingMs <= 0) {
                user.isBlocked = false;
                user.blockUntil = null;
                user.blockReason = "";
                user.warningCount = 0;
                await user.save();
            } else {
                if (!blockTime.permanent && (!user.blockUntil || Number.isNaN(new Date(user.blockUntil).getTime()))) {
                    user.blockUntil = new Date(blockTime.untilMs);
                    await user.save();
                }
                return res.status(403).json({
                    success: false,
                    blocked: true,
                    permanent: Boolean(blockTime.permanent),
                    message: blockTime.permanent ? "Your account is permanently blocked. Admin unblock is required." : "Your account is temporarily blocked for 12 hours.",
                    reason: user.blockReason,
                    blockUntil: blockTime.permanent ? null : new Date(blockTime.untilMs).toISOString(),
                    remainingMs: blockTime.permanent ? null : blockTime.remainingMs,
                    blockCount: Number(user.blockCount || 0)
                });
            }
        }

        // Security audit: record every successful login and unique device.
        const clientDeviceId = String(req.headers["x-device-id"] || "").trim().slice(0, 200);
        user.deviceIds = Array.isArray(user.deviceIds) ? user.deviceIds : [];
        if (clientDeviceId && !user.deviceIds.includes(clientDeviceId)) {
            user.deviceIds.push(clientDeviceId);
            if (user.deviceIds.length > 50) user.deviceIds = user.deviceIds.slice(-50);
        }
        user.deviceCount = Math.max(Number(user.deviceCount || 0), user.deviceIds.length);

        user.loginHistory = Array.isArray(user.loginHistory) ? user.loginHistory : [];
        user.loginHistory.push({
            time: new Date(),
            ip: String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim(),
            userAgent: String(req.headers["user-agent"] || "")
        });
        // Keep the latest 100 login records per student.
        if (user.loginHistory.length > 100) {
            user.loginHistory = user.loginHistory.slice(-100);
        }

        // Student ને Online કરો
        user.isOnline = true;
        user.lastSeen = new Date();

        await user.save();

        const token = jwt.sign(

            {
                id: user._id,
                sessionVersion: Number(user.sessionVersion || 0)
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
// Student Presence / Heartbeat
// ==========================

const verifyPresenceToken = async (req) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    if (!token) throw new Error("No token provided");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("sessionVersion isDeleted isBlocked");
    if (!user || user.isDeleted || user.isBlocked) throw new Error("Account is not available");

    if (Number(decoded.sessionVersion ?? 0) !== Number(user.sessionVersion || 0)) {
        const e = new Error("Session ended by admin. Please login again.");
        e.forceLogout = true;
        throw e;
    }
    return decoded;
};

router.post("/heartbeat", async (req, res) => {
    try {
        const decoded = await verifyPresenceToken(req);

        const presenceId = String(req.headers["x-presence-id"] || "").trim();
        if (!presenceId) {
            return res.status(400).json({ success: false, message: "Presence id missing" });
        }

        // Heartbeat is the ONLY thing that refreshes presence. The presence id
        // belongs to this browser tab, so multiple tabs cannot race each other.
        await User.findOneAndUpdate(
            { _id: decoded.id },
            { $set: { isOnline: true, lastSeen: new Date(), presenceId } },
            { new: false }
        );

        res.json({ success: true });
    } catch (err) {
        const status = err.forceLogout ? 401 : (err.message === "No token provided" ? 401 : 401);
        res.status(status).json({
            success: false,
            message: err.message || "Invalid token",
            forceLogout: !!err.forceLogout
        });
    }
});

// Called when the student tab becomes hidden / is closed.
router.post("/offline", async (req, res) => {
    try {
        const decoded = await verifyPresenceToken(req);

        const presenceId = String(req.headers["x-presence-id"] || "").trim();
        if (!presenceId) return res.status(400).json({ success: false });

        // Only this exact tab may turn its presence offline. If another tab
        // became the active tab after this one was hidden, this update matches
        // nothing and therefore cannot cause Online -> Offline flicker.
        await User.findOneAndUpdate(
            { _id: decoded.id, presenceId },
            { $set: { isOnline: false } },
            { new: false }
        );

        res.json({ success: true });
    } catch (err) {
        res.status(401).json({ success: false });
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
        const reason = String(req.body?.reason || "Cheating Detected").slice(0, 500);
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success:false, message:"User not found" });

        if (user.isBlocked) {
            const bt = getBlockRemainingMs(user);
            return res.json({
                success:true, blocked:true, warning:false, permanent:Boolean(bt.permanent),
                warningCount:Number(user.warningCount||0), blockCount:Number(user.blockCount||0),
                remainingMs:bt.permanent ? null : bt.remainingMs,
                blockUntil:bt.permanent ? null : new Date(bt.untilMs).toISOString()
            });
        }

        user.warningCount = Number(user.warningCount || 0) + 1;
        user.blockReason = reason;
        user.warningHistory = Array.isArray(user.warningHistory) ? user.warningHistory : [];
        user.warningHistory.push({ time:new Date(), reason });
        if (user.warningHistory.length > 200) user.warningHistory = user.warningHistory.slice(-200);

        // First 3 violations in EACH cycle are warnings only. No block and no wallet change.
        if (user.warningCount <= 3) {
            await user.save();
            return res.json({
                success:true, blocked:false, warning:true,
                warningCount:user.warningCount, remainingWarnings:3-user.warningCount,
                blockCount:Number(user.blockCount||0),
                message:`Warning ${user.warningCount}/3`
            });
        }

        // 4th violation in a cycle creates a block. Wallet is immediately zeroed.
        user.warningCount = 0;
        user.blockCount = Number(user.blockCount || 0) + 1;
        user.wallet = 0;
        user.activeQuizQuestionId = null;
        user.activeQuizStartedAt = null;
        user.activeActivityType = "";
        user.activeActivityQuestionId = null;
        user.activeActivityToken = "";
        user.activeActivityInvalidated = true;

        if (user.blockCount >= 4) {
            user.isBlocked = true;
            user.finalBlocked = true;
            user.blockUntil = null;
            await user.save();
            return res.json({
                success:true, blocked:true, warning:false, permanent:true,
                warningCount:0, blockCount:user.blockCount, remainingMs:null, blockUntil:null,
                wallet:0, message:"Final block. Admin unblock is required."
            });
        }

        user.isBlocked = true;
        user.finalBlocked = false;
        user.blockUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);
        await user.save();
        return res.json({
            success:true, blocked:true, warning:false, permanent:false,
            warningCount:0, blockCount:user.blockCount,
            blockUntil:user.blockUntil.toISOString(), remainingMs:12*60*60*1000, wallet:0,
            message:`Temporary block ${user.blockCount}/3`
        });
    } catch (err) {
        console.error("Warning/Block Error:", err);
        return res.status(500).json({ success:false, message:err.message });
    }
});

// ==========================
// Security Event Tracking
// Tracks tab changes, fast answers and unique devices.
// ==========================
router.post("/security-event", auth, async (req, res) => {
    try {
        const { type, deviceId } = req.body || {};
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        if (type === "tab_change") {
            user.tabChanges = Number(user.tabChanges || 0) + 1;
        } else if (type === "fast_answer") {
            user.fastAnswers = Number(user.fastAnswers || 0) + 1;
        } else if (type === "device") {
            const id = String(deviceId || "").trim().slice(0, 200);
            if (!id) return res.status(400).json({ success: false, message: "Device ID required" });
            user.deviceIds = Array.isArray(user.deviceIds) ? user.deviceIds : [];
            if (!user.deviceIds.includes(id)) {
                user.deviceIds.push(id);
                if (user.deviceIds.length > 50) user.deviceIds = user.deviceIds.slice(-50);
            }
            user.deviceCount = user.deviceIds.length;
        } else {
            return res.status(400).json({ success: false, message: "Unknown security event" });
        }

        await user.save();
        return res.json({
            success: true,
            fastAnswers: Number(user.fastAnswers || 0),
            tabChanges: Number(user.tabChanges || 0),
            deviceCount: Number(user.deviceCount || 0),
            warningCount: Number(user.warningCount || 0),
            loginCount: Array.isArray(user.loginHistory) ? user.loginHistory.length : 0
        });
    } catch (err) {
        console.error("Security event error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;