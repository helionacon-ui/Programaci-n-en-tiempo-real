(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ls={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
// tema claro/oscuro
function applyTheme(t){if(t)document.documentElement.setAttribute('data-theme',t);}
applyTheme(ls.get('theme',null));
$('#tbtn').onclick=()=>{const cur=document.documentElement.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');const n=cur==='dark'?'light':'dark';applyTheme(n);ls.set('theme',n)};
$('#menu').onclick=()=>$('#side').classList.toggle('open');
$$('#side a').forEach(a=>a.addEventListener('click',()=>$('#side').classList.remove('open')));
// abrir <details> si el hash apunta dentro
function openHash(){const id=decodeURIComponent(location.hash.slice(1));if(!id)return;const e=document.getElementById(id);if(!e)return;let p=e;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement}e.scrollIntoView()}
addEventListener('hashchange',openHash);setTimeout(openHash,300);
// resaltar sección activa
const secs=$$('section.sec');if(secs.length>1&&'IntersectionObserver'in window){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){$$('#side a.top').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id))}}),{rootMargin:'-20% 0px -70% 0px'});secs.forEach(s=>io.observe(s))}
// buscador
let IDX=null;const res=$('#res');
async function loadIdx(){if(IDX)return IDX;const el=$('#sidx');if(el){IDX=JSON.parse(el.textContent)}else{try{IDX=await (await fetch('search.json')).json()}catch(e){IDX=[]}}return IDX}
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
$('#q').addEventListener('input',async e=>{const q=norm(e.target.value.trim());if(q.length<2){res.style.display='none';return}const ix=await loadIdx();const ws=q.split(/\s+/);
 const out=[];for(const it of ix){const t=norm(it.title),b=it.n;let sc=0;let ok=true;for(const w of ws){if(t.includes(w))sc+=5;else if(b.includes(w))sc+=1;else{ok=false;break}}if(ok)out.push([sc,it])}
 out.sort((a,b)=>b[0]-a[0]);res.innerHTML=out.slice(0,25).map(([s,it])=>`<a href="${it.href}"><b>${it.title}</b> <small>${it.sec}</small><br><small>${it.snip}</small></a>`).join('')||'<small>Sin resultados</small>';res.style.display='block'});
document.addEventListener('click',e=>{if(!res.contains(e.target)&&e.target.id!=='q')res.style.display='none'});
document.addEventListener('keydown',e=>{if(e.key==='/'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'){e.preventDefault();$('#q').focus()}});
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
// test
$$('.q').forEach(q=>{const ok=+q.dataset.ok;$$('.o',q).forEach((o,i)=>o.onclick=()=>{if(q.dataset.done)return;q.dataset.done=1;o.classList.add(i+1===ok?'ok':'bad');$$('.o',q)[ok-1].classList.add('ok');$('.ex',q).style.display='block';upd()})});
function upd(){const all=$$('.q'),d=all.filter(q=>q.dataset.done),g=d.filter(q=>$('.o.bad',q)==null).length;const s=$('#qscore');if(s)s.textContent=g+' aciertos de '+d.length+' respondidas ('+all.length+' preguntas)'}
const rq=$('#qreset');if(rq)rq.onclick=()=>{$$('.q').forEach(q=>{delete q.dataset.done;$$('.o',q).forEach(o=>o.className='o');$('.ex',q).style.display='none'});upd()};
// tarjetas
const cards=window.CARDS||[];let ci=0,flip=false;const cd=$('#card');
function showCard(){if(!cd||!cards.length)return;const c=cards[ci];cd.textContent=flip?c[1]:c[0];cd.style.fontWeight=flip?'400':'700';$('#cn').textContent=(ci+1)+' / '+cards.length}
if(cd&&cards.length){cd.onclick=()=>{flip=!flip;showCard()};$('#cnext').onclick=()=>{ci=(ci+1)%cards.length;flip=false;showCard()};$('#cprev').onclick=()=>{ci=(ci+cards.length-1)%cards.length;flip=false;showCard()};$('#cshuf').onclick=()=>{for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]]}ci=0;flip=false;showCard()};showCard()}
// botones "abrir en el simulador"
$$('.open-sim').forEach(b=>b.onclick=()=>{const s=document.getElementById('sim-'+b.dataset.sim);if(!s)return;let p=s;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement}s.scrollIntoView({behavior:'smooth',block:'center'});const S=(window.PSTR_SIMS||{})[b.dataset.sim];if(S&&S.load)S.load(b.dataset.arg)});
// PWA
if('serviceWorker'in navigator&&location.protocol.startsWith('http')){navigator.serviceWorker.register('sw.js').catch(()=>{})}
})();
