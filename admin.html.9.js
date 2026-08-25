
(function(){
  function addLabels(){
    document.querySelectorAll('.adminProV2 .ap2-table').forEach(function(table){
      var heads=[].slice.call(table.querySelectorAll('thead th')).map(function(th){return th.textContent.trim()});
      table.querySelectorAll('tbody tr').forEach(function(row){
        [].slice.call(row.children).forEach(function(td,i){
          if(td.tagName==='TD' && heads[i]) td.setAttribute('data-label',heads[i]);
        });
      });
    });
  }
  addLabels();
  new MutationObserver(addLabels).observe(document.body,{childList:true,subtree:true});
})();
