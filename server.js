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

connectDB();

app.use(cors());
app.use(express.json());

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
    // Never expose correct answers to the browser. The quiz uses the secure
    // /api/questions/next endpoint for answer validation.
    res.set("Cache-Control", "no-store");
    try {
        const bank = require("./questions.json");
        res.json(Array.isArray(bank) ? bank.map(q => ({ q:q.q, options:q.options })) : []);
    } catch (err) {
        res.status(500).json({success:false,message:"Question bank unavailable"});
    }
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