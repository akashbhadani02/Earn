
(function(){
  const input=document.getElementById('brandingLogoInput');
  if(!input) return;
  input.addEventListener('change', async function(){
    const file=this.files?.[0]; if(!file) return;
    if(file.size>1800000){ alert('Please choose a logo under about 1.8 MB.'); this.value=''; return; }
    const status=document.getElementById('brandingUploadStatus'); status.textContent='⏳ Uploading logo...';
    // Always normalize the selected logo to a real 512x512 PNG.
    // This is important for Android/iOS PWA icons: the manifest declares PNG sizes,
    // so storing a JPEG/WebP or a small source image can make the launcher keep the old icon.
    const reader=new FileReader();
    reader.onload=async ()=>{
      try{
        const img=new Image();
        img.onload=async ()=>{
          const canvas=document.createElement('canvas');
          canvas.width=512; canvas.height=512;
          const ctx=canvas.getContext('2d');
          ctx.clearRect(0,0,512,512);
          const scale=Math.min(512/img.naturalWidth,512/img.naturalHeight);
          const w=Math.max(1,Math.round(img.naturalWidth*scale));
          const h=Math.max(1,Math.round(img.naturalHeight*scale));
          ctx.drawImage(img,Math.round((512-w)/2),Math.round((512-h)/2),w,h);
          const normalizedLogo=canvas.toDataURL('image/png');

          const token=localStorage.getItem('adminToken')||'';
          const r=await fetch('/api/admin/branding/logo',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({logoData:normalizedLogo})});
        const d=await r.json(); if(!r.ok||!d.success) throw new Error(d.message||'Upload failed');
        document.querySelectorAll('[data-brand-logo]').forEach(x=>x.src=d.logoData);
        status.textContent='✅ Logo updated. Syncing all devices...';
        if(window.refreshGlobalBranding) window.refreshGlobalBranding();
        setTimeout(()=>status.textContent='✅ Logo is live globally.',1200);
        };
        img.onerror=()=>{ status.textContent='❌ Could not read logo image'; alert('Could not read logo image'); };
        img.src=reader.result;
      }catch(e){ status.textContent='❌ '+e.message; alert(e.message); }
    };
    reader.readAsDataURL(file);
  });
  window.removeGlobalLogo=async function(){
    if(!confirm('Reset the app logo to the default Aducate logo?')) return;
    const token=localStorage.getItem('adminToken')||''; const status=document.getElementById('brandingUploadStatus'); status.textContent='⏳ Resetting...';
    try{ const r=await fetch('/api/admin/branding/logo',{method:'DELETE',headers:{Authorization:'Bearer '+token}}); const d=await r.json(); if(!r.ok||!d.success) throw new Error(d.message||'Reset failed'); if(window.refreshGlobalBranding) window.refreshGlobalBranding(); status.textContent='✅ Default logo restored.'; }catch(e){status.textContent='❌ '+e.message;}
  };
})();
