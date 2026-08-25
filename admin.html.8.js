
(function(){
 let deferred=null;
 const btn=()=>document.getElementById('pwaInstallBtn');
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;});
 window.addEventListener('appinstalled',()=>{deferred=null;});
 async function install(){
   if(deferred){deferred.prompt();try{await deferred.userChoice;}catch(e){}deferred=null;return;}
   const standalone=window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;
   if(standalone){alert('Aducate Admin App is already installed/open as an app.');return;}
   return;
 }
 document.addEventListener('DOMContentLoaded',()=>{if(btn())btn().addEventListener('click',install);if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{});});
})();
