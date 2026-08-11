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

const app = express();

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

/* Notification modal typing fix */
(function () {
  function enableNotificationInputs() {
    const selectors = [
      '#notificationModal input',
      '#notificationModal textarea',
      '.notification-modal input',
      '.notification-modal textarea',
      '#notifyTitle',
      '#notifyMessage'
    ];
    document.querySelectorAll(selectors.join(',')).forEach(function (el) {
      el.disabled = false;
      el.readOnly = false;
      el.removeAttribute('disabled');
      el.removeAttribute('readonly');
      el.style.pointerEvents = 'auto';
      el.style.userSelect = 'text';
      el.style.webkitUserSelect = 'text';
      el.style.cursor = 'text';
      el.style.opacity = '1';
    });
  }

  document.addEventListener('click', function (e) {
    const notifyBtn = e.target.closest(
      '#notifyBtn, [onclick*="notify"], [onclick*="Notify"], .notify-btn, .notify-button'
    );
    if (notifyBtn) {
      setTimeout(enableNotificationInputs, 50);
      setTimeout(function () {
        const title = document.querySelector('#notifyTitle');
        const message = document.querySelector('#notifyMessage');
        if (title) title.focus();
      }, 120);
    }
  });

  document.addEventListener('DOMContentLoaded', function () {
    enableNotificationInputs();
    const observer = new MutationObserver(enableNotificationInputs);
    observer.observe(document.body, {childList:true, subtree:true});
  });
})();

