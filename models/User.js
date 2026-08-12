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

        isOnline: {
            type: Boolean,
            default: false
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

        // Number of anti-cheating warnings received by the student.
        // 1st, 2nd and 3rd violation = warning.
        // 4th violation = account blocked.
        warningCount: {
            type: Number,
            default: 0
        },

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
        tabChanges: { type: Number, default: 0 },
        fastAnswers: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date, default: null },
        deletedReason: { type: String, default: "" }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);