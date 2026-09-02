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

        const user = await User.findById(decoded.id).select("sessionVersion activeSessionId isDeleted isBlocked permanentBlocked");

        const isSubscriptionRoute = req.baseUrl === "/api/subscription";
        const isPermanentSubscriptionOnlySession =
            user &&
            user.isBlocked &&
            user.permanentBlocked === true &&
            isSubscriptionRoute;

        if (!user || user.isDeleted || (user.isBlocked && !isPermanentSubscriptionOnlySession)) {
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

        // Only the latest login session remains valid. If the student logs in
        // from another device, the previous device is forced out on its next request.
        if (!decoded.activeSessionId || decoded.activeSessionId !== String(user.activeSessionId || "")) {
            return res.status(401).json({
                success: false,
                message: "You logged in on another device. This device has been logged out.",
                forceLogout: true
            });
        }

        req.user = decoded;

        // IMPORTANT: Do NOT update lastSeen on every authenticated request.
        // Presence is controlled ONLY by /api/auth/heartbeat.
        // This prevents background/API requests from falsely keeping a student online.
        next();

    } catch (err) {

        return res.status(401).json({
            success: false,
            message: "Invalid Token"
        });

    }
};