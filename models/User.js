const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        mobile: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
        },

        wallet: {
            type: Number,
            default: 0,
        },

        quizScore: {
            type: Number,
            default: 0,
        },

        dailyReward: {
            type: Number,
            default: 0,
        },

        spinReward: {
            type: Number,
            default: 0,
        },

        // Number of quiz questions answered today.
        dailyQuestionsAnswered: {
            type: Number,
            default: 0,
        },

        // Date for dailyQuestionsAnswered, in YYYY-MM-DD format.
        dailyQuestionsDate: {
            type: String,
            default: "",
        },

        // Number of questions answered in the current 100-question spin cycle.
        // This resets after Spin, while dailyQuestionsAnswered keeps today's full count.
        spinCycleQuestionsAnswered: {
            type: Number,
            default: 0,
        },

        // Lifetime number of quiz questions answered by this user.
        // This is not reset after a 100-question spin cycle.
        totalQuestionsAnswered: {
            type: Number,
            default: 0,
        },

        // KBC-style lifelines available in the current 500-question cycle.
        // Each lifeline can be used once; all reset automatically after every 500 answered questions.
        lifelines: {
            fiftyFifty: { type: Boolean, default: true },
            audiencePoll: { type: Boolean, default: true },
            askExpert: { type: Boolean, default: true },
            skipQuestion: { type: Boolean, default: true }
        },
        lifelineCycle: {
            type: Number,
            default: 0
        },

        // Question IDs already answered by this student. These are cleared only when
        // an admin resets the student's question progress.
        answeredQuestionIds: {
            type: [mongoose.Schema.Types.ObjectId],
            default: []
        },

        totalEarn: {
            type: Number,
            default: 0,
        },

        isOnline: {
            type: Boolean,
            default: false
        },

        // Unique browser-tab presence id. Each tab gets its own id so a hidden
        // second tab cannot mark the active tab offline.
        presenceId: {
            type: String,
            default: ""
        },

        // Incremented by admin to invalidate all existing student login tokens.
        sessionVersion: {
            type: Number,
            default: 0
        },

        // Only one active student login session is allowed at a time.
        // A new login replaces this value and immediately invalidates the old device/session.
        activeSessionId: {
            type: String,
            default: ""
        },

        // Persistent browser/device identifier used for the latest active login.
        activeDeviceId: {
            type: String,
            default: ""
        },

        lastSeen: {
            type: Date,
            default: null
        },

        spinCount: {
            type: Number,
            default: 0
        },

        lastSpinDate: {
            type: String,
            default: ""
        },

        // Soft delete: deleted users are hidden from active lists but can be restored by admin.
        isDeleted: {
            type: Boolean,
            default: false
        },

        deletedAt: {
            type: Date,
            default: null
        },

        isBlocked: {
            type: Boolean,
            default: false
        },

        blockReason: {
            type: String,
            default: ""
        },

        // Temporary anti-cheating block expiry time. Each automatic block lasts 3 hours.
        blockUntil: {
            type: Date,
            default: null
        },

        // Number of anti-cheating warnings in the current warning cycle.
        // 1st-4th violation = warning; the 4th warning triggers a block.
        warningCount: {
            type: Number,
            default: 0
        },

        // Number of automatic 3-hour blocks already completed.
        // Blocks 1-3 are temporary; block 4 is permanent/admin-only.
        blockCount: {
            type: Number,
            default: 0
        },

        // Set only for the 4th block. Admin must manually unblock.
        permanentBlocked: {
            type: Boolean,
            default: false
        },

        lastClaim: {
            type: String,
            default: ""
        },

        // Hidden daily Mystery Bonus progress. Progress is based on correct answers
        // from either Quiz or English Learning activities.
        bonusDate: { type: String, default: "" },
        bonusTarget: { type: Number, default: 0 },
        bonusProgress: { type: Number, default: 0 },
        bonusQuizProgress: { type: Number, default: 0 },
        bonusLearningProgress: { type: Number, default: 0 },
        bonusUnlocked: { type: Boolean, default: false },
        bonusClaimed: { type: Boolean, default: false },
        bonusSource: { type: String, default: "" },
        bonusReward: { type: Number, default: 0 },
        bonusUnlockedAt: { type: Date, default: null },
        bonusClaimedAt: { type: Date, default: null },
        bonusLastQuestionText: { type: String, default: "" },
        bonusLastQuestionType: { type: String, default: "" },

        lastSpin: {
            type: String,
            default: ""
        },

        // Push notification subscriptions for all devices used by this student.
        // One student can have multiple phones/browsers.
        pushSubscriptions: [
            {
                endpoint: { type: String, required: true },
                expirationTime: { type: Date, default: null },
                keys: {
                    p256dh: { type: String, required: true },
                    auth: { type: String, required: true },
                },
            },
        ],

        withdrawRequests: [
            {
                amount: {
                    type: Number,
                    required: true,
                },

                fullName: {
                    type: String,
                    trim: true,
                    default: "",
                },

                mobileNumber: {
                    type: String,
                    trim: true,
                    default: "",
                },

                status: {
                    type: String,
                    enum: ["Pending", "Approved", "Paid", "Rejected", "Failed"],
                    default: "Pending",
                },

                paymentMethod: {
                    type: String,
                    enum: ["UPI", "Bank"],
                    default: "UPI",
                },

                upiId: {
                    type: String,
                    trim: true,
                    default: "",
                },

                bankName: {
                    type: String,
                    trim: true,
                    default: "",
                },

                accountHolderName: {
                    type: String,
                    trim: true,
                    default: "",
                },

                accountNumber: {
                    type: String,
                    trim: true,
                    default: "",
                },

                ifscCode: {
                    type: String,
                    trim: true,
                    default: "",
                },

                transactionId: {
                    type: String,
                    trim: true,
                    default: "",
                },

                adminNote: {
                    type: String,
                    trim: true,
                    default: "",
                },

                date: {
                    type: Date,
                    default: Date.now,
                },

                paidAt: {
                    type: Date,
                    default: null,
                },
            },
        ],


        warningHistory: [
            { time: { type: Date, default: Date.now }, reason: { type: String, default: "" } }
        ],
        walletTransactions: [
            {
                time: { type: Date, default: Date.now },
                type: { type: String, default: "ADJUSTMENT" },
                amount: { type: Number, default: 0 },
                reason: { type: String, default: "" },
                adminId: { type: String, default: "" }
            }
        ],
        adminActivity: [
            {
                time: { type: Date, default: Date.now },
                action: { type: String, default: "" },
                details: { type: String, default: "" }
            }
        ],
        loginHistory: [
            {
                time: { type: Date, default: Date.now },
                ip: { type: String, default: "" },
                userAgent: { type: String, default: "" }
            }
        ],
        deviceCount: { type: Number, default: 0 },
        deviceIds: { type: [String], default: [] },
        tabChanges: { type: Number, default: 0 },
        fastAnswers: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
        deletedReason: { type: String, default: "" },

        // Daily interactive English activity counters.
        activityDate: { type: String, default: "" },
        activityCounts: { type: Map, of: Number, default: {} },
        activityCorrect: { type: Map, of: Number, default: {} },
        activityWrong: { type: Map, of: Number, default: {} },
        activityEarn: { type: Map, of: Number, default: {} },
        activityDeduct: { type: Map, of: Number, default: {} },
        activityTabChanges: { type: Map, of: Number, default: {} },
        activityLastQuestion: { type: Map, of: Number, default: {} }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);