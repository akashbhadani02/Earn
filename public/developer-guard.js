/* Aducate client-side developer-tools guard.
   Note: browser DevTools are controlled by the browser, not the webpage.
   Ctrl+Shift+Alt+Z disables this page-level guard for the current tab so
   the browser's normal developer-tools shortcuts can be used. */
(function(){
  const UNLOCK = e => e.ctrlKey && e.shiftKey && e.altKey && (e.code === 'KeyZ' || e.key.toLowerCase()==='z');
  let unlocked = false;
  function isBlocked(e){
    if(unlocked) return false;
    const k=(e.key||'').toLowerCase();
    const c=e.code||'';
    return e.key==='F12' ||
      (e.ctrlKey && e.shiftKey && ['i','j','c','k'].includes(k)) ||
      (e.ctrlKey && (k==='u' || c==='KeyU')) ||
      (e.ctrlKey && e.shiftKey && e.altKey && (k==='z'||c==='KeyZ'));
  }
  const keyHandler=e=>{
    if(UNLOCK(e)){
      unlocked=true;
      document.documentElement.dataset.devUnlocked='1';
      try{ console.info('[Aducate] Developer tools unlocked for this tab.'); }catch(_){}
      return;
    }
    if(isBlocked(e)){ e.preventDefault(); e.stopImmediatePropagation(); }
  };
  const menu=e=>{ if(!unlocked){e.preventDefault();e.stopImmediatePropagation();} };
  const drag=e=>{ if(!unlocked){e.preventDefault();} };
  window.addEventListener('keydown',keyHandler,true);
  document.addEventListener('keydown',keyHandler,true);
  window.addEventListener('contextmenu',menu,true);
  document.addEventListener('contextmenu',menu,true);
  window.addEventListener('dragstart',drag,true);
  document.addEventListener('dragstart',drag,true);
  // Disable text selection only where it is not an input/editable field.
  document.addEventListener('selectstart',e=>{
    if(!unlocked && !e.target.closest('input,textarea,[contenteditable="true"]')){
      e.preventDefault();
    }
  },true);
  // Best-effort debugger deterrent; not a security boundary.
  setInterval(()=>{ if(unlocked) return; }, 2000);
})();