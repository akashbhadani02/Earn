
(function(){
  const FALLBACK='/aducate.png';
  let currentVersion=null;
  function setLink(rel, href, sizes){
    let el=document.querySelector(`link[rel="${rel}"]${sizes?`[sizes="${sizes}"]`:''}`);
    if(!el){ el=document.createElement('link'); el.rel=rel; if(sizes) el.sizes=sizes; document.head.appendChild(el); }
    el.href=href;
  }
  function applyBranding(data){
    const version=Number(data?.version||0);
    if(currentVersion===version && document.documentElement.dataset.brandingReady==='1') return;
    currentVersion=version;
    document.documentElement.dataset.brandingReady='1';
    const src=`/api/branding/icon?v=${version}&size=512&t=${Date.now()}`;
    document.querySelectorAll('[data-brand-logo]').forEach(img=>{ img.src=src; img.alt='Aducate Logo'; });
    setLink('icon', src, '192x192');
    setLink('apple-touch-icon', src, '180x180');
    const manifest=document.querySelector('link[rel="manifest"]'); if(manifest) manifest.href=`/admin-manifest.webmanifest?v=admin-v2&brand=${version}&t=${Date.now()}`;
    // Broadcast the new branding to every open tab/window immediately.
    try { localStorage.setItem('aducate-branding-version', String(version)); } catch(e) {}
    try { if ('BroadcastChannel' in window) { window.__aducateBrandChannel = window.__aducateBrandChannel || new BroadcastChannel('aducate-branding'); window.__aducateBrandChannel.postMessage({type:'BRANDING_UPDATED',version}); } } catch(e) {}
    if (navigator.serviceWorker) navigator.serviceWorker.getRegistration('/').then(reg=>reg?.active?.postMessage({type:'BRANDING_UPDATED',version})).catch(()=>{});
  }
  async function refresh(){
    try{ const r=await fetch('/api/branding?_='+Date.now(),{cache:'no-store'}); const d=await r.json(); if(d.success) applyBranding(d); }catch(e){}
  }
  window.refreshGlobalBranding=refresh;

  // Also force the installed PWA service worker/manifest to revalidate after a branding change.
  if(navigator.serviceWorker){ navigator.serviceWorker.getRegistration('/').then(reg=>{ reg?.update(); reg?.active?.postMessage({type:'CHECK_BRANDING'}); }).catch(()=>{}); }
  try { window.addEventListener('storage', e=>{ if(e.key==='aducate-branding-version') refresh(); }); } catch(e) {}
  try { if ('BroadcastChannel' in window) { window.__aducateBrandChannel = new BroadcastChannel('aducate-branding'); window.__aducateBrandChannel.onmessage=e=>{ if(e.data?.type==='BRANDING_UPDATED') refresh(); }; } } catch(e) {}
  refresh();
  setInterval(refresh,3000);
})();
