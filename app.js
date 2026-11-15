(function(){
  var t=document.getElementById('totop');if(t){var f=function(){t.classList.toggle('show',window.scrollY>700)};window.addEventListener('scroll',f,{passive:true});f();}
  var KEY='pstr-progreso',saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
  var boxes=[].slice.call(document.querySelectorAll('.check input'));if(!boxes.length)return;
  function upd(){var n=boxes.filter(function(b){return b.checked}).length,p=Math.round(100*n/boxes.length);
    var bar=document.getElementById('prog-bar'),tx=document.getElementById('prog-txt');if(bar)bar.style.width=p+'%';if(tx)tx.textContent=n+' de '+boxes.length+' temas marcados ('+p+' %)';}
  boxes.forEach(function(b){b.checked=!!saved[b.id];b.addEventListener('change',function(){saved[b.id]=b.checked;try{localStorage.setItem(KEY,JSON.stringify(saved))}catch(e){}upd();});});upd();
})();
/* ==== buscador ==== */
(function(){
  var NS='gsearch';if(window[NS])return;window[NS]=1;
  var norm=function(s){return s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();};
  var esc=function(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
  var css='.gs-fab{position:fixed;right:calc(18px + env(safe-area-inset-right,0px));bottom:calc(72px + env(safe-area-inset-bottom,0px));z-index:60;width:44px;height:44px;border-radius:50%;border:1px solid var(--line,#ccc);background:var(--surface,var(--card,#fff));color:var(--accent,#0d6e5a);box-shadow:0 2px 10px rgba(0,0,0,.18);cursor:pointer;display:grid;place-items:center;padding:0}'
  +'.gs-fab:focus-visible,.gs-side:focus-visible{outline:3px solid var(--accent,#0d6e5a);outline-offset:2px}'
  +'.gs-side{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;margin:6px 0 8px;padding:8px 10px;border:1px solid var(--line,#ccc);border-radius:10px;background:var(--surface,var(--card,#fff));color:var(--muted,#666);font:inherit;font-size:14px;cursor:pointer;text-align:left}'
  +'.gs-side kbd{font:11px/1 var(--mono,monospace);border:1px solid var(--line,#ccc);border-radius:5px;padding:2px 5px}'
  +'.gs-ov{position:fixed;inset:0;z-index:100;background:rgba(10,15,13,.55);display:none;align-items:flex-start;justify-content:center;padding:max(12px,env(safe-area-inset-top,0px)) 12px 12px}'
  +'.gs-ov.open{display:flex}.gs-box{width:min(720px,100%);max-height:calc(100dvh - 24px);display:flex;flex-direction:column;background:var(--bg,#fff);color:var(--fg,#111);border:1px solid var(--line,#ccc);border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.35);overflow:hidden;margin-top:4vh}'
  +'.gs-head{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--line,#ccc)}'
  +'.gs-in{flex:1;min-width:0;font:inherit;font-size:16px;padding:10px 12px;border-radius:10px;border:1px solid var(--line,#ccc);background:var(--surface,var(--card,#fff));color:inherit}'
  +'.gs-in::-webkit-search-cancel-button{-webkit-appearance:none;appearance:none}'
  +'.gs-x{flex:none;font:inherit;font-size:14px;border:1px solid var(--line,#ccc);background:transparent;color:inherit;border-radius:10px;padding:9px 12px;cursor:pointer}'
  +'.gs-st{padding:8px 14px 2px;font-size:13px;color:var(--muted,#666);min-height:1.5em}'
  +'.gs-res{list-style:none;margin:0;padding:6px 8px 10px;overflow:auto;overscroll-behavior:contain}'
  +'.gs-res a{display:block;padding:9px 10px;border-radius:10px;text-decoration:none;color:inherit;border:1px solid transparent}'
  +'.gs-res a:hover,.gs-res a.on{background:color-mix(in srgb,var(--accent,#0d6e5a) 9%,transparent);border-color:color-mix(in srgb,var(--accent,#0d6e5a) 35%,transparent)}'
  +'.gs-pg{font:600 11.5px/1.2 var(--mono,monospace);letter-spacing:.05em;text-transform:uppercase;color:var(--accent,#0d6e5a)}'
  +'.gs-h{font-weight:600;font-size:15px;margin:2px 0}.gs-sn{font-size:13.5px;color:var(--muted,#555);line-height:1.45}'
  +'mark.gs-m,.gs-res mark{background:color-mix(in srgb,#f5c518 55%,transparent);color:inherit;border-radius:3px;padding:0 1px}'
  +'.gs-hint{padding:14px;font-size:14px;color:var(--muted,#666)}'
  +'/*fixnav1*/@media(max-width:860px){.toc{align-items:center}.toc .gs-side{flex:none;width:auto;margin:0;white-space:nowrap;align-self:center}.toc .gs-side span{white-space:nowrap}}';
  var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  var ov,inp,res,stat,idx=null,loading=false,items=[],sel=-1,tm;
  var SVG='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
  function build(){
    ov=document.createElement('div');ov.className='gs-ov';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Buscar en la guía');
    ov.innerHTML='<div class="gs-box"><div class="gs-head"><input class="gs-in" type="search" placeholder="Buscar una palabra en toda la guía…" autocomplete="off" enterkeyhint="search" aria-label="Buscar en la guía"><button class="gs-x" type="button">Cerrar</button></div><div class="gs-st" role="status" aria-live="polite"></div><ul class="gs-res"></ul></div>';
    document.body.appendChild(ov);
    inp=ov.querySelector('.gs-in');res=ov.querySelector('.gs-res');stat=ov.querySelector('.gs-st');
    ov.addEventListener('mousedown',function(e){if(e.target===ov)close();});
    ov.querySelector('.gs-x').addEventListener('click',close);
    inp.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(run,90);});
    inp.addEventListener('keydown',function(e){
      if(e.key==='ArrowDown'){e.preventDefault();move(1);}else if(e.key==='ArrowUp'){e.preventDefault();move(-1);}
      else if(e.key==='Enter'){var a=res.querySelector('a.on')||res.querySelector('a');if(a){e.preventDefault();location.href=a.href;}}
    });
  }
  function load(cb){
    if(idx||window.GSEARCH){idx=idx||prep(window.GSEARCH);return cb();}
    if(loading)return;loading=true;stat.textContent='Cargando el índice…';
    var s=document.createElement('script');s.src='buscador-index.js';
    s.onload=function(){idx=prep(window.GSEARCH);loading=false;cb();};
    s.onerror=function(){loading=false;stat.textContent='No se pudo cargar el índice de búsqueda.';};
    document.head.appendChild(s);
  }
  function prep(g){g.e.forEach(function(e){e.n=norm(e[2]);e.m=norm(e[3]);});return g;}
  function open(q){
    if(!ov)build();ov.classList.add('open');document.documentElement.style.overflow='hidden';
    if(typeof q==='string')inp.value=q;inp.focus();inp.select();
    load(run);
  }
  function close(){if(!ov)return;ov.classList.remove('open');document.documentElement.style.overflow='';}
  function move(d){var l=[].slice.call(res.querySelectorAll('a'));if(!l.length)return;sel=(sel+d+l.length)%l.length;l.forEach(function(a,i){a.classList.toggle('on',i===sel);});l[sel].scrollIntoView({block:'nearest'});}
  function hl(text,toks){
    var n=norm(text),rg=[],k,p;
    toks.forEach(function(t){for(p=n.indexOf(t);p>=0;p=n.indexOf(t,p+t.length))rg.push([p,p+t.length]);});
    rg.sort(function(a,b){return a[0]-b[0];});
    var out='',i=0;rg.forEach(function(r){if(r[0]<i)return;out+=esc(text.slice(i,r[0]))+'<mark>'+esc(text.slice(r[0],r[1]))+'</mark>';i=r[1];});
    return out+esc(text.slice(i));
  }
  function snip(e,toks){
    var t=e[3],n=e.m,p=-1;
    for(var i=0;i<toks.length;i++){var q=n.indexOf(toks[i]);if(q>=0&&(p<0||q<p))p=q;}
    if(p<0)return esc(t.slice(0,140));
    var a=Math.max(0,p-60),b=Math.min(t.length,p+110);
    return (a>0?'… ':'')+hl(t.slice(a,b),toks)+(b<t.length?' …':'');
  }
  function run(){
    if(!idx||!ov)return;
    var q=inp.value.trim(),toks=norm(q).split(/\s+/).filter(Boolean);
    res.textContent='';sel=-1;
    if(!toks.length){stat.textContent='';res.innerHTML='<li class="gs-hint">Escribe una palabra o varias (por ejemplo «Thévenin» o «momento flector»). Se buscan en toda la guía, sin distinguir tildes ni mayúsculas.</li>';return;}
    var out=[];
    idx.e.forEach(function(e){
      var ok=true,sc=0;
      for(var i=0;i<toks.length;i++){var t=toks[i];var inH=e.n.indexOf(t)>=0,inT=e.m.indexOf(t)>=0;if(!inH&&!inT){ok=false;break;}sc+=(inH?12:0)+Math.min(8,e.m.split(t).length-1);}
      if(ok)out.push([sc,e]);
    });
    out.sort(function(a,b){return b[0]-a[0];});
    var total=out.length;out=out.slice(0,40);
    stat.textContent=total?(total+(total===1?' sección encontrada':' secciones encontradas')+(total>40?' (se muestran 40)':'')):'Sin resultados para «'+q+'».';
    var qs=encodeURIComponent(q),f=document.createDocumentFragment();
    out.forEach(function(r){
      var e=r[1],pg=idx.pages[e[0]],li=document.createElement('li'),a=document.createElement('a');
      a.href=pg[0]+'?q='+qs+(e[1]?'#'+e[1]:'');
      a.innerHTML='<div class="gs-pg">'+esc(pg[1])+'</div>'+(e[2]?'<div class="gs-h">'+hl(e[2],toks)+'</div>':'')+'<div class="gs-sn">'+snip(e,toks)+'</div>';
      li.appendChild(a);f.appendChild(li);
    });
    res.appendChild(f);
  }
  /* botones */
  var fab=document.createElement('button');fab.type='button';fab.className='gs-fab';fab.setAttribute('aria-label','Buscar en la guía');fab.title='Buscar en la guía (/)';fab.innerHTML=SVG;
  fab.addEventListener('click',function(){open();});
  document.body.appendChild(fab);
  var toc=document.querySelector('nav.toc');
  if(toc){var sb=document.createElement('button');sb.type='button';sb.className='gs-side';sb.innerHTML='<span>Buscar en la guía</span><kbd>/</kbd>';sb.addEventListener('click',function(){open();});toc.insertBefore(sb,toc.firstChild);}
  addEventListener('keydown',function(e){
    var tg=(document.activeElement&&document.activeElement.tagName)||'';
    if(e.key==='Escape'&&ov&&ov.classList.contains('open')){close();return;}
    if(((e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey)||((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'))&&!/^(INPUT|TEXTAREA|SELECT)$/.test(tg)){e.preventDefault();open();}
  });
  /* resaltado al llegar desde un resultado */
  var m=/[?&]q=([^&#]*)/.exec(location.search);
  if(m){
    var toks=norm(decodeURIComponent(m[1].replace(/\+/g,' '))).split(/\s+/).filter(Boolean);
    var go=function(){
      if(!toks.length)return;
      var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
        var p=n.parentNode;if(!p||/^(SCRIPT|STYLE|SVG|CANVAS|TEXTAREA|BUTTON|MARK|NOSCRIPT|OPTION)$/i.test(p.nodeName))return NodeFilter.FILTER_REJECT;
        if(p.closest&&p.closest('nav,.gs-ov,.sim-box,svg,mjx-container'))return NodeFilter.FILTER_REJECT;
        if(/\\\(|\\\[|\$/.test(n.nodeValue))return NodeFilter.FILTER_REJECT;
        return n.nodeValue.trim()?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
      var nodes=[],n;while((n=w.nextNode()))nodes.push(n);var first=null;
      nodes.forEach(function(n){
        var t=n.nodeValue,nt=norm(t);if(nt.length!==t.length)return;
        var rg=[];toks.forEach(function(k){for(var p=nt.indexOf(k);p>=0;p=nt.indexOf(k,p+k.length))rg.push([p,p+k.length]);});
        if(!rg.length)return;rg.sort(function(a,b){return a[0]-b[0];});
        var fr=document.createDocumentFragment(),i=0;
        rg.forEach(function(r){if(r[0]<i)return;fr.appendChild(document.createTextNode(t.slice(i,r[0])));var mk=document.createElement('mark');mk.className='gs-m';mk.textContent=t.slice(r[0],r[1]);fr.appendChild(mk);if(!first)first=mk;i=r[1];});
        fr.appendChild(document.createTextNode(t.slice(i)));n.parentNode.replaceChild(fr,n);
      });
      if(first){var d=first.closest('details');while(d){d.open=true;d=d.parentElement&&d.parentElement.closest('details');}
        setTimeout(function(){first.scrollIntoView({block:'center'});},250);}
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go);else go();
  }
})();
/* ==== /buscador ==== */
