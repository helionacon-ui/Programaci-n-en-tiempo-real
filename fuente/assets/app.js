(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ls={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
// tema claro/oscuro: sigue al sistema (prefers-color-scheme)
{const root=document.documentElement,b=$('#theme'),sv=ls.get('tr-theme',null);if(sv)root.setAttribute('data-theme',sv);
 if(b)b.onclick=()=>{const cur=root.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'),nx=cur==='dark'?'light':'dark';root.setAttribute('data-theme',nx);ls.set('tr-theme',nx)}}
// volver arriba
const tt=$('#totop');if(tt){const f=()=>tt.classList.toggle('show',scrollY>700);addEventListener('scroll',f,{passive:true});f()}
// abrir <details> si el hash apunta dentro
function openHash(){const id=decodeURIComponent(location.hash.slice(1));if(!id)return;const e=document.getElementById(id);if(!e)return;let p=e;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement}e.scrollIntoView()}
addEventListener('hashchange',openHash);setTimeout(openHash,300);
// buscador global
let IDX=null;const q=$('#gsrch'),res=$('#gsrch-out');
async function loadIdx(){if(IDX)return IDX;if(window.SEARCH_INDEX){IDX=window.SEARCH_INDEX}else{const el=$('#sidx');IDX=el?JSON.parse(el.textContent):[]}return IDX}
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
if(q)q.addEventListener('input',async e=>{const v=norm(e.target.value.trim());if(v.length<2){res.hidden=true;return}const ix=await loadIdx();const ws=v.split(/\s+/);
 const out=[];for(const it of ix){const t=norm(it.title),b=it.n;let sc=0;let ok=true;for(const w of ws){if(t.includes(w))sc+=5;else if(b.includes(w))sc+=1;else{ok=false;break}}if(ok)out.push([sc,it])}
 out.sort((a,b)=>b[0]-a[0]);res.innerHTML=out.slice(0,25).map(([s,it])=>`<a href="${it.href}"><b>${it.title}</b> <small>${it.sec}</small><br><small>${it.snip}</small></a>`).join('')||'<small>Sin resultados</small>';res.hidden=false});
document.addEventListener('keydown',e=>{if(e.key==='/'&&q&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();q.focus()}});
// checklist
const checks=$$('.chk input');const kk='chk:'+(document.body.dataset.site||'x');let st=ls.get(kk,{});
function updProg(){const n=checks.filter(c=>c.checked).length;$$('.prog>i').forEach(i=>i.style.width=(100*n/Math.max(1,checks.length))+'%');$$('.progn').forEach(s=>s.textContent=n+' / '+checks.length)}
checks.forEach(c=>{c.checked=!!st[c.dataset.id];c.onchange=()=>{st[c.dataset.id]=c.checked;ls.set(kk,st);updProg()}});updProg();
// pestañas
$$('.tabs').forEach(tb=>{const bs=$$('button',tb);bs.forEach(b=>b.onclick=()=>{bs.forEach(x=>x.classList.toggle('on',x===b));const g=tb.dataset.g;$$('.panel[data-g="'+g+'"]').forEach(p=>p.classList.toggle('on',p.dataset.t===b.dataset.t))})});
// filtros exámenes
const fchips=$$('.chips[data-f] .chip'),fq=$('#exq');
function filt(){const act=fchips.filter(c=>c.classList.contains('on')).map(c=>c.dataset.v);const q=fq?norm(fq.value):'';let shown=0;
 $$('details.exam').forEach(d=>{const ok=(!act.length||act.some(a=>d.dataset.f.split(' ').includes(a)))&&(!q||norm(d.dataset.txt).includes(q));d.style.display=ok?'':'none';if(ok)shown++;if(q&&ok)d.open=true});
 $$('details.cur').forEach(c=>{const any=$$('details.exam',c).some(d=>d.style.display!=='none');c.style.display=any?'':'none'});const s=$('#exn');if(s)s.textContent=shown+' exámenes'}
fchips.forEach(c=>c.onclick=()=>{c.classList.toggle('on');filt()});if(fq)fq.addEventListener('input',filt);
// test (con repaso de falladas: se guardan en este navegador)
const site=document.body.dataset.site||'x',QK='sr:quiz:'+site;let failed=new Set(ls.get(QK,[]));
const qkey=q=>($('b',q)||q).textContent.replace(/^\d+\.\s*/,'').slice(0,60);
$$('.q').forEach(q=>{const ok=+q.dataset.ok;$$('.o',q).forEach((o,i)=>o.onclick=()=>{if(q.dataset.done)return;q.dataset.done=1;o.classList.add(i+1===ok?'ok':'bad');$$('.o',q)[ok-1].classList.add('ok');$('.ex',q).style.display='block';
 if(i+1===ok)failed.delete(qkey(q));else failed.add(qkey(q));ls.set(QK,[...failed]);upd()})});
function upd(){const all=$$('.q'),d=all.filter(q=>q.dataset.done),g=d.filter(q=>$('.o.bad',q)==null).length;const s=$('#qscore');if(s)s.textContent=g+' aciertos de '+d.length+' respondidas ('+all.filter(q=>q.style.display!=='none').length+' preguntas)';const rb=$('#qfail');if(rb)rb.textContent='Repasar falladas ('+all.filter(q=>failed.has(qkey(q))).length+')'}
function resetQ(){$$('.q').forEach(q=>{delete q.dataset.done;$$('.o',q).forEach(o=>o.className='o');$('.ex',q).style.display='none'})}
const rq=$('#qreset');if(rq){rq.onclick=()=>{resetQ();$$('.q').forEach(q=>q.style.display='');upd()};
 const fb=document.createElement('button');fb.id='qfail';fb.type='button';fb.style.marginLeft='6px';rq.after(fb);
 fb.onclick=()=>{resetQ();const n=$$('.q').filter(q=>failed.has(qkey(q)));$$('.q').forEach(q=>q.style.display=failed.has(qkey(q))?'':'none');if(!n.length)alert('No tienes preguntas falladas guardadas. ¡Bien!');else n[0].scrollIntoView({block:'center'});upd()};
 upd()}
// tarjetas con repetición espaciada (cajas de Leitner: 1 → 5; los intervalos crecen si aciertas)
const all=window.CARDS||[],CK='sr:cards:'+site,DAY=864e5,INT=[0,10*60e3,DAY,3*DAY,7*DAY,21*DAY];
let sr=ls.get(CK,{}),onlyDue=ls.get('sr:mode:'+site,false),ci=0,flip=false;const cd=$('#card');
const isDue=c=>!sr[c[0]]||sr[c[0]][1]<=Date.now();
const deck=()=>onlyDue?all.filter(isDue):all;
function srStats(){const m=all.filter(c=>sr[c[0]]&&sr[c[0]][0]>=4).length,d=all.filter(isDue).length;return d+' pendientes · '+m+' dominadas de '+all.length}
function showCard(){if(!cd||!all.length)return;const dk=deck(),st=$('#srstat');if(st)st.textContent=srStats();const ctl=$('#srctl');
 if(!dk.length){cd.textContent='¡Todo al día! No hay tarjetas pendientes ahora mismo.';cd.style.fontWeight='700';$('#cn').textContent='0 / 0';if(ctl)ctl.style.visibility='hidden';return}
 if(ci>=dk.length)ci=0;const c=dk[ci];cd.textContent=flip?c[1]:c[0];cd.style.fontWeight=flip?'400':'700';$('#cn').textContent=(ci+1)+' / '+dk.length;if(ctl)ctl.style.visibility=flip?'visible':'hidden'}
if(cd&&all.length){
 const bar=document.createElement('div');bar.style.cssText='margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap';
 bar.innerHTML='<span id="srctl" style="visibility:hidden"><button id="srok" type="button">✔ La sabía</button> <button id="srko" type="button">✘ Fallé</button></span><label><input type="checkbox" id="srdue"> Solo pendientes</label><small id="srstat"></small><button id="srreset" type="button" title="Borra el progreso de repaso guardado en este navegador">Reiniciar progreso</button>';
 cd.parentNode.insertBefore(bar,$('#cprev').parentNode.nextSibling);$('#srdue').checked=onlyDue;
 cd.onclick=()=>{flip=!flip;showCard()};$('#cnext').onclick=()=>{ci++;flip=false;showCard()};$('#cprev').onclick=()=>{ci=Math.max(0,ci-1);flip=false;showCard()};
 $('#cshuf').onclick=()=>{for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]]}ci=0;flip=false;showCard()};
 const grade=ok=>{const dk=deck();if(!dk.length)return;const c=dk[ci],b=ok?Math.min(Math.max(2,((sr[c[0]]||[0])[0]||0)+1),5):1;sr[c[0]]=[b,Date.now()+INT[b]];ls.set(CK,sr);flip=false;if(!onlyDue)ci++;showCard()};
 $('#srok').onclick=()=>grade(true);$('#srko').onclick=()=>grade(false);
 $('#srdue').onchange=e=>{onlyDue=e.target.checked;ls.set('sr:mode:'+site,onlyDue);ci=0;flip=false;showCard()};
 $('#srreset').onclick=()=>{if(confirm('¿Borrar el progreso de repaso de las tarjetas y las preguntas falladas?')){sr={};ls.set(CK,sr);failed=new Set();ls.set(QK,[]);ci=0;flip=false;showCard();upd()}};
 showCard()}
// botones "abrir en el simulador"
$$('.open-sim').forEach(b=>b.onclick=()=>{const s=document.getElementById('sim-'+b.dataset.sim);if(!s)return;let p=s;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement}s.scrollIntoView({behavior:'smooth',block:'center'});const S=(window.PSTR_SIMS||{})[b.dataset.sim];if(S&&S.load)S.load(b.dataset.arg)});
// vídeos de YouTube: se cargan al pulsar (no se descarga nada antes)
$$('.yt').forEach(y=>{const id=y.dataset.id,b=$('.ytbtn',y);
 const th=new Image();th.onload=()=>{b.style.backgroundImage='url('+th.src+')'};th.src='https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
 b.onclick=()=>{const f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0';f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;f.title=$('b',y).textContent;f.loading='lazy';y.classList.add('on');b.replaceWith(f)}});
// figuras: pulsa para ampliar
const lb=document.createElement('div');lb.id='lb';lb.innerHTML='<div class="in"></div>';document.body.appendChild(lb);
lb.onclick=()=>lb.classList.remove('on');addEventListener('keydown',e=>{if(e.key==='Escape')lb.classList.remove('on')});
$$('figure.fig').forEach(f=>{f.title='Pulsa para ampliar';f.onclick=()=>{$('.in',lb).innerHTML=f.innerHTML;lb.classList.add('on')}});
// PWA
if('serviceWorker'in navigator&&location.protocol.startsWith('http')){navigator.serviceWorker.register('sw.js').catch(()=>{})}
})();
