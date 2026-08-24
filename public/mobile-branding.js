/* Dynamic branding helper for web + Capacitor wrapper. */
(function () {
  const KEY = 'brandingVersion';
  let last = null;

  async function refresh() {
    try {
      const r = await fetch('/api/admin/branding/version?t=' + Date.now(), {
        cache: 'no-store',
        credentials: 'include'
      });
      if (!r.ok) return;
      const data = await r.json();
      const version = String(data.version || data.updatedAt || Date.now());
      if (version === last) return;
      last = version;
      localStorage.setItem(KEY, version);
      document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach(el => {
        const href = el.getAttribute('href');
        if (href && !href.startsWith('data:')) el.setAttribute('href', href.split('?')[0] + '?v=' + encodeURIComponent(version));
      });
      window.dispatchEvent(new CustomEvent('branding-updated', { detail: data }));
    } catch (_) {}
  }

  refresh();
  setInterval(refresh, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
