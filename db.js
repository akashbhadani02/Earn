const mongoose = require("mongoose");

let cached = global.__mongooseCache;
if (!cached) {
    cached = global.__mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured in Vercel Environment Variables");
    }

    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
        });
    }

    try {
        cached.conn = await cached.promise;
        console.log("✅ MongoDB Connected");
        return cached.conn;
    } catch (err) {
        cached.promise = null;
        console.error("❌ MongoDB Error:", err.message);
        throw err;
    }
}

module.exports = connectDB;
