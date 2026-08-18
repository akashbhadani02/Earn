const mongoose = require("mongoose");

// MongoDB may contain legacy/corrupted values such as {} in these fields.
// Mongoose Date fields must receive a real Date, null, or an empty value.
function safeDateValue(value) {
    if (value === null || value === undefined || value === "") return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    if (typeof value === "number" || typeof value === "string") {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    // Never allow objects/arrays such as {} to reach Mongoose Date casting.
    return null;
}

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

        totalEarn: {
            type: Number,
            default: 0,
        },

        activeQuizQuestionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Question",
            default: null
        },
        activeQuizStartedAt: {
            type: Date,
            default: null,
            set: safeDateValue
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

        // Temporary anti-cheating block expiry time. Block lasts 12 hours.
        blockUntil: {
            type: Date,
            default: null
        },

        // Anti-cheating cycle counters. warningCount resets after each timed block.
        // blockCount counts automatic timed/final blocks: 1..3 = timed, 4 = permanent/admin-only.
        warningCount: {
            type: Number,
            default: 0
        },
        blockCount: {
            type: Number,
            default: 0
        },
        permanentBlocked: {
            type: Boolean,
            default: false
        },
        // The currently issued English-learning question. The correct answer never
        // needs to be stored in the browser; the server resolves this index.
        activeActivityType: { type: String, default: "" },
        activeActivityQuestionId: { type: Number, default: null },
        activeActivityStartedAt: { type: Date, default: null, set: safeDateValue },
        activeActivityToken: { type: String, default: "" },

        lastClaim: {
            type: String,
            default: ""
        },

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