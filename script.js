(function(){
  function showToast(msg){
    let t = document.getElementById('toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(()=> t.classList.remove('show'), 3500);
  }

  const btn = document.getElementById('pixBtn');
  if(btn){
    btn.addEventListener('click', async function(){
      const pix = this.dataset.pix || '';
      if(!pix) return;
      try{
        await navigator.clipboard.writeText(pix);
      }catch(e){
        const ta = document.createElement('textarea');
        ta.value = pix;
        document.body.appendChild(ta);
        ta.select();
        try{ document.execCommand('copy'); }catch(_){}
        ta.remove();
      }
      showToast('pix ' + pix + ' copiado, cole no seu app de banco');
    });
  }
})();
