const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const User = require("../models/User");

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