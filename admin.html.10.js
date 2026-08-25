
/* v8 safety: prevent any mobile question truncation caused by inherited inline sizing. */
(function(){
  const style=document.createElement('style');
  style.textContent='@media(max-width:700px){.adminProV2 .ap2-question-cell,.adminProV2 .ap2-question-cell .ap2-full-question{max-height:none!important;height:auto!important;overflow:visible!important;white-space:normal!important;text-overflow:clip!important;line-clamp:unset!important;-webkit-line-clamp:unset!important;}}';
  document.head.appendChild(style);
})();
