const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const User = require("../models/User");
const Question = require("../models/Question");
const LifelineUsage = require("../models/LifelineUsage");
const QuizAnswerHistory = require("../models/QuizAnswerHistory");
const { ensureQuestionsSeeded } = require("./questions");
const adminAuth = require("../middleware/adminAuth");
const { webpush, configureWebPush } = require("../services/webPush");
const BookPurchase = require("../models/BookPurchase");
const Branding = require("../models/Branding");

// ===========================
// Global Branding / Logo
// ===========================
router.get("/branding", adminAuth, async (req, res) => {
    try {
        const branding = await Branding.findOne({ key: "global" }).lean();
        res.json({ success: true, logoData: branding?.logoData || "", version: branding?.version || 1, updatedAt: branding?.updatedAt || null });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/branding/logo", adminAuth, async (req, res) => {
    try {
        const { logoData } = req.body || {};
        if (!logoData || typeof logoData !== "string") return res.status(400).json({ success:false, message:"Logo image is required" });
        if (!/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(logoData)) return res.status(400).json({ success:false, message:"Use PNG, JPG or WEBP image" });
        if (logoData.length > 2_500_000) return res.status(413).json({ success:false, message:"Logo is too large. Please use an image under about 1.8 MB." });
        const branding = await Branding.findOneAndUpdate(
            { key:"global" },
            { $set:{ logoData, updatedAt:new Date() }, $inc:{ version:1 } },
            { new:true, upsert:true, setDefaultsOnInsert:true }
        );
        res.json({ success:true, logoData:branding.logoData, version:branding.version, updatedAt:branding.updatedAt });
    } catch (err) {
        res.status(500).json({ success:false, message:err.message });
    }
});

router.delete("/branding/logo", adminAuth, async (req, res) => {
    try {
        const branding = await Branding.findOneAndUpdate(
            { key:"global" },
            { $set:{ logoData:"", updatedAt:new Date() }, $inc:{ version:1 } },
            { new:true, upsert:true, setDefaultsOnInsert:true }
        );
        res.json({ success:true, logoData:"", version:branding.version });
    } catch (err) {
        res.status(500).json({ success:false, message:err.message });
    }
});

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
// Force logout all students + keep student login locked
// ===========================
router.get("/user-login-lock-status", adminAuth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select("userLoginLocked").lean();
        return res.json({
            success: true,
            userLoginLocked: !!admin?.userLoginLocked
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/force-logout-all-users", adminAuth, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id);
        if (!admin) return res.status(401).json({ success: false, message: "Admin Not Found" });

        const result = await User.updateMany(
            { isDeleted: { $ne: true } },
            {
                $inc: { sessionVersion: 1 },
                $set: { isOnline: false }
            }
        );

        admin.userLoginLocked = true;
        await admin.save();

        res.json({
            success: true,
            userLoginLocked: true,
            message: "All student sessions have been logged out. Student login is now locked until admin enables it.",
            affectedUsers: result.modifiedCount ?? result.nModified ?? 0
        });
    } catch (err) {
        console.error("Force Logout All Error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post("/enable-all-users", adminAuth, async (req, res) => {
    try {
        const admin = await Admin.findByIdAndUpdate(
            req.admin.id,
            { userLoginLocked: false },
            { new: true }
        );
        if (!admin) return res.status(401).json({ success: false, message: "Admin Not Found" });
        return res.json({
            success: true,
            userLoginLocked: false,
            message: "Student login has been enabled again."
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});


// ===========================
// Book Access / Payment Summary
// ===========================
router.get("/book-summary", adminAuth, async (req, res) => {
    try {
        const purchases = await BookPurchase.find({}).sort({ createdAt: -1 }).lean();
        const latest = new Map();
        for (const p of purchases) if (!latest.has(String(p.user))) latest.set(String(p.user), p);
        const all = Array.from(latest.values());
        res.json({
            success: true,
            totalPurchases: all.length,
            pending: all.filter(p => p.status === "student_confirmed").length,
            verified: all.filter(p => p.status === "admin_verified").length,
            activeAccess: all.filter(p => p.status === "admin_verified" && p.accessGranted).length,
            revenueVerified: all.filter(p => p.status === "admin_verified").reduce((n,p) => n + Number(p.amount || 0), 0),
            purchases: all
        });
    } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// ===========================
// Dashboard
// ===========================

router.get("/dashboard", adminAuth, async (req, res) => {

    try {

        await ensureQuestionsSeeded();
        const users = await User.find({ isDeleted: { $ne: true } });
        const questionBankTotal = await Question.countDocuments();

        let totalWallet = 0;
        let totalEarn = 0;
        let totalQuestionsAnswered = 0;
        let pendingWithdraw = 0;

        users.forEach(user => {

            totalWallet += user.wallet || 0;
            totalEarn += user.totalEarn || 0;
            totalQuestionsAnswered += Number(user.totalQuestionsAnswered || 0);

            if (user.withdrawRequests) {

                user.withdrawRequests.forEach(w => {

                    if (String(w.status || "Pending").toLowerCase() === "pending") {
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

            totalQuestionsAnswered,

            questionBankTotal,

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
// India (IST) date helper
// ===========================
function todayKey() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).format(new Date());
}

// ===========================
// All Users
// Online / Offline Status
// ===========================

// ===========================
// LIVE STUDENT PRESENCE (lightweight)
// ===========================
// This endpoint is intentionally separate from /users so the admin can poll
// presence every second without repeatedly loading all wallet/activity data.
router.get("/presence", adminAuth, async (req, res) => {
    try {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");

        const ONLINE_TIMEOUT = 7000;
        const now = Date.now();
        const users = await User.find({ isDeleted: { $ne: true } })
            .select("name lastSeen isBlocked")
            .lean();

        const presence = users.map(u => {
            const lastSeenMs = u.lastSeen ? new Date(u.lastSeen).getTime() : 0;
            const isOnline = lastSeenMs > 0 && (now - lastSeenMs) <= ONLINE_TIMEOUT;
            return {
                id: String(u._id),
                name: u.name || "Unknown",
                lastSeen: u.lastSeen || null,
                isBlocked: !!u.isBlocked,
                isOnline
            };
        });

        return res.json({ success: true, serverTime: now, onlineTimeout: ONLINE_TIMEOUT, users: presence });
    } catch (err) {
        console.error("Admin presence error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/users", adminAuth, async (req, res) => {

    try {
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");

        const users = await User.find({ isDeleted: { $ne: true } }).select("-password");

        const currentTime = Date.now();

        const updatedUsers = users.map(user => {

            let online = false;

            // જો lastSeen ઉપલબ્ધ છે
            if (user.lastSeen) {

                const lastSeenTime =
                    new Date(user.lastSeen).getTime();

                const difference =
                    currentTime - lastSeenTime;

                const ONLINE_TIMEOUT = 7000; // Offline after 3 seconds without heartbeat

                if (difference <= ONLINE_TIMEOUT) {
                    online = true;
                }

            }

            const userData = user.toObject();
            const today = todayKey();

            // If the student has not answered anything today,
            // show today's count as 0 without modifying the database.
            const dailyQuestionsAnswered =
                userData.dailyQuestionsDate === today
                    ? Number(userData.dailyQuestionsAnswered || 0)
                    : 0;

            return {

                ...userData,

                isOnline: online,

                // Questions answered today (resets automatically each new day).
                dailyQuestionsAnswered,

                dailyQuestionsDate: today,
                activityStats: {
                    counts: Object.fromEntries(userData.activityCounts ? (userData.activityCounts instanceof Map ? userData.activityCounts : Object.entries(userData.activityCounts)) : []),
                    correct: Object.fromEntries(userData.activityCorrect ? (userData.activityCorrect instanceof Map ? userData.activityCorrect : Object.entries(userData.activityCorrect)) : []),
                    wrong: Object.fromEntries(userData.activityWrong ? (userData.activityWrong instanceof Map ? userData.activityWrong : Object.entries(userData.activityWrong)) : []),
                    earn: Object.fromEntries(userData.activityEarn ? (userData.activityEarn instanceof Map ? userData.activityEarn : Object.entries(userData.activityEarn)) : []),
                    deduct: Object.fromEntries(userData.activityDeduct ? (userData.activityDeduct instanceof Map ? userData.activityDeduct : Object.entries(userData.activityDeduct)) : []),
                    tabChanges: Object.fromEntries(userData.activityTabChanges ? (userData.activityTabChanges instanceof Map ? userData.activityTabChanges : Object.entries(userData.activityTabChanges)) : [])
                }

            };

        });

        // Highest wallet balance first, lowest wallet balance last.
        updatedUsers.sort((a, b) => Number(b.wallet || 0) - Number(a.wallet || 0));

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
// Update Total Earn
// ===========================

router.put("/total-earn/:id", adminAuth, async (req, res) => {

    try {

        const totalEarn = Number(req.body.totalEarn);

        if (!Number.isFinite(totalEarn) || totalEarn < 0) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid non-negative Total Earn amount"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { totalEarn },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        return res.json({
            success: true,
            message: "Total Earn Updated",
            totalEarn: Number(user.totalEarn || 0)
        });

    } catch (err) {

        return res.status(500).json({
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

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        // Permanent users are protected from deletion.
        if (user.isPermanent) {
            return res.status(400).json({
                success: false,
                message: "Permanent user cannot be deleted."
            });
        }

        // Soft delete: keep the complete user data so it can be restored.
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.isOnline = false;

        await user.save();

        return res.json({
            success: true,
            message: "User moved to Deleted Users. Data is safe and can be restored."
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ===========================
// Deleted Users
// ===========================

router.get("/deleted-users", adminAuth, async (req, res) => {

    try {

        const users = await User.find({ isDeleted: true }).select("-password").sort({
            deletedAt: -1
        });

        return res.json({
            success: true,
            users
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

// ===========================
// Restore Deleted User
// ===========================

// Permanently delete a student already in Deleted Users / Recycle Bin.
router.delete("/permanent-delete-user/:id", adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "User Not Found" });
        if (!user.isDeleted) return res.status(400).json({ success: false, message: "Student must be in Deleted Users first." });
        await User.deleteOne({ _id: req.params.id });
        return res.json({ success: true, message: "Student permanently deleted." });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.put("/restore-user/:id", adminAuth, async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        user.isDeleted = false;
        user.deletedAt = null;
        user.isOnline = false;

        await user.save();

        return res.json({
            success: true,
            message: "User Restored Successfully"
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

router.get("/withdraws", adminAuth, async (req, res) => {
    try {
        const users = await User.find({ isDeleted: { $ne: true } }).select("-password");
        const withdraws = [];

        users.forEach(user => {
            (user.withdrawRequests || []).forEach(request => {
                withdraws.push({

                    userId: String(user._id),

                    name: request.fullName || user.name || "-",

                    mobile: request.mobileNumber || user.mobile || "-",

                    amount: Number(request.amount || 0),

                    status: request.status || "Pending",

                    paymentMethod: request.paymentMethod || "",

                    upiId: request.upiId || "",

                    bankName: request.bankName || "",

                    accountHolderName: request.accountHolderName || "",

                    accountNumber: request.accountNumber || "",

                    ifscCode: request.ifscCode || "",

                    transactionId: request.transactionId || "",

                    paidAt: request.paidAt || null,

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

// ===========================
// Mark Withdraw as Paid
// Admin pays student manually
// ===========================

router.put("/withdraw/paid/:userId/:requestId", adminAuth, async (req, res) => {

    try {

        const { transactionId } = req.body;

        if (!transactionId || !String(transactionId).trim()) {

            return res.status(400).json({
                success: false,
                message: "Transaction ID is required"
            });

        }

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

        // Only Approved request can be marked as Paid
        if (request.status !== "Approved") {

            return res.status(400).json({
                success: false,
                message: "Only Approved withdraw can be marked as Paid"
            });

        }

        request.status = "Paid";

        // Save payment transaction ID
        request.transactionId = String(transactionId).trim();

        // Save payment date
        request.paidAt = new Date();

        await user.save();

        return res.json({

            success: true,

            message: "Payment marked as Paid successfully",

            transactionId: request.transactionId,

            paidAt: request.paidAt,

            request: request

        });

    } catch (err) {

        console.error("Mark Withdraw Paid Error:", err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

// ===========================
// Approve Withdraw
// ===========================
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
                message: "Request already " + request.status
            });
        }

        request.status = "Approved";

        await user.save();

        return res.json({
            success: true,
            message: "Withdraw Approved Successfully",
            request
        });

    } catch (err) {

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

// ===========================
// Unblock Student
// ===========================
router.put("/unblock/:id", adminAuth, async (req, res) => {

    try {

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }

        user.isBlocked = false;
        user.blockUntil = null;
        user.permanentBlocked = false;
        user.warningCount = 0;
        user.blockCount = 0;
        user.blockReason = "";

        // Admin unblock restores the student to a fresh warning/block cycle.
        user.warningCount = 0;
        user.blockCount = 0;
        user.permanentBlocked = false;

        // Reset online status (optional)
        user.lastSeen = new Date();
        user.isOnline = false;

        await user.save();

        res.json({
            success: true,
            message: "Student Unblocked Successfully. Warning count has been reset."
        });

        await user.save();

        res.json({
            success: true,
            message: "Student Unblocked Successfully"
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});



// ===========================
// Push Notification Configuration / Status
// ===========================
router.get("/notification/status", adminAuth, async (req, res) => {
    const publicKey = String(process.env.VAPID_PUBLIC_KEY || "").trim();
    const privateKey = String(process.env.VAPID_PRIVATE_KEY || "").trim();
    const subject = String(process.env.VAPID_SUBJECT || "").trim();

    return res.json({
        success: true,
        configured: Boolean(publicKey && privateKey && subject),
        hasPublicKey: Boolean(publicKey),
        hasPrivateKey: Boolean(privateKey),
        hasSubject: Boolean(subject),
        message: publicKey && privateKey && subject
            ? "Web Push is configured"
            : "Vercel Environment Variables VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT are required"
    });
});

// ===========================
// Send Push Notification to One Student
// ===========================
router.post("/notification/send/:userId", adminAuth, async (req, res) => {
    try {
        const { title, message, url } = req.body || {};

        const cleanTitle = String(title || "").trim();
        const cleanMessage = String(message || "").trim();

        if (!cleanTitle) {
            return res.status(400).json({
                success: false,
                message: "Notification title is required"
            });
        }

        if (!cleanMessage) {
            return res.status(400).json({
                success: false,
                message: "Notification message is required"
            });
        }

        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }

        const subscriptions = Array.isArray(user.pushSubscriptions)
            ? user.pushSubscriptions
            : [];

        if (!subscriptions.length) {
            return res.status(400).json({
                success: false,
                message: "This student has not enabled notifications on any device."
            });
        }

        configureWebPush();

        const payload = JSON.stringify({
            title: cleanTitle.slice(0, 100),
            body: cleanMessage.slice(0, 500),
            url: String(url || "/earn.html"),
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: "admin-notification",
            requireInteraction: false
        });

        const results = await Promise.allSettled(
            subscriptions.map(subscription =>
                webpush.sendNotification(
                    subscription.toObject ? subscription.toObject() : subscription,
                    payload
                )
            )
        );

        const staleEndpoints = [];
        let sent = 0;

        results.forEach((result, index) => {
            if (result.status === "fulfilled") {
                sent++;
                return;
            }

            const statusCode = result.reason?.statusCode;
            if (statusCode === 404 || statusCode === 410) {
                staleEndpoints.push(subscriptions[index].endpoint);
            }

            console.error(
                "Push notification error:",
                result.reason?.message || result.reason
            );
        });

        if (staleEndpoints.length) {
            user.pushSubscriptions = subscriptions.filter(
                subscription => !staleEndpoints.includes(subscription.endpoint)
            );
            await user.save();
        }

        if (sent === 0) {
            return res.status(502).json({
                success: false,
                message: "Notification could not be delivered. The saved device subscription may have expired."
            });
        }

        return res.json({
            success: true,
            message: `Notification sent to ${user.name}`,
            devicesSent: sent,
            staleDevicesRemoved: staleEndpoints.length
        });
    } catch (err) {
        console.error("Send notification error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


// ===========================
// Send Push Notification to All Students
// ===========================
router.post("/notification/send-all", adminAuth, async (req, res) => {
    try {
        const cleanTitle = String(req.body?.title || "").trim();
        const cleanMessage = String(req.body?.message || "").trim();

        if (!cleanTitle) return res.status(400).json({ success: false, message: "Notification title is required" });
        if (!cleanMessage) return res.status(400).json({ success: false, message: "Notification message is required" });

        const users = await User.find({
            isDeleted: { $ne: true },
            "pushSubscriptions.0": { $exists: true }
        });

        configureWebPush();

        const payload = JSON.stringify({
            title: cleanTitle.slice(0, 100),
            body: cleanMessage.slice(0, 500),
            url: String(req.body?.url || "/earn.html"),
            icon: "/icon-192.png",
            badge: "/icon-192.png",
            tag: "admin-notification-all",
            requireInteraction: false
        });

        let sent = 0;
        let devices = 0;
        let staleRemoved = 0;

        for (const user of users) {
            const subscriptions = Array.isArray(user.pushSubscriptions) ? user.pushSubscriptions : [];
            devices += subscriptions.length;

            const results = await Promise.allSettled(
                subscriptions.map(subscription =>
                    webpush.sendNotification(
                        subscription.toObject ? subscription.toObject() : subscription,
                        payload
                    )
                )
            );

            const stale = [];
            results.forEach((result, index) => {
                if (result.status === "fulfilled") sent++;
                else if ([404, 410].includes(result.reason?.statusCode)) stale.push(subscriptions[index].endpoint);
            });

            if (stale.length) {
                user.pushSubscriptions = subscriptions.filter(sub => !stale.includes(sub.endpoint));
                staleRemoved += stale.length;
                await user.save();
            }
        }

        return res.json({
            success: true,
            message: `Notification sent to all subscribed students. Devices delivered: ${sent}.`,
            usersTargeted: users.length,
            devicesTargeted: devices,
            devicesSent: sent,
            staleDevicesRemoved: staleRemoved
        });
    } catch (err) {
        console.error("Send all notification error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// ===========================
// Admin Control Center - Real DB Data
// ===========================
router.get("/control-center", adminAuth, async (req, res) => {
    try {
        const today = todayKey();
        const users = await User.find({ isDeleted: { $ne: true } })
            .select("-password")
            .lean();

        const now = Date.now();
        const onlineTimeout = 7000;

        const mapped = users.map(u => ({
            ...u,
            _id: String(u._id),
            isOnline: !!u.lastSeen && (now - new Date(u.lastSeen).getTime()) <= onlineTimeout,
            dailyQuestionsAnswered: u.dailyQuestionsDate === today
                ? Number(u.dailyQuestionsAnswered || 0)
                : 0,
            totalQuestionsAnswered: Number(u.totalQuestionsAnswered || 0),
            spinCycleQuestionsAnswered: u.dailyQuestionsDate === today
                ? Number(u.spinCycleQuestionsAnswered ?? u.dailyQuestionsAnswered ?? 0)
                : 0,
            spinRemaining: u.dailyQuestionsDate === today
                ? Math.max(0, 100 - Number(u.spinCycleQuestionsAnswered ?? u.dailyQuestionsAnswered ?? 0))
                : 100,
            wallet: Number(u.wallet || 0),
            totalEarn: Number(u.totalEarn || 0),
            warningCount: Number(u.warningCount || 0),
            spinEligible: u.dailyQuestionsDate === today &&
                Number(u.spinCycleQuestionsAnswered ?? u.dailyQuestionsAnswered ?? 0) >= 100
        }));

        const stats = {
            students: mapped.length,
            online: mapped.filter(u => u.isOnline).length,
            blocked: mapped.filter(u => u.isBlocked).length,
            warnings: mapped.reduce((n,u) => n + u.warningCount, 0),
            wallet: mapped.reduce((n,u) => n + u.wallet, 0),
            questions: mapped.reduce((n,u) => n + u.dailyQuestionsAnswered, 0),
            totalQuestions: mapped.reduce((n,u) => n + u.totalQuestionsAnswered, 0),
            totalEarn: mapped.reduce((n,u) => n + u.totalEarn, 0),
            completed100: mapped.filter(u => u.spinEligible).length,
            spins: mapped.reduce((n,u) => n + Number(u.spinCount || 0), 0)
        };

        const withdrawals = [];
        mapped.forEach(u => (u.withdrawRequests || []).forEach(w => {
            withdrawals.push({
                userId: u._id,
                name: w.fullName || u.name || "-",
                amount: Number(w.amount || 0),
                status: w.status || "Pending",
                date: w.date || u.createdAt
            });
        }));

        return res.json({ success: true, stats, users: mapped, withdrawals });
    } catch (err) {
        console.error("Control Center Error:", err);
        return res.status(500).json({ success:false, message:err.message });
    }
});

router.get("/control-center/user/:id", adminAuth, async (req,res) => {
    try {
        const user = await User.findById(req.params.id).select("-password").lean();
        if (!user) return res.status(404).json({success:false,message:"User Not Found"});
        return res.json({success:true,user});
    } catch(err) {
        return res.status(500).json({success:false,message:err.message});
    }
});

router.put("/control-center/block/:id", adminAuth, async (req,res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({success:false,message:"User Not Found"});
        user.isBlocked = true;
        user.permanentBlocked = false;
        user.blockUntil = new Date(Date.now() + 3 * 60 * 60 * 1000);
        user.blockReason = String(req.body.reason || "Blocked by admin").slice(0,300);
        user.wallet = 0;
        user.sessionVersion = Number(user.sessionVersion || 0) + 1;
        await user.save();
        return res.json({success:true,message:"Student blocked"});
    } catch(err){ return res.status(500).json({success:false,message:err.message}); }
});

router.put("/control-center/unblock/:id", adminAuth, async (req,res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({success:false,message:"User Not Found"});
        user.isBlocked = false;
        user.blockUntil = null;
        user.permanentBlocked = false;
        user.warningCount = 0;
        user.blockCount = 0;
        user.blockReason = "";
        await user.save();
        return res.json({success:true,message:"Student unblocked"});
    } catch(err){ return res.status(500).json({success:false,message:err.message}); }
});

router.post("/control-center/warning/:id", adminAuth, async (req,res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({success:false,message:"User Not Found"});

        const reason = String(req.body.reason || "Admin warning").slice(0,500);
        user.warningCount = Number(user.warningCount || 0) + 1;
        user.warningHistory = user.warningHistory || [];
        user.warningHistory.push({ time:new Date(), reason });

        if(user.warningCount >= 4){
            user.warningCount = 0;
            user.blockCount = Number(user.blockCount || 0) + 1;
            user.wallet = 0;
            user.isBlocked = true;
            user.sessionVersion = Number(user.sessionVersion || 0) + 1;

            if(user.blockCount >= 4){
                user.permanentBlocked = true;
                user.blockUntil = null;
                user.blockReason = "Automatic block after 4 warnings — 4th block requires admin unblock";
            } else {
                user.permanentBlocked = false;
                user.blockUntil = new Date(Date.now() + 3 * 60 * 60 * 1000);
                user.blockReason = `Automatic 3-hour block (${user.blockCount}/3 temporary blocks)`;
            }
        }

        await user.save();
        return res.json({
            success:true,
            message:user.permanentBlocked
              ? "4th block reached: admin unblock required"
              : user.isBlocked
                ? `4 warnings reached: student blocked for 3 hours (${user.blockCount}/3)`
                : `Warning ${user.warningCount}/4 added`,
            warningCount:user.warningCount,
            blockCount:Number(user.blockCount||0),
            isBlocked:user.isBlocked,
            permanentBlocked:!!user.permanentBlocked,
            remainingMs:user.isBlocked && user.blockUntil ? Math.max(0,new Date(user.blockUntil).getTime()-Date.now()) : 0
        });
    } catch(err){ return res.status(500).json({success:false,message:err.message}); }
});

router.put("/control-center/wallet/:id", adminAuth, async (req,res) => {
    try {
        const amount = Number(req.body.amount);
        const reason = String(req.body.reason || "Admin wallet adjustment").slice(0,500);
        if(!Number.isFinite(amount)) return res.status(400).json({success:false,message:"Invalid amount"});
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({success:false,message:"User Not Found"});
        const before = Number(user.wallet || 0);
        user.wallet = Math.max(0, before + amount);
        if(amount > 0) user.totalEarn = Number(user.totalEarn || 0) + amount;
        user.walletTransactions = user.walletTransactions || [];
        user.walletTransactions.push({
            time:new Date(),
            type:amount >= 0 ? "CREDIT" : "DEBIT",
            amount,
            reason,
            adminId:String(req.user?.id || "")
        });
        await user.save();
        return res.json({success:true,message:"Wallet updated",wallet:user.wallet,totalEarn:user.totalEarn});
    } catch(err){ return res.status(500).json({success:false,message:err.message}); }
});

router.put("/control-center/reset-questions/:id", adminAuth, async (req,res) => {
    try {
        const user=await User.findById(req.params.id);
        if(!user) return res.status(404).json({success:false,message:"User Not Found"});
        user.dailyQuestionsAnswered=0;
        user.spinCycleQuestionsAnswered=0;
        user.dailyQuestionsDate=todayKey();
        user.answeredQuestionIds=[];
        await user.save();
        return res.json({success:true,message:"Today's question count reset"});
    } catch(err){ return res.status(500).json({success:false,message:err.message}); }
});

router.put("/control-center/reset-spin/:id", adminAuth, async (req,res) => {
    try {
        const user=await User.findById(req.params.id);
        if(!user) return res.status(404).json({success:false,message:"User Not Found"});
        user.lastSpinDate="";
        user.lastSpin="";
        await user.save();
        return res.json({success:true,message:"Spin reset"});
    } catch(err){ return res.status(500).json({success:false,message:err.message}); }
});



// ============================================================
// ADMIN PRO v2 - Vercel/MongoDB compatible APIs
// ============================================================
const proTodayKey = () => new Date().toISOString().slice(0,10);
const proAdminLog = async (user, action, details="") => {
    try {
        user.adminActivity = user.adminActivity || [];
        user.adminActivity.push({ time:new Date(), action, details });
        if (user.adminActivity.length > 200) user.adminActivity = user.adminActivity.slice(-200);
        await user.save();
    } catch(e) { console.error("Admin log:", e.message); }
};


// ===========================
// KBC Lifeline Admin APIs
// ===========================
router.get("/pro/lifelines", adminAuth, async (req, res) => {
    try {
        const page = Math.max(1, Number(req.query.page || 1));
        const limit = Math.min(200, Math.max(10, Number(req.query.limit || 100)));
        const q = String(req.query.q || "").trim();
        const filter = {};
        if (q) {
            const users = await User.find({ $or: [
                { name: { $regex: q, $options: "i" } },
                { mobile: { $regex: q, $options: "i" } }
            ] }).select("_id").lean();
            filter.userId = { $in: users.map(u => u._id) };
        }
        const [items, total] = await Promise.all([
            LifelineUsage.find(filter).sort({ usedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
            LifelineUsage.countDocuments(filter)
        ]);
        res.json({ success:true, items, total, page, limit });
    } catch(e) { res.status(500).json({success:false,message:e.message}); }
});

router.get("/pro/lifelines/user/:id", adminAuth, async (req,res) => {
    try {
        const user=await User.findById(req.params.id).select("name mobile totalQuestionsAnswered lifelines lifelineCycle").lean();
        if(!user)return res.status(404).json({success:false,message:"Student not found"});
        const usage=await LifelineUsage.find({userId:user._id}).sort({usedAt:-1}).lean();
        const counts={fiftyFifty:0,audiencePoll:0,askExpert:0,skipQuestion:0};
        usage.forEach(x=>{if(counts[x.type]!==undefined)counts[x.type]++;});
        res.json({success:true,user,counts,usage});
    } catch(e){res.status(500).json({success:false,message:e.message});}
});

// Complete question-wise answer history for a student.
// New answers come from QuizAnswerHistory; older answeredQuestionIds are used as a
// safe fallback so Admin can still see the question and correct answer.
router.get("/pro/questions/user/:id", adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("name mobile totalQuestionsAnswered answeredQuestionIds").lean();
        if (!user) return res.status(404).json({ success:false, message:"Student not found" });

        const history = await QuizAnswerHistory.find({ userId: user._id }).sort({ answeredAt: -1 }).lean();
        const historyIds = new Set(history.map(x => String(x.questionId)));
        const missingIds = (user.answeredQuestionIds || []).filter(id => !historyIds.has(String(id)));
        let fallback = [];
        if (missingIds.length) {
            const questions = await Question.find({ _id: { $in: missingIds } }).select("q options correct").lean();
            fallback = questions.map(q => ({
                questionId: q._id, questionText: q.q || "", options: q.options || [],
                correctIndex: Number(q.correct),
                correctAnswer: Array.isArray(q.options) ? String(q.options[Number(q.correct)] ?? "") : "",
                selectedIndex: null, selectedAnswer: "", isCorrect: null,
                answeredAt: null, legacy: true
            }));
        }

        res.json({ success:true, user, total: history.length + fallback.length, history: history.concat(fallback) });
    } catch (e) {
        res.status(500).json({ success:false, message:e.message });
    }
});

router.put("/pro/reset-lifelines/:id", adminAuth, async(req,res)=>{
    try{
        const user=await User.findById(req.params.id); if(!user)return res.status(404).json({success:false,message:"Student not found"});
        user.lifelines={fiftyFifty:true,audiencePoll:true,askExpert:true,skipQuestion:true};
        user.lifelineCycle=Math.floor(Number(user.totalQuestionsAnswered||0)/500);
        await proAdminLog(user,"RESET_LIFELINES","Admin manually reset all 4 KBC lifelines");
        await user.save();
        res.json({success:true,message:"All lifelines reset successfully",lifelines:user.lifelines,lifelineCycle:user.lifelineCycle});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.put("/pro/reset-lifelines-all", adminAuth, async(req,res)=>{
    try{
        const users=await User.find({isDeleted:{$ne:true}});
        const now=new Date();
        for(const user of users){
            user.lifelines={fiftyFifty:true,audiencePoll:true,askExpert:true,skipQuestion:true};
            user.lifelineCycle=Math.floor(Number(user.totalQuestionsAnswered||0)/500);
            user.adminActivity=user.adminActivity||[];
            user.adminActivity.push({time:now,action:"RESET_LIFELINES",details:"Admin reset all students' KBC lifelines"});
            await user.save();
        }
        res.json({success:true,message:`Lifelines reset for ${users.length} students`,count:users.length});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.get("/pro/dashboard", adminAuth, async (req,res)=>{
    try{
        const today=proTodayKey();
        const users=await User.find({}).select("-password").lean();
        const active=users.filter(u=>u.lastSeen && Date.now()-new Date(u.lastSeen).getTime()<=7000);
        const stats={
            students:users.length,
            online:active.length,
            blocked:users.filter(u=>u.isBlocked).length,
            deleted:users.filter(u=>u.isDeleted).length,
            warnings:users.reduce((n,u)=>n+Number(u.warningCount||0),0),
            questionsToday:users.reduce((n,u)=>n+(u.dailyQuestionsDate===today?Number(u.dailyQuestionsAnswered||0):0),0),
            totalQuestions:users.reduce((n,u)=>n+Number(u.totalQuestionsAnswered||0),0),
            wallet:users.reduce((n,u)=>n+Number(u.wallet||0),0),
            totalEarn:users.reduce((n,u)=>n+Number(u.totalEarn||0),0),
            spinEligible:users.filter(u=>u.dailyQuestionsDate===today && Number(u.spinCycleQuestionsAnswered ?? u.dailyQuestionsAnswered ?? 0)>=100).length
        };
        const withdrawals=[];
        users.forEach(u=>(u.withdrawRequests||[]).forEach(w=>withdrawals.push({
            userId:String(u._id),student:nmPro(u),mobile:u.mobile||"",
            amount:Number(w.amount||0),status:w.status||"Pending",
            transactionId:w.transactionId||"",date:w.date||null
        })));
        const lifelineAgg = await LifelineUsage.aggregate([{ $match:{resetByAdmin:{$ne:true}} },{ $group:{_id:"$type",count:{$sum:1}} }]);
        const lifelineStats={fiftyFifty:0,audiencePoll:0,askExpert:0,skipQuestion:0};
        lifelineAgg.forEach(x=>{if(lifelineStats[x._id]!==undefined)lifelineStats[x._id]=x.count;});
        stats.lifelineUses=lifelineStats;
        res.json({success:true,stats,users,withdrawals});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

function nmPro(u){return u.name||u.username||u.student_id||u.id||"Unknown";}

router.get("/pro/user/:id", adminAuth, async(req,res)=>{
    try{
        const u=await User.findById(req.params.id).select("-password").lean();
        if(!u)return res.status(404).json({success:false,message:"Student not found"});
        res.json({success:true,user:u});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.post("/pro/warning/:id", adminAuth, async(req,res)=>{
    try{
        const u=await User.findById(req.params.id);
        if(!u)return res.status(404).json({success:false,message:"Student not found"});
        const reason=String(req.body.reason||"Admin warning").slice(0,500);

        u.warningCount=Number(u.warningCount||0)+1;
        u.warningHistory=u.warningHistory||[];
        u.warningHistory.push({time:new Date(),reason});

        if(u.warningCount>=4){
            u.warningCount=0;
            u.blockCount=Number(u.blockCount||0)+1;
            u.isBlocked=true;
            u.sessionVersion=Number(u.sessionVersion||0)+1;
            u.wallet=0;

            if(u.blockCount>=4){
                u.permanentBlocked=true;
                u.blockUntil=null;
                u.blockReason="Automatic block after 4 warnings — 4th block requires admin unblock";
            }else{
                u.permanentBlocked=false;
                u.blockUntil=new Date(Date.now()+3*60*60*1000);
                u.blockReason=`Automatic 3-hour block (${u.blockCount}/3 temporary blocks)`;
            }
        }

        await proAdminLog(u,"WARNING",reason);
        await u.save();
        res.json({
            success:true,
            message:u.permanentBlocked
              ? "4th block reached — admin unblock required"
              : u.isBlocked
                ? `4 warnings reached — student blocked for 3 hours (${u.blockCount}/3)`
                : `Warning ${u.warningCount}/4 added`,
            warningCount:u.warningCount,
            blockCount:Number(u.blockCount||0),
            isBlocked:!!u.isBlocked,
            permanentBlocked:!!u.permanentBlocked,
            remainingMs:u.isBlocked&&u.blockUntil?Math.max(0,new Date(u.blockUntil).getTime()-Date.now()):0
        });
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.put("/pro/block/:id", adminAuth, async(req,res)=>{
    try{
        const u=await User.findById(req.params.id); if(!u)return res.status(404).json({success:false,message:"Student not found"});
        u.isBlocked=req.body.blocked!==false;
        u.blockReason=String(req.body.reason||"Admin action");
        u.permanentBlocked=false;
        u.blockUntil=u.isBlocked ? new Date(Date.now() + 3 * 60 * 60 * 1000) : null;
        if (u.isBlocked) {
            u.wallet = 0;
            u.sessionVersion = Number(u.sessionVersion || 0) + 1;
        }
        await proAdminLog(u,u.isBlocked?"BLOCK":"UNBLOCK",u.blockReason);
        await u.save();
        res.json({success:true,blocked:u.isBlocked});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.put("/pro/wallet/:id", adminAuth, async(req,res)=>{
    try{
        const amount=Number(req.body.amount);
        if(!Number.isFinite(amount))return res.status(400).json({success:false,message:"Invalid amount"});
        const u=await User.findById(req.params.id); if(!u)return res.status(404).json({success:false,message:"Student not found"});
        const reason=String(req.body.reason||"Admin wallet adjustment").slice(0,500);
        u.wallet=Math.max(0,Number(u.wallet||0)+amount);
        if(amount>0)u.totalEarn=Number(u.totalEarn||0)+amount;
        u.walletTransactions=u.walletTransactions||[];
        u.walletTransactions.push({time:new Date(),type:amount>=0?"CREDIT":"DEBIT",amount,reason,adminId:String(req.user?.id||"")});
        await proAdminLog(u,"WALLET",`${amount>=0?"+":""}${amount} — ${reason}`); await u.save();
        res.json({success:true,wallet:u.wallet,totalEarn:u.totalEarn});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.put("/pro/reset-questions/:id", adminAuth, async(req,res)=>{
    try{
        const u=await User.findById(req.params.id);if(!u)return res.status(404).json({success:false,message:"Student not found"});
        u.dailyQuestionsAnswered=0;u.dailyQuestionsDate=proTodayKey();u.spinCycleQuestionsAnswered=0;u.answeredQuestionIds=[];await proAdminLog(u,"RESET_QUESTIONS","Question progress and answered-question history reset");await u.save();
        res.json({success:true});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.put("/pro/reset-spin/:id", adminAuth, async(req,res)=>{
    try{
        const u=await User.findById(req.params.id);if(!u)return res.status(404).json({success:false,message:"Student not found"});
        u.lastSpinDate="";u.lastSpin="";await proAdminLog(u,"RESET_SPIN","Spin reset");await u.save();
        res.json({success:true});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.get("/pro/recycle-bin", adminAuth, async(req,res)=>{
    try{
        const users=await User.find({isDeleted:true}).select("-password").sort({deletedAt:-1}).lean();
        res.json({success:true,users});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.delete("/pro/permanent-delete/:id", adminAuth, async(req,res)=>{
    try{
        const u=await User.findById(req.params.id);
        if(!u)return res.status(404).json({success:false,message:"Student not found"});
        if(!u.isDeleted)return res.status(400).json({success:false,message:"Student must be in Recycle Bin first"});
        await User.deleteOne({_id:req.params.id});
        res.json({success:true,message:"Student permanently deleted"});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.put("/pro/restore/:id", adminAuth, async(req,res)=>{
    try{
        const u=await User.findById(req.params.id);if(!u)return res.status(404).json({success:false,message:"Student not found"});
        u.isDeleted=false;u.deletedAt=null;u.deletedReason="";await u.save();res.json({success:true});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.put("/permanent-user/:id", adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: "Student not found" });
        if (!user.isDeleted) return res.status(400).json({ success: false, message: "Student must be in Deleted Users first" });

        user.isDeleted = false;
        user.deletedAt = null;
        user.deletedReason = "";
        user.isPermanent = true;
        await user.save();

        return res.json({
            success: true,
            message: "User restored and marked as Permanent User."
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.put("/pro/permanent-user/:id", adminAuth, async (req, res) => {
    try {
        const u = await User.findById(req.params.id);
        if (!u) return res.status(404).json({ success: false, message: "Student not found" });
        if (!u.isDeleted) return res.status(400).json({ success: false, message: "Student must be in Recycle Bin first" });

        u.isDeleted = false;
        u.deletedAt = null;
        u.deletedReason = "";
        u.isPermanent = true;
        await u.save();

        return res.json({ success: true, message: "User restored and marked as Permanent User." });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

router.get("/pro/blocked-students", adminAuth, async(req,res)=>{
    try{
        const now = new Date();
        const users = await User.find({
            isDeleted: { $ne: true },
            isBlocked: true
        }).select("-password").lean();

        const active = [];
        const expiredIds = [];

        for (const u of users) {
            let until = u.blockUntil ? new Date(u.blockUntil) : null;

            // Older blocked records may not have blockUntil. Treat them as 12 hours
            // from updatedAt so the admin timer still has a real end time.
            if (!until || Number.isNaN(until.getTime())) {
                const started = u.updatedAt ? new Date(u.updatedAt) : now;
                until = new Date(started.getTime() + 3 * 60 * 60 * 1000);
                // Persist the canonical expiry so Student and Admin always
                // calculate from the exact same blockUntil value.
                await User.updateOne(
                    { _id: u._id, isBlocked: true },
                    { $set: { blockUntil: until } }
                );
            }

            if (until <= now) {
                expiredIds.push(u._id);
                continue;
            }

            active.push({
                id: String(u._id),
                name: nmPro(u),
                mobile: u.mobile || "",
                blockReason: u.blockReason || "",
                blockUntil: until.toISOString(),
                blockUntilMs: until.getTime()
            });
        }

        if (expiredIds.length) {
            await User.updateMany(
                { _id: { $in: expiredIds } },
                { $set: { isBlocked: false, blockUntil: null, blockReason: "", warningCount: 0 } }
            );
        }

        res.json({ success:true, users:active });
    }catch(e){
        res.status(500).json({success:false,message:e.message});
    }
});

router.get("/pro/reports", adminAuth, async(req,res)=>{
    try{
        const users=await User.find({}).select("-password").lean();
        const report=users.map(u=>({
            name:nmPro(u),id:String(u._id),mobile:u.mobile||"",
            wallet:Number(u.wallet||0),totalEarn:Number(u.totalEarn||0),
            todayQuestions:u.dailyQuestionsDate===proTodayKey()?Number(u.dailyQuestionsAnswered||0):0,
            totalQuestions:Number(u.totalQuestionsAnswered||0),
            warnings:Number(u.warningCount||0),blocked:!!u.isBlocked,
            lastSeen:u.lastSeen||null
        }));
        res.json({success:true,report});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

module.exports = router;