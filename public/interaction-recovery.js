/* Final interaction recovery: mobile-safe navigation and modal closing. */
(function () {
  'use strict';
  function byId(id){ return document.getElementById(id); }
  function hide(node){ if(!node)return; node.classList.remove('show','open','active'); node.setAttribute('aria-hidden','true'); node.style.display='none'; }
  function closeNode(node){ if(!node)return; hide(node); document.body.classList.remove('neon-modal-open','modal-open','menu-open'); }
  function closeAll(){
    ['neonFeatureModal','neonMenuPanel','withdrawPopup','chestPop','bookPurchaseModal','notificationsPanel','quizHistoryModal'].forEach(function(id){ closeNode(byId(id)); });
    document.querySelectorAll('[role="dialog"].show,.modal.show,.popup.show,.overlay.show').forEach(closeNode);
  }
  window.__recoveryCloseAll=closeAll;
  window.__recoveryCloseFeature=function(){closeNode(byId('neonFeatureModal'));};
  window.__recoveryCloseMenu=function(){closeNode(byId('neonMenuPanel'));};
  window.__recoveryCloseChest=function(){closeNode(byId('chestPop'));};
  window.__recoveryCloseWithdraw=function(){closeNode(byId('withdrawPopup'));};
  window.__recoveryCloseBook=function(){closeNode(byId('bookPurchaseModal'));};

  function nav(button){
    var txt=(button.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    var oc=(button.getAttribute('onclick')||'').toLowerCase();
    try {
      if(oc.indexOf("showscreen('dashboard')")>=0 || txt.indexOf('home')>=0){ if(typeof window.showScreen==='function') window.showScreen('dashboard'); return true; }
      if(oc.indexOf("showscreen('quiz')")>=0 || txt==='quiz'){ if(typeof window.showScreen==='function') window.showScreen('quiz'); return true; }
      if(oc.indexOf('openmissionspanel')>=0 || txt.indexOf('missions')>=0){ if(typeof window.openMissionsPanel==='function') window.openMissionsPanel(); return true; }
      if(oc.indexOf('openwithdrawpopup')>=0 || txt.indexOf('wallet')>=0){ if(typeof window.openWithdrawPopup==='function') window.openWithdrawPopup(); return true; }
      if(oc.indexOf('profile.html')>=0 || txt.indexOf('profile')>=0){ window.location.href='profile.html'; return true; }
      if(oc.indexOf('toggletheme')>=0 || button.classList.contains('neo-theme-switch')){ if(typeof window.toggleTheme==='function') window.toggleTheme(); return true; }
    }catch(e){ console.warn('nav recovery',e); }
    return false;
  }
  function isClose(t){
    if(!t)return false;
    var txt=(t.textContent||'').trim().toLowerCase();
    var cls=String(t.className||'').toLowerCase();
    return cls.indexOf('close')>=0 || t.getAttribute('aria-label')?.toLowerCase().indexOf('close')>=0 || /^(×|x|close|cancel|not now|continue playing|continue)$/.test(txt);
  }
  function modalFor(t){ return t.closest('#neonFeatureModal,#neonMenuPanel,#withdrawPopup,#chestPop,#bookPurchaseModal,[role="dialog"],.modal,.popup'); }
  function closeModal(m){
    if(!m)return false;
    try {
      if(m.id==='neonFeatureModal' && typeof window.closeNeonFeatureModal==='function') window.closeNeonFeatureModal();
      else if(m.id==='neonMenuPanel' && typeof window.closeNeonMenu==='function') window.closeNeonMenu();
      else if(m.id==='withdrawPopup' && typeof window.closeWithdrawPopup==='function') window.closeWithdrawPopup();
      else if(m.id==='chestPop' && typeof window.closeMysteryChest==='function') window.closeMysteryChest();
      else if(m.id==='bookPurchaseModal' && typeof window.closeBookPurchaseModal==='function') window.closeBookPurchaseModal();
    }catch(e){}
    setTimeout(function(){
      if(document.body.contains(m) && (m.classList.contains('show') || m.style.display!=='none')) closeNode(m);
    },20);
    return true;
  }
  function bind(){
    document.addEventListener('click',function(e){
      var t=e.target && e.target.closest ? e.target.closest('button,a,[role="button"]') : null;
      if(!t)return;
      var navbox=t.closest('.neo-bottom-nav');
      if(navbox){
        // Only cancel the browser default after a real navigation action is handled.
        if(nav(t)){ e.preventDefault(); }
        return;
      }
      var m=modalFor(t);
      if(m && isClose(t)){ e.preventDefault(); e.stopImmediatePropagation(); closeModal(m); return; }
      if(m && (t===m || t.classList.contains('neon-feature-backdrop'))){ closeModal(m); }
    },true);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeAll(); },true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
})();
