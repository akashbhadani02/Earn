
(function(){
  const KEY='adminThemeMode';
  function apply(mode){
    const night=mode==='night';
    document.documentElement.classList.toggle('admin-night',night);
    const btn=document.getElementById('themeToggleBtn');
    if(btn){btn.textContent=night?'☀️ Day':'🌙 Night';btn.title=night?'Switch to Day Mode':'Switch to Night Mode';}
    try{localStorage.setItem(KEY,night?'night':'day');}catch(e){}
  }
  window.toggleAdminTheme=function(){
    apply(document.documentElement.classList.contains('admin-night')?'day':'night');
  };
  let saved='day';
  try{saved=localStorage.getItem(KEY)||'day';}catch(e){}
  apply(saved);
})();
