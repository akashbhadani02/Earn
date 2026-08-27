const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const router = express.Router();

const auth = require("../middleware/auth");
const User = require("../models/User");

// Same encryption format used by signup/admin credential management.
// This keeps the latest student-chosen password available to authorized admin users.
const CREDENTIAL_ALGO = "aes-256-gcm";
const CREDENTIAL_KEY = crypto.createHash("sha256")
    .update(String(process.env.CREDENTIAL_ENCRYPTION_KEY || process.env.JWT_SECRET || "change-this-secret"))
    .digest();

function encryptStudentPassword(password) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(CREDENTIAL_ALGO, CREDENTIAL_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(String(password), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

router.get("/", auth, async (req, res) => {

    try {

        const user = await User.findById(req.user.id).select("-password");

        res.json({

            success: true,

            user

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

});

module.exports = router;