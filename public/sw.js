// ADUCATE PWA SERVICE WORKER - BRANDING AWARE
const SW_VERSION = 'aducate-branding-live-v4';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'BRANDING_UPDATED' || data.type === 'CHECK_BRANDING') {
    // The browser/OS owns the installed launcher icon cache. We can ensure
    // every web/PWA surface requests the current version immediately.
    event.waitUntil((async()=>{
      try {
        const r = await fetch('/api/branding?_=' + Date.now(), {cache:'no-store'});
        const d = await r.json();
        if (d?.version) {
          const list = await self.clients.matchAll({type:'window', includeUncontrolled:true});
          list.forEach(c => c.postMessage({type:'BRANDING_VERSION', version:d.version}));
        }
      } catch(e) {}
    })());
  }
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.pathname === '/manifest.webmanifest' || url.pathname === '/api/branding' || url.pathname === '/api/branding/icon') {
    event.respondWith(fetch(event.request, {cache:'no-store'}).catch(()=>caches.match(event.request)));
  }
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch (error) { data = {title:'New Notification', body:event.data ? event.data.text() : ''}; }
  const title = data.title || 'New Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/api/branding/icon?v=live&size=192',
    badge: data.badge || '/api/branding/icon?v=live&size=192',
    tag: data.id ? `admin-notification-${data.id}` : (data.tag || 'admin-notification'),
    requireInteraction: Boolean(data.requireInteraction),
    data: {url: data.url || '/earn.html'}
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/earn.html';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(clientList=>{
    for(const client of clientList){ if('focus' in client){ client.navigate(targetUrl); return client.focus(); } }
    if(clients.openWindow) return clients.openWindow(targetUrl);
  }));
});
