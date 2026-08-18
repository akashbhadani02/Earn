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

        // One-time repair for legacy documents that stored {} in Date fields.
        // Use the native MongoDB collection so invalid legacy values do not have
        // to pass through Mongoose casting first.
        try {
            const users = cached.conn.connection.collection("users");
            const repairResult = await users.updateMany(
                {
                    $or: [
                        { activeActivityStartedAt: { $type: "object" } },
                        { activeActivityStartedAt: { $type: "array" } },
                        { activeQuizStartedAt: { $type: "object" } },
                        { activeQuizStartedAt: { $type: "array" } }
                    ]
                },
                {
                    $set: {
                        activeActivityStartedAt: null,
                        activeQuizStartedAt: null
                    }
                }
            );
            if (repairResult.modifiedCount > 0) {
                console.log(`🧹 Repaired ${repairResult.modifiedCount} user activity date record(s)`);
            }
        } catch (repairError) {
            console.error("⚠️ Legacy date repair warning:", repairError.message);
        }

        console.log("✅ MongoDB Connected");
        return cached.conn;
    } catch (err) {
        cached.promise = null;
        console.error("❌ MongoDB Error:", err.message);
        throw err;
    }
}

module.exports = connectDB;
