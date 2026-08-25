
(function () {
  let unlocked = false;

  function unlockDevTools() {
    unlocked = true;
    window.__DEVTOOLS_UNLOCKED__ = true;
    document.documentElement.setAttribute('data-devtools-unlocked', 'true');
  }

  document.addEventListener('keydown', function (e) {
    // Unlock ONLY with Ctrl+Shift+Alt+Z.
    if (e.ctrlKey && e.shiftKey && e.altKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      e.stopPropagation();
      unlockDevTools();
      return;
    }

    if (unlocked) return;

    const key = (e.key || '').toLowerCase();

    // Block common DevTools / source shortcuts.
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['i','j','c'].includes(key)) ||
      (e.ctrlKey && key === 'u') ||
      (e.metaKey && e.altKey && ['i','j','c'].includes(key))
    ) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
  }, true);

  // Disable browser context menu until the unlock combination is used.
  document.addEventListener('contextmenu', function (e) {
    if (!unlocked) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
  }, true);

  // Also block mouse right-button events before they reach page handlers.
  document.addEventListener('mousedown', function (e) {
    if (!unlocked && e.button === 2) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
  }, true);

  // Block select/copy source-style inspection helpers before unlock.
  document.addEventListener('selectstart', function (e) {
    if (!unlocked && e.target && e.target.closest &&
        e.target.closest('[data-allow-select="true"]')) return;
  }, true);
})();
