self.addEventListener("push", event => {
    let data = {};

    try {
        data = event.data ? event.data.json() : {};
    } catch (error) {
        data = {
            title: "New Notification",
            body: event.data ? event.data.text() : ""
        };
    }

    const title = data.title || "New Notification";
    const options = {
        body: data.body || "",
        icon: data.icon || "/icon-192.png",
        badge: data.badge || "/icon-192.png",
        tag: data.tag || "admin-notification",
        requireInteraction: Boolean(data.requireInteraction),
        data: {
            url: data.url || "/earn.html"
        }
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || "/earn.html";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if ("focus" in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }

            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});


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

