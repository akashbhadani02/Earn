require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const profileRoutes = require("./routes/profile");
const adminRoutes=require("./routes/admin");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin",adminRoutes);

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