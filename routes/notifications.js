const express = require("express");
const router = express.Router();

const User = require("../models/User");
const auth = require("../middleware/auth");
const { getPublicKey } = require("../services/webPush");

// Student gets the public VAPID key.
router.get("/vapid-public-key", auth, (req, res) => {
    try {
        return res.json({
            success: true,
            publicKey: getPublicKey()
        });
    } catch (err) {
        console.error("VAPID public key error:", err.message);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// Save or update one device subscription.
// Multiple devices are supported for the same student.
router.post("/subscribe", auth, async (req, res) => {
    try {
        const subscription = req.body || {};

        if (
            !subscription.endpoint ||
            !subscription.keys?.p256dh ||
            !subscription.keys?.auth
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid push subscription"
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const cleanSubscription = {
            endpoint: String(subscription.endpoint),
            expirationTime: subscription.expirationTime
                ? new Date(subscription.expirationTime)
                : null,
            keys: {
                p256dh: String(subscription.keys.p256dh),
                auth: String(subscription.keys.auth)
            }
        };

        if (!Array.isArray(user.pushSubscriptions)) {
            user.pushSubscriptions = [];
        }

        const existingIndex = user.pushSubscriptions.findIndex(
            item => item.endpoint === cleanSubscription.endpoint
        );

        if (existingIndex >= 0) {
            user.pushSubscriptions[existingIndex] = cleanSubscription;
        } else {
            user.pushSubscriptions.push(cleanSubscription);
        }

        await user.save();

        return res.json({
            success: true,
            message: "Notifications enabled on this device",
            deviceCount: user.pushSubscriptions.length
        });
    } catch (err) {
        console.error("Push subscribe error:", err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;


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

