const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
    name: { type: String, default: "", trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    tokenVersion: { type: Number, default: 0 },
    userLoginLocked: { type: Boolean, default: false },
    // Global book visibility control. When true, no student can open the book.
    bookGloballyClosed: { type: Boolean, default: false },
    // Admin controlled app logo used in dashboard and PWA install icon
    appLogo: { type: String, default: "" },
    // Persistent admin alerts for important student events.
    alerts: [{
        type: { type: String, default: "info" },
        title: { type: String, default: "" },
        message: { type: String, default: "" },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        createdAt: { type: Date, default: Date.now },
        read: { type: Boolean, default: false }
    }]
}, { timestamps: true });

module.exports = mongoose.model("Admin", adminSchema);
