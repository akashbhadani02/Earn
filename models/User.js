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

        lastClaim: {
            type: String,
            default: ""
        },

        lastSpin: {
            type: String,
            default: ""
        },

        withdrawRequests: [
            {
                amount: Number,
                status: {
                    type: String,
                    default: "Pending",
                },
                date: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("User", userSchema);