const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const User = require("../models/User");
const Question = require("../models/Question");
const { ensureQuestionsSeeded } = require("./questions");
const adminAuth = require("../middleware/adminAuth");
const { webpush, configureWebPush } = require("../services/webPush");

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
// Force logout all students
// ===========================
router.post("/force-logout-all-users", adminAuth, async (req, res) => {

    try {
        const result = await User.updateMany(
            { isDeleted: { $ne: true } },
            {
                $inc: { sessionVersion: 1 },
                // IMPORTANT: Do not change lastSeen during Force Logout All.
                // lastSeen must remain the student's real last activity time.
                $set: {
                    isOnline: false
                }
            }
        );

        res.json({
            success: true,
            message: "All student sessions have been logged out.",
            affectedUsers: result.modifiedCount ?? result.nModified ?? 0
        });
    } catch (err) {
        console.error("Force Logout All Error:", err);
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

router.get("/users", adminAuth, async (req, res) => {

    try {

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

                const ONLINE_TIMEOUT = 2000; // ~3 seconds after heartbeat stops

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
        user.blockReason = "";

        // Reset warning system
        user.warningCount = 0;

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
// Admin Control Center - Real DB Data
// ===========================
router.get("/control-center", adminAuth, async (req, res) => {
    try {
        const today = todayKey();
        const users = await User.find({ isDeleted: { $ne: true } })
            .select("-password")
            .lean();

        const now = Date.now();
        const onlineTimeout = 2000;

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
        user.blockUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);
        user.blockReason = String(req.body.reason || "Blocked by admin").slice(0,300);
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
        if(user.warningCount >= 3){
            user.isBlocked = true;
            user.blockUntil = new Date(Date.now() + 12 * 60 * 60 * 1000);
            user.blockReason = "Automatic block after 3 warnings";
        }
        await user.save();
        return res.json({success:true,message:user.isBlocked?"3 warnings reached: student blocked":"Warning added",warningCount:user.warningCount,isBlocked:user.isBlocked});
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

router.get("/pro/dashboard", adminAuth, async (req,res)=>{
    try{
        const today=proTodayKey();
        const users=await User.find({}).select("-password").lean();
        const active=users.filter(u=>u.lastSeen && Date.now()-new Date(u.lastSeen).getTime()<=2000);
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
        const u=await User.findById(req.params.id); if(!u)return res.status(404).json({success:false,message:"Student not found"});
        const reason=String(req.body.reason||"Admin warning").slice(0,500);
        u.warningCount=Number(u.warningCount||0)+1;
        u.warningHistory=u.warningHistory||[];
        u.warningHistory.push({time:new Date(),reason});
        if(u.warningCount>=3){
            u.isBlocked=true;
            u.blockReason="Automatic block after 3 warnings";
            u.blockUntil=new Date(Date.now() + 12 * 60 * 60 * 1000);
        }
        await proAdminLog(u,"WARNING",reason); await u.save();
        res.json({success:true,message:u.isBlocked?"3 warnings reached — student blocked":"Warning added",warningCount:u.warningCount});
    }catch(e){res.status(500).json({success:false,message:e.message});}
});

router.put("/pro/block/:id", adminAuth, async(req,res)=>{
    try{
        const u=await User.findById(req.params.id); if(!u)return res.status(404).json({success:false,message:"Student not found"});
        u.isBlocked=req.body.blocked!==false;
        u.blockReason=String(req.body.reason||"Admin action");
        u.blockUntil=u.isBlocked ? new Date(Date.now() + 12 * 60 * 60 * 1000) : null;
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
        u.dailyQuestionsAnswered=0;u.dailyQuestionsDate=proTodayKey();await proAdminLog(u,"RESET_QUESTIONS","Daily question counter reset");await u.save();
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
                until = new Date(started.getTime() + 12 * 60 * 60 * 1000);
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