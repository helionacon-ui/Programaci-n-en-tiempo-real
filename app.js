(function(){
  var t=document.getElementById('totop');if(t){var f=function(){t.classList.toggle('show',window.scrollY>700)};window.addEventListener('scroll',f,{passive:true});f();}
  var KEY='pstr-progreso',saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
  var boxes=[].slice.call(document.querySelectorAll('.check input'));if(!boxes.length)return;
  function upd(){var n=boxes.filter(function(b){return b.checked}).length,p=Math.round(100*n/boxes.length);
    var bar=document.getElementById('prog-bar'),tx=document.getElementById('prog-txt');if(bar)bar.style.width=p+'%';if(tx)tx.textContent=n+' de '+boxes.length+' temas marcados ('+p+' %)';}
  boxes.forEach(function(b){b.checked=!!saved[b.id];b.addEventListener('change',function(){saved[b.id]=b.checked;try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){}upd();});});upd();
})();