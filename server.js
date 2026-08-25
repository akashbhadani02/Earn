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
const bonusRoutes = require("./routes/bonus");
const bookPurchaseRoutes = require("./routes/bookPurchases");
const Branding = require("./models/Branding");

const app = express();
app.disable("x-powered-by");

app.use(cors());
app.use(express.json({ limit: "3mb" }));

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
});

app.get("/api/health", (req, res) => {
    res.status(200).json({ success: true, service: "Aducate English", status: "ok" });
});

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
app.use("/api/bonus", bonusRoutes);
app.use("/api/book-purchases", bookPurchaseRoutes);

// Public branding endpoints. The logo itself is intentionally read-only here; only admins can change it.
app.get("/api/branding", async (req, res) => {
    try {
        const branding = await Branding.findOne({ key:"global" }).lean();
        res.set("Cache-Control", "no-store, max-age=0");
        return res.json({ success:true, version: branding?.version || 1, updatedAt: branding?.updatedAt || null });
    } catch (err) {
        return res.status(500).json({ success:false, message:err.message });
    }
});

app.get("/api/branding/icon", async (req, res) => {
    try {
        const branding = await Branding.findOne({ key:"global" }).lean();
        const fallback = path.join(__dirname, "public", "icon-192.png");
        const data = branding?.logoData || "";
        if (!data || !data.startsWith("data:image/")) return res.sendFile(fallback, { headers:{"Cache-Control":"no-store"} });
        const m = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
        if (!m) return res.sendFile(fallback, { headers:{"Cache-Control":"no-store"} });
        const ext = m[1].split("/")[1].replace("svg+xml","svg");
        const buf = Buffer.from(m[2], "base64");
        res.set("Content-Type", m[1]);
        res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
        return res.send(buf);
    } catch (err) {
        return res.sendFile(path.join(__dirname, "public", "icon-192.png"), { headers:{"Cache-Control":"no-store"} });
    }
});

app.get("/manifest.webmanifest", async (req,res)=>{
    try {
        const branding = await Branding.findOne({key:"global"}).lean();
        const v = branding?.version || 1;
        res.set("Content-Type","application/manifest+json");
        res.set("Cache-Control","no-store, max-age=0");
        return res.json({
            name:"Aducate English", short_name:"Aducate English", id:"/earn.html", start_url:`/earn.html?branding=${v}`, scope:"/", display:"standalone",
            background_color:"#667eea", theme_color:"#667eea",
            icons:[
                {src:`/api/branding/icon?v=${v}&size=192`,sizes:"192x192",type:"image/png",purpose:"any maskable"},
                {src:`/api/branding/icon?v=${v}&size=512`,sizes:"512x512",type:"image/png",purpose:"any maskable"}
            ]
        });
    } catch(e) { return res.sendFile(path.join(__dirname,"public","manifest.webmanifest")); }
});


app.use((req, res, next) => {
    if (req.path === "/books/book.pdf") return res.status(403).json({ success: false, message: "Book download requires active student access." });
    next();
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