require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./db");
const User = require("./models/User");

const authRoutes = require("./routes/auth");
const walletRoutes = require("./routes/wallet");
const profileRoutes = require("./routes/profile");
const adminRoutes=require("./routes/admin");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.set("io", io);
const User = require("./models/User");

io.on("connection", (socket) => {

    console.log("✅ New Socket Connected");

    socket.on("student-online", async (userId) => {

        socket.userId = userId;

        await User.findByIdAndUpdate(userId, {
            isOnline: true
        });

        io.emit("online-update", {
            userId,
            isOnline: true
        });

        console.log(userId + " Online");

    });

    socket.on("disconnect", async () => {

        console.log("❌ Disconnect Fired");

        if (!socket.userId) return;

        await User.findByIdAndUpdate(socket.userId, {
            isOnline: false
        });

        io.emit("online-update", {
            userId: socket.userId,
            isOnline: false
        });

        console.log(socket.userId + " Offline");

    });

}); 

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

    server.listen(PORT, () => {
    console.log(`🚀 Server Running on Port ${PORT}`);
});
}