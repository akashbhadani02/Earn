require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const profileRoutes = require("./routes/profile");
const adminRoutes=require("./routes/admin");
const questionRoutes = require("./routes/questions");
const notificationRoutes = require("./routes/notifications");
const activityRoutes = require("./routes/activities");

const app = express();
app.disable("x-powered-by");

app.use(cors());
app.use(express.json());

// Always wait for MongoDB before any API route runs.
// This prevents Mongoose "users.findOne() buffering timed out" errors.
app.use("/api", async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("❌ MongoDB unavailable:", err.message);
        return res.status(503).json({
            success: false,
            message: "Database connection failed. Please try again."
        });
    }
});

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin",adminRoutes);
// app.use("/api/questions", questionRoutes.router);
app.use("/api/questions", questionRoutes.router || questionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activities", activityRoutes);

// Public fallback for the bundled quiz question bank.
app.get("/question-bank.json", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.sendFile(path.join(__dirname, "questions.json"));
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req,res)=>{
    res.sendFile(path.join(__dirname,"public","login.html"));
});

module.exports = app;

if (require.main === module) {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`🚀 Server Running on Port ${PORT}`);
    });
}