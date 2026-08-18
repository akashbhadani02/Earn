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

        const user = await User.findById(decoded.id).select("sessionVersion isDeleted isBlocked permanentBlock blockUntil");

        if (!user || user.isDeleted) {
            return res.status(401).json({ success:false, message:"Account is not available", forceLogout:true });
        }
        if (user.isBlocked) {
            const until = user.blockUntil ? new Date(user.blockUntil).getTime() : 0;
            if (!user.permanentBlock && until > Date.now()) {
                return res.status(403).json({ success:false, blocked:true, permanent:false, message:"Your account is temporarily blocked.", blockUntil:new Date(until).toISOString(), remainingMs:until-Date.now(), forceLogout:true });
            }
            if (user.permanentBlock || !user.blockUntil) {
                return res.status(403).json({ success:false, blocked:true, permanent:true, message:"Your account is permanently blocked. Admin must unblock it.", forceLogout:true });
            }
            user.isBlocked=false; user.blockUntil=null; user.warningCycleCount=0; await user.save();
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