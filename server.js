require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const connectDB = require("./db");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

const publicDir = path.join(__dirname, "public");

// Static files are served before API database middleware.
app.use(express.static(publicDir, {
  index: false,
  extensions: ["html"],
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));

// Simple public health check. This does not require MongoDB.
app.get("/api/health", async (req, res) => {
  res.json({
    success: true,
    service: "aducate-english",
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// Public branding/icon endpoint. Falls back to the bundled logo.
// Admin can store a database logo; that route is handled below.
app.get("/api/branding/icon", async (req, res) => {
  try {
    const Branding = require("./models/Branding");
    const branding = await Branding.findOne({ key: "global" }).select("logoData").lean();
    if (branding?.logoData && /^data:image\//i.test(branding.logoData)) {
      const match = branding.logoData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
      if (match) {
        const type = match[1].toLowerCase() === "jpg" ? "jpeg" : match[1].toLowerCase();
        res.set("Cache-Control", "no-store");
        res.type(`image/${type}`).send(Buffer.from(match[2], "base64"));
        return;
      }
    }
  } catch (_) {}
  const fallback = path.join(publicDir, "aducate.png");
  if (fs.existsSync(fallback)) return res.sendFile(fallback);
  return res.status(404).end();
});

// API database middleware. Every application API except health/icon gets a
// cached MongoDB connection. This is compatible with Vercel serverless.
app.use("/api", async (req, res, next) => {
  if (req.path === "/health" || req.path === "/branding/icon") return next();
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("MongoDB/API connection error:", err.message);
    res.status(503).json({
      success: false,
      message: "Database connection is not available.",
      error: process.env.NODE_ENV === "production" ? undefined : err.message
    });
  }
});

// Routers
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/questions", require("./routes/questions").router);
app.use("/api/activities", require("./routes/activities"));
app.use("/api/student", require("./routes/student"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/bonus", require("./routes/bonus"));
app.use("/api/book-purchases", require("./routes/bookPurchases"));
app.use("/api/notifications", require("./routes/notifications"));

// The withdraw router is currently intentionally empty; withdraw endpoints
// are provided by the wallet/admin routers in this project.

// Public page routing.
app.get("/", (req, res) => res.sendFile(path.join(publicDir, "login.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(publicDir, "admin-login.html")));
app.get("/student", (req, res) => res.sendFile(path.join(publicDir, "login.html")));
app.get("/earn", (req, res) => res.sendFile(path.join(publicDir, "earn.html")));

// API 404 must be JSON.
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

// SPA/static fallback for unknown browser routes.
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, "login.html"));
});

// Central error handler.
app.use((err, req, res, next) => {
  console.error("Unhandled application error:", err);
  if (res.headersSent) return next(err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === "production"
      ? "Internal server error"
      : (err.message || "Internal server error")
  });
});

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  app.listen(port, "0.0.0.0", () => {
    console.log(`🚀 Aducate English server running on port ${port}`);
  });
}

module.exports = app;
