const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, res, next) => {
    try {

        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No Token"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("sessionVersion isDeleted isBlocked");

        if (!user || user.isDeleted || user.isBlocked) {
            return res.status(401).json({
                success: false,
                message: "Account is not available",
                forceLogout: true
            });
        }

        // Admin can invalidate all existing student sessions at once.
        if (Number(decoded.sessionVersion ?? 0) !== Number(user.sessionVersion || 0)) {
            return res.status(401).json({
                success: false,
                message: "Session ended by admin. Please login again.",
                forceLogout: true
            });
        }

        req.user = decoded;

        // દરેક Request પર Last Seen Update થશે
        await User.findByIdAndUpdate(req.user.id, {
            lastSeen: new Date(),
            isOnline: true
        });

        next();

    } catch (err) {

        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });

    }
};