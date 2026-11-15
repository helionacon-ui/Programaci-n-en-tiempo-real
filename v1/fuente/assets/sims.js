(function(){
const P=window.PSTR,S=window.PSTR_SIMS=window.PSTR_SIMS||{};
const NS='http://www.w3.org/2000/svg';
function h(tag,props,...kids){const e=document.createElement(tag);for(const k in(props||{})){if(k==='on')for(const ev in props.on)e.addEventListener(ev,props.on[ev]);else if(k==='html')e.innerHTML=props[k];else if(k in e&&k!=='list')try{e[k]=props[k]}catch(_){e.setAttribute(k,props[k])}else e.setAttribute(k,props[k])}
 kids.flat().forEach(c=>{if(c!=null)e.append(c.nodeType?c:document.createTextNode(c))});return e}
const COL=['#2456d6','#d9480f','#2b8a3e','#a61e4d','#862e9c','#0b7285'];
function gantt(tl,labels,o){o=o||{};const n=tl.length,cw=Math.max(10,Math.min(26,Math.floor(720/Math.max(n,1)))),rh=24,L=50,W=L+n*cw+10,Hh=labels.length*rh+30;
 let s=`<svg xmlns="${NS}" viewBox="0 0 ${W} ${Hh}" width="${W}" role="img" aria-label="Diagrama de Gantt">`;
 labels.forEach((l,i)=>{s+=`<text x="4" y="${i*rh+17}" font-size="13" fill="currentColor">${l}</text><line x1="${L}" x2="${W-10}" y1="${i*rh+22}" y2="${i*rh+22}" stroke="currentColor" opacity=".2"/>`});
 tl.forEach((r,t)=>{if(r>=0)s+=`<rect x="${L+t*cw}" y="${r*rh+3}" width="${cw-1}" height="${rh-8}" fill="${COL[r%COL.length]}" rx="2"><title>t=${t}</title></rect>`});
 (o.marks||[]).forEach(m=>{s+=`<text x="${L+m[1]*cw}" y="${m[0]*rh+14}" font-size="14" fill="#c92a2a" font-weight="700">✗</text>`});
 const step=n>60?10:(n>30?5:1);for(let t=0;t<=n;t+=step)s+=`<text x="${L+t*cw}" y="${labels.length*rh+16}" font-size="10" text-anchor="middle" fill="currentColor">${t}</text>`;
 return s+'</svg>'}
function box(root,title){root.innerHTML='';root.append(h('div',{className:'stt'},title));return root}
function num(v,min,max,w,cb){return h('input',{type:'number',value:v,min,max,on:{input:cb}})}
function fmt(x,d){return Number(x).toFixed(d==null?2:d).replace('.',',')}
function reg(root,load){const id=root.id.replace(/^sim-/,'');S[id]={load}}

// ---------- planificación ----------
const PRE={feb17:[[4,60,20,2],[4,10,10,1],[8,50,50,0]],jun16:[[4,100,15,2],[4,10,10,2],[8,50,50,0],[6,40,25,2]],sep16:[[12,120,120,0],[8,500,25,3],[10,20,20,3]],burns:[[3,7,7,0],[3,12,12,0],[5,20,20,0]],ej1:[[1,4,4,0],[2,6,6,0],[3,12,12,0]],fallo:[[2,4,4,0],[3,6,6,0],[3,12,12,0]]};
function rta(root,arg){box(root,'Simulador de planificación: RM / DM / EDF y tiempo de respuesta');
 let rows=(PRE[arg]||PRE.burns).map(r=>r.slice());
 const tb=h('table'),out=h('div'),pol=h('select',{on:{change:run}},h('option',{value:'RM'},'RM (periodo)'),h('option',{value:'DM'},'DM (plazo)'),h('option',{value:'EDF'},'EDF'));
 function draw(){tb.innerHTML='<tr><th>Tarea</th><th>C</th><th>T</th><th>D</th><th>B</th><th></th></tr>';rows.forEach((r,i)=>{const tr=h('tr',null,h('td',null,'τ'+(i+1)));[0,1,2,3].forEach(j=>tr.append(h('td',null,num(r[j],0,999,0,e=>{r[j]=+e.target.value;run()}))));tr.append(h('td',null,h('button',{on:{click:()=>{rows.splice(i,1);draw();run()}}},'×')));tb.append(tr)})}
 function run(){const ts=rows.map(r=>({C:r[0],T:r[1],D:r[2]||r[1],B:r[3]}));if(!ts.length){out.textContent='';return}
  const u=P.util(ts),n=ts.length,lb=P.llBound(n),H=P.hyper(ts),p=pol.value;let html=`<p>Utilización U = <b>${fmt(u,3)}</b> · cota de Liu–Layland (n=${n}) = <b>${fmt(lb,3)}</b> · hiperperiodo = <b>${H}</b>. `;
  html+=p==='EDF'?(u<=1?'EDF: U ≤ 1, planificable (si D = T).':'U &gt; 1: no planificable.'):(u<=lb?'U ≤ cota: planificable por la condición suficiente.':'U &gt; cota: la condición suficiente no concluye; usa el tiempo de respuesta.')+'</p>';
  if(p!=='EDF'){const r=P.rta(ts,p);html+='<div class="tw"><table><tr><th>Tarea</th><th>Prioridad</th><th>Iteraciones de R</th><th>R</th><th>D</th><th>¿Cumple?</th></tr>';ts.forEach((t,i)=>{const x=r.res[i];html+=`<tr><td>τ${i+1}</td><td>${r.order.length-r.order.indexOf(i)}</td><td>${x.hist.join(' → ')}</td><td>${x.R}</td><td>${t.D}</td><td>${x.ok?'✔':'✘'}</td></tr>`});html+='</table></div>'}
  const hh=Math.min(H,120),sim=P.simulate(ts,p,hh);html+=`<p>Cronograma (primeros ${hh} instantes, sin bloqueos). ${sim.misses.length?'<b style="color:#c92a2a">Hay plazos incumplidos (✗).</b>':'Ningún plazo incumplido.'}</p>`+gantt(sim.tl,ts.map((_,i)=>'τ'+(i+1)),{marks:sim.misses.map(m=>[m[0],m[1]-1])});
  out.innerHTML=html}
 root.append(h('div',{className:'row'},h('label',null,'Política: ',pol),h('button',{on:{click:()=>{rows.push([1,10,10,0]);draw();run()}}},'+ tarea'),h('small',null,'C = cómputo, T = periodo, D = plazo, B = bloqueo máximo')),h('div',{className:'tw'},tb),out);
 draw();run();root.__load=a=>{rows=(PRE[a]||PRE.burns).map(r=>r.slice());draw();run()};reg(root,root.__load)}
// ---------- ejecutivo cíclico ----------
function frames(root,arg){box(root,'Ejecutivo cíclico: tamaño del ciclo secundario');let rows=[[40,10,40],[80,8,80],[120,12,120]];
 const tb=h('table'),out=h('div');
 function draw(){tb.innerHTML='<tr><th>Tarea</th><th>T</th><th>C</th><th>D</th><th></th></tr>';rows.forEach((r,i)=>{const tr=h('tr',null,h('td',null,'τ'+(i+1)));[0,1,2].forEach(j=>tr.append(h('td',null,num(r[j],1,999,0,e=>{r[j]=+e.target.value;run()}))));tr.append(h('td',null,h('button',{on:{click:()=>{rows.splice(i,1);draw();run()}}},'×')));tb.append(tr)})}
 function run(){if(!rows.length)return;const f=P.frames(rows.map(r=>({T:r[0],C:r[1],D:r[2]})));let html=`<p>Ciclo principal Tm = mcm(T) = <b>${f.Tm}</b>. Cómputo máximo = <b>${f.maxC}</b>. El ciclo secundario Ts debe cumplir: Ts ≥ ${f.maxC}, Ts divide a Tm y 2·Ts − mcd(Ts, Tᵢ) ≤ Dᵢ para toda tarea.</p><div class="tw"><table><tr><th>Ts</th>`+rows.map((_,i)=>`<th>2Ts−mcd (τ${i+1})</th>`).join('')+'<th>¿Válido?</th></tr>';f.frames.forEach(x=>{html+=`<tr><td>${x.Ts}</td>`+x.checks.map(c=>`<td>${c.v} ${c.ok?'≤':'&gt;'} ${c.D}</td>`).join('')+`<td>${x.ok?'✔':'✘'}</td></tr>`});out.innerHTML=html+'</table></div>'}
 root.append(h('div',{className:'tw'},tb),h('button',{on:{click:()=>{rows.push([100,5,100]);draw();run()}}},'+ tarea'),out);draw();run();reg(root,()=>{})}
// ---------- carrera ----------
function race(root){box(root,'Condición de carrera: dos hilos hacen x += 2 (x empieza en 0)');
 const n=h('input',{type:'range',min:10,max:2000,value:500}),m=h('input',{type:'checkbox'}),out=h('div'),lab=h('span',null,'500 ejecuciones');
 function run(){lab.textContent=n.value+' ejecuciones';const r=P.mulberry(Date.now()%100000),c={};for(let i=0;i<+n.value;i++){const x=P.raceRandom(m.checked,r);c[x]=(c[x]||0)+1}
  const ks=Object.keys(c).sort(),mx=Math.max(...Object.values(c));let s=`<svg xmlns="${NS}" viewBox="0 0 300 120" width="300">`;ks.forEach((k,i)=>{const hh=100*c[k]/mx;s+=`<rect class="bar" x="${30+i*90}" y="${105-hh}" width="60" height="${hh}"/><text x="${60+i*90}" y="118" text-anchor="middle" font-size="12" fill="currentColor">x=${k}</text><text x="${60+i*90}" y="${100-hh}" text-anchor="middle" font-size="12" fill="currentColor">${c[k]}</text>`});
  out.innerHTML=s+'</svg><p>'+(ks.length>1||ks[0]!=='4'?'Aparece <b>x = 2</b>: se pierde una actualización (los dos hilos leyeron 0).':'Con mutex solo sale <b>x = 4</b> en todas las ejecuciones.')+'</p>'}
 root.append(h('div',{className:'row'},h('label',null,'Ejecuciones: ',n),lab,h('label',null,h('input',{type:'checkbox',id:'m'+Math.random(),on:{change:run}}),' con mutex')),out);
 root.querySelector('input[type=checkbox]').onchange=e=>{m.checked=e.target.checked;run()};n.oninput=run;root.append(h('button',{on:{click:run}},'Repetir'));run();reg(root,()=>{})}
// ---------- vector ----------
function vec(root){box(root,'std::vector: capacidad y copias con push_back');const n=h('input',{type:'range',min:1,max:64,value:20}),f=h('select',null,h('option',{value:'2'},'factor 2 (GCC)'),h('option',{value:'1.5'},'factor 1,5 (MSVC)')),r=h('input',{type:'number',value:0,min:0,max:64}),out=h('div');
 function run(){const x=P.vecGrow(+n.value,+f.value,+r.value),mx=Math.max(...x.steps.map(s=>s.cap)),w=Math.max(6,Math.floor(560/x.steps.length));let s=`<svg xmlns="${NS}" viewBox="0 0 ${w*x.steps.length+20} 130" width="${w*x.steps.length+20}">`;x.steps.forEach((t,i)=>{const hc=110*t.cap/mx,hs=110*t.size/mx;s+=`<rect x="${10+i*w}" y="${120-hc}" width="${w-1}" height="${hc}" fill="none" stroke="currentColor" opacity=".5"/><rect x="${10+i*w}" y="${120-hs}" width="${w-1}" height="${hs}" class="bar" ${t.moved?'style="fill:#d9480f"':''}/>`});
  out.innerHTML=s+`</svg><p>size final = <b>${n.value}</b>, capacity final = <b>${x.steps[x.steps.length-1].cap}</b>, realocaciones = <b>${x.reallocs}</b> (barras naranjas), elementos copiados = <b>${x.copies}</b>. Con <code>reserve(${n.value})</code> serían 1 realocación y 0 copias.</p>`}
 root.append(h('div',{className:'row'},h('label',null,'push_back ×',n),h('label',null,'crecimiento ',f),h('label',null,'reserve inicial ',r)),out);[n,f,r].forEach(e=>e.addEventListener('input',run));run();reg(root,()=>{})}
// ---------- Patriot ----------
function patriot(root){box(root,'Error de coma flotante: el reloj del Patriot');const hr=h('input',{type:'range',min:0,max:120,value:100}),out=h('div');
 function run(){const p=P.patriot(+hr.value);out.innerHTML=`<p>0,1 s en binario: <code>${P.bits(0.1,40)}…</code> (infinito periódico). Truncado a 23 bits tras la coma: error por tic = <b>${p.e.toExponential(3).replace('.',',')}</b> s.</p><p>Tras <b>${hr.value} h</b> hay ${p.ticks.toLocaleString('es-ES')} tics → deriva = <b>${fmt(p.drift,4)} s</b> → un Scud a 1676 m/s se «desplaza» <b>${fmt(p.dist,0)} m</b> respecto a donde el sistema lo busca.</p>`}
 root.append(h('div',{className:'row'},h('label',null,'Horas encendido: ',hr),h('span',null,'')),out);hr.oninput=run;run();reg(root,()=>{})}
// ---------- inversión ----------
function inv(root){box(root,'Inversión de prioridad: L (baja), M (media), H (alta) y un mutex');const sel=h('select',null,h('option',{value:'none'},'sin protocolo'),h('option',{value:'pip'},'herencia de prioridad'),h('option',{value:'icpp'},'techo de prioridad inmediato')),out=h('div');
 function run(){const r=P.inversion(sel.value);out.innerHTML=gantt(r.tl,['L','M','H'])+`<p>H termina en <b>t = ${r.fin[2]}</b> (llega en t = 3). Tiempo de respuesta de H = <b>${r.fin[2]-3}</b>; su cómputo propio es 4, luego pierde <b>${r.fin[2]-3-4}</b> unidades esperando.</p><p>L: 1 + sección crítica de 3 + 1. M llega en 2 y dura 4. H llega en 3: 1 + sección crítica de 2 + 1.</p>`}
 root.append(h('div',{className:'row'},h('label',null,'Protocolo: ',sel)),out);sel.onchange=run;run();reg(root,a=>{if(a){sel.value=a;run()}})}
// ---------- filósofos ----------
function philo(root){box(root,'Cena de los filósofos (3 cubiertos por filósofo, n+1 cubiertos)');const n=h('input',{type:'number',min:3,max:8,value:3}),md=h('select',null,h('option',{value:'seq'},'lock() de cada mutex uno a uno'),h('option',{value:'lock'},'std::lock / scoped_lock (todos a la vez)')),seed=h('input',{type:'number',value:1}),ro=h('input',{type:'number',value:20,min:1,max:200}),out=h('div');
 function run(){const r=P.philosophers(+n.value,md.value,+ro.value,P.mulberry(+seed.value));out.innerHTML=r.deadlock?`<p><b style="color:#c92a2a">INTERBLOQUEO.</b> Comidas por filósofo: ${r.eaten.join(', ')}. Cubiertos tomados por: ${r.held.map((x,i)=>`C${i+1}:${x<0?'libre':'F'+(x+1)}`).join(' · ')}</p>`:`<p><b style="color:#2b8a3e">Terminan todos.</b> Comidas por filósofo: ${r.eaten.join(', ')}.</p>`;
  let t=0;if(md.value==='seq'){let d=0;for(let s=1;s<=50;s++)if(P.philosophers(+n.value,'seq',+ro.value,P.mulberry(s)).deadlock)d++;out.innerHTML+=`<p>En 50 semillas distintas hay interbloqueo en <b>${d}</b>.</p>`}}
 root.append(h('div',{className:'row'},h('label',null,'Filósofos ',n),h('label',null,'Ciclos ',ro),h('label',null,'Semilla ',seed),md,h('button',{on:{click:run}},'Simular')),out);[n,md,seed,ro].forEach(e=>e.addEventListener('input',run));run();reg(root,()=>{})}
// ---------- laboratorio: histograma ----------
const Q='En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lentejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.';
function labWords(root,arg){box(root,'Práctica 1: histograma de palabras (map<string,int>)');const ta=h('textarea',null,Q),cs=h('input',{type:'checkbox',checked:true,on:{change:run}}),out=h('div');
 function run(){const txt=cs.checked?ta.value.toLowerCase():ta.value,w=txt.split(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/).filter(Boolean),m={};w.forEach(x=>m[x]=(m[x]||0)+1);const e=Object.entries(m).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)),top=e.slice(0,8),mx=top.length?top[0][1]:1;
  let s=`<svg xmlns="${NS}" viewBox="0 0 420 ${top.length*22+6}" width="420">`;top.forEach((t,i)=>{s+=`<text x="2" y="${i*22+16}" font-size="13" fill="currentColor">${t[0]}</text><rect class="bar" x="90" y="${i*22+4}" width="${300*t[1]/mx}" height="16"/><text x="${95+300*t[1]/mx}" y="${i*22+16}" font-size="12" fill="currentColor">${t[1]}</text>`});
  const cons=top.slice(0,2).map(t=>t[0]+': '+t[1]).join('\n');out.innerHTML=s+`</svg><div class="cons">Palabras totales: ${w.length}\nPalabras distintas: ${e.length}\nLas dos más repetidas:\n${cons}</div><pre><code>map&lt;string,int&gt; hist;\nwhile (in &gt;&gt; palabra) {\n    for (char&amp; c : palabra) c = tolower((unsigned char)c);   // ${cs.checked?'activo':'desactivado'}\n    palabra.erase(remove_if(palabra.begin(), palabra.end(), [](unsigned char c){ return ispunct(c); }), palabra.end());\n    if (!palabra.empty()) ++hist[palabra];\n}</code></pre>`}
 root.append(ta,h('div',{className:'row'},h('label',null,cs,' ignorar mayúsculas')),out);ta.oninput=run;run();reg(root,a=>{if(a==='mayus'){ta.value='Programación de Tiempo Real o programación de tiempo real';cs.checked=false}else if(a==='quijote')ta.value=Q;run()})}
// ---------- laboratorio: filas por hilo ----------
function labRows(root){box(root,'Práctica 3.1: suma de matrices por filas con n hilos');const t=h('input',{type:'number',min:1,max:16,value:6}),nh=h('input',{type:'number',min:1,max:8,value:3}),out=h('div');
 function run(){const tam=+t.value,k=+nh.value,rows=P.rows(tam,k);let html='<div class="tw"><table><tr><th>Hilo</th><th>Filas que suma (inicial = id, incremento = n)</th><th>nº filas</th></tr>';rows.forEach((r,i)=>html+=`<tr><td>${i}</td><td>${r.join(', ')||'—'}</td><td>${r.length}</td></tr>`);const mxr=Math.max(...rows.map(r=>r.length));
  html+=`</table></div><div class="cons">tiempo modelo = filas del hilo más cargado × tam = ${mxr} × ${tam} = ${mxr*tam} sumas\ntiempo con 1 hilo = ${tam*tam} sumas\nmejora teórica = ${fmt(tam*tam/(mxr*tam),2)}×</div><pre><code>vector&lt;thread&gt; v;\nfor (int id = 0; id &lt; ${k}; ++id)\n    v.emplace_back(suma_fila, ref(a), ref(b), ref(c), id, ${k});   // fila inicial id, salto ${k}\nfor (auto&amp; h : v) h.join();</code></pre>`;out.innerHTML=html}
 root.append(h('div',{className:'row'},h('label',null,'Tamaño (tam×tam) ',t),h('label',null,'Hilos ',nh)),out);[t,nh].forEach(e=>e.addEventListener('input',run));run();reg(root,()=>{})}
// ---------- enlace dinámico ----------
function bind(root){box(root,'¿Qué método se ejecuta? Enlace estático frente a dinámico');const sv=h('select',null,h('option',{value:'v'},'método virtual'),h('option',{value:'n'},'método no virtual')),how=h('select',null,h('option',{value:'ptr'},'a través de Base* (apunta a Derivada)'),h('option',{value:'ref'},'a través de Base& (referida a Derivada)'),h('option',{value:'val'},'copia por valor: Base b = derivada;'),h('option',{value:'obj'},'directamente sobre un objeto Derivada')),out=h('div');
 function run(){const virt=sv.value==='v',h2=how.value;const dyn=(h2==='ptr'||h2==='ref')&&virt,d=h2==='obj'||dyn;out.innerHTML=`<p>Se ejecuta <b>${d?'Derivada::f()':'Base::f()'}</b>.</p><p>${h2==='val'?'La copia por valor «recorta» el objeto (slicing): ya solo es un Base.':virt?(d&&h2!=='obj'?'La tabla de métodos virtuales del objeto real decide en tiempo de ejecución.':'El tipo del objeto es Derivada.'):'Sin <code>virtual</code> el compilador decide por el tipo estático (Base): enlace estático.'}</p>`}
 root.append(h('div',{className:'row'},sv,how),out);[sv,how].forEach(e=>e.onchange=run);run();reg(root,()=>{})}

function complejo(root){box(root,'Práctica 2.1: número complejo (C_Complejo)');
 const mk=(v)=>h('input',{type:'number',step:'0.5',value:v}),ar=mk(3),ai=mk(4),br=mk(1),bi=mk(-2),out=h('div');
 const fmt=(re,im)=>`${+re.toFixed(6)}${im<0?'-':'+'}${+Math.abs(im).toFixed(6)}i`;
 function run(){const a=[+ar.value,+ai.value],b=[+br.value,+bi.value];const m=Math.hypot(a[0],a[1]),g=Math.atan2(a[1],a[0]);
  const code=`C_Complejo a{${a[0]}, ${a[1]}}, b{${b[0]}, ${b[1]}};\ncout << "a+b=" << a + b << "  a-b=" << a - b << '\\n';\nauto [m, arg] = modulo_argumento(a);\ncout << "|a|=" << m << " arg(a)=" << arg << " rad\\n";`;
  out.innerHTML='<pre><code></code></pre><div class="cons"></div>';out.querySelector('code').textContent=code;
  out.querySelector('.cons').textContent=`a=${fmt(...a)} b=${fmt(...b)}\na+b=${fmt(a[0]+b[0],a[1]+b[1])}  a-b=${fmt(a[0]-b[0],a[1]-b[1])}\n|a|=${+m.toFixed(6)} arg(a)=${+g.toFixed(6)} rad`}
 root.append(h('div',{className:'row'},h('label',null,'a = ',ar,' + ',ai,'i'),h('label',null,' b = ',br,' + ',bi,'i')),out);[ar,ai,br,bi].forEach(e=>e.oninput=run);run();reg(root,()=>{})}
function almacen(root){box(root,'Práctica 3.4: almacén con un generador y varios lectores (monitor)');
 const nl=h('input',{type:'range',min:1,max:5,value:3}),lab=h('span',null,'3 lectores'),sd=h('input',{type:'number',value:1,min:1,max:9999,style:'width:6em'}),out=h('div');
 function run(){lab.textContent=nl.value+' lectores';const r=P.almacen(+nl.value,7,+sd.value);
  const rows=r.trace.map((t,k)=>`<tr><td>${k+1}</td><td>${t.who==='G'?'<b>Generador</b>':'Lector '+t.who}</td><td>${t.who==='G'?'escribe':'lee'} ${t.v}</td></tr>`).join('');
  out.innerHTML=`<p>${r.ok?'✔ Cada lector leyó los 7 valores <b>una vez y en orden</b>; el generador nunca escribió antes de que todos leyeran.':'✘ Algo falló'}</p><p>Suma que ve cada lector: <b>${r.reads.map(l=>l.reduce((a,b)=>a+b,0)).join(', ')}</b> (esperado 21).</p><div class="tw" style="max-height:260px;overflow:auto"><table><tr><th>Paso</th><th>Hilo</th><th>Acción</th></tr>${rows}</table></div><p><small>El orden de los lectores cambia con la semilla; el resultado, no.</small></p>`}
 root.append(h('div',{className:'row'},h('label',null,'Lectores: ',nl),lab,h('label',null,' semilla: ',sd)),out);nl.oninput=run;sd.oninput=run;run();reg(root,()=>{})}

// ---------- modo examen ----------
const EXAMS=[['mayo26','Mayo 2026',['ex-mayo26-1','ex-mayo26-2']],['junio26','Junio 2026',['ex-junio26-1','ex-junio26-2']],['mayo25','Mayo 2025',['ex-mayo25-1','ex-mayo25-2']],['junio25','Junio 2025',['ex-junio25-1','ex-junio25-2']],['mayo24','Mayo 2024',['ex-mayo24-1','ex-mayo24-2']],['junio23','Junio 2023',['ex-junio23-1','ex-junio23-2']],['abril24','Abril 2024 (solo el ejercicio 2 está resuelto)',['ex-abril24-2']]];
function lsGet(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function href(id){return document.getElementById(id)?'#'+id:'examenes.html#'+id}
function examen(root){box(root,'Modo examen: 2 h 30 min, enunciado primero y solución al entregar');
 const KEY='pstr:examen',HIS='pstr:examen:hist';let st=lsGet(KEY,null),tick=null;
 const body=h('div');root.append(body);
 function save(){lsSet(KEY,st)}
 function setup(){clearInterval(tick);body.innerHTML='';
  const sel=h('select',null,...EXAMS.map(e=>h('option',{value:e[0]},e[1]))),dur=h('select',null,h('option',{value:150},'Examen completo (2 h 30 min)'),h('option',{value:75},'Un ejercicio (1 h 15 min)'),h('option',{value:10},'Prueba rápida (10 min)'));
  const his=lsGet(HIS,[]);
  body.append(h('p',null,'Reparto habitual: ',h('b',null,'70 % programación orientada a objetos'),' y ',h('b',null,'30 % concurrencia'),'. Las soluciones quedan ocultas hasta que entregues. Si tu código no compila, la nota de ese ejercicio se divide por 2.'),
   h('div',{className:'row'},h('label',null,'Examen: ',sel),h('label',null,'Duración: ',dur),h('button',{on:{click:()=>{st={key:sel.value,start:Date.now(),total:+dur.value*60000,phase:'run',marks:{poo:[],conc:[]},compila:{poo:true,conc:true}};save();run()}}},'Empezar')),
   his.length?h('div',null,h('p',null,h('b',null,'Tus últimos intentos')),h('ul',null,...his.slice(-5).reverse().map(x=>h('li',null,`${x.label} · ${x.fecha} · nota estimada ${fmt(x.nota,1)} / 10`)))):h('small',null,'Aún no has guardado ningún intento.'))}
 function run(){clearInterval(tick);body.innerHTML='';const ex=EXAMS.find(e=>e[0]===st.key);
  if(st.phase==='grade')return grade();
  const t=h('div',{className:'examtimer',style:'font-size:2.4rem;font-weight:800;font-variant-numeric:tabular-nums'}),warn=h('small',null,'');
  body.append(h('p',null,'Estás haciendo: ',h('b',null,ex[1])),t,warn,
   h('p',null,h('a',{className:'btn',href:href('exam-'+st.key),target:'_blank',rel:'noopener'},'Abrir enunciado'),' ',h('small',null,'(se abre en otra pestaña; en el examen real no tendrás la solución delante)')),
   h('div',{className:'row'},h('button',{on:{click:()=>{if(confirm('¿Entregar ahora?')){st.phase='grade';save();run()}}}},'Entregar'),h('button',{on:{click:()=>{if(confirm('¿Abandonar este intento?')){st=null;lsSet(KEY,null);setup()}}}},'Abandonar')),
   h('p',null,h('small',null,'Consejo: compila con ',h('code',null,'g++ -std=c++17 -Wall -Wextra -pthread'),' antes de entregar y pasa tu código por el ',h('a',{href:'#sim-revisor'},'revisor de código'),'.')));
  function upd(){const r=P.examTimer(st.start,Date.now(),st.total);t.textContent=r.text;if(r.rest<600000)t.style.color='#c92a2a';warn.textContent=r.rest<600000&&!r.over?'Quedan menos de 10 minutos: revisa que compile.':'';if(r.over){clearInterval(tick);st.phase='grade';save();run()}}
  upd();tick=setInterval(upd,1000)}
 function grade(){body.innerHTML='';const ex=EXAMS.find(e=>e[0]===st.key);
  const out=h('div',{className:'examout'});
  function calc(){const g=P.examGrade(st.marks,st.compila);out.innerHTML=`<p>POO: <b>${fmt(g.poo.final,1)}</b> / 70${g.poo.compila?'':' (no compila: ÷ 2)'} · Concurrencia: <b>${fmt(g.conc.final,1)}</b> / 30${g.conc.compila?'':' (no compila: ÷ 2)'}</p><p style="font-size:1.4rem">Nota estimada: <b>${fmt(g.sobre10,1)}</b> / 10 ${g.sobre10>=5?'✔ aprobado':'✘ por debajo del 5'}</p>`;return g}
  body.append(h('p',null,'Tiempo agotado o entrega hecha. Autoevalúate con honestidad: marca solo lo que de verdad tendrías en el papel. ',h('small',null,'(Rúbrica orientativa propia; cada convocatoria reparte los puntos a su manera.)')));
  [['poo','Programación orientada a objetos (70 puntos)'],['conc','Concurrencia (30 puntos)']].forEach(([k,tt])=>{
   const c=h('input',{type:'checkbox',checked:st.compila[k],on:{change:e=>{st.compila[k]=e.target.checked;save();calc()}}});
   body.append(h('h4',null,tt),h('label',null,c,' Mi código de este ejercicio compila sin errores'),h('ul',{style:'list-style:none;padding-left:0'},...P.RUBRICA[k].items.map((it,i)=>h('li',null,h('label',null,h('input',{type:'checkbox',checked:!!st.marks[k][i],on:{change:e=>{st.marks[k][i]=e.target.checked;save();calc()}}}),` ${it[0]} `,h('small',null,`(${it[1]})`))))))});
  body.append(out,h('h4',null,'Soluciones de referencia'),h('p',null,...ex[2].map(id=>h('a',{className:'btn',href:href(id),style:'margin-right:8px'},id.replace('ex-','').replace(/-/g,' · ejercicio ')))),
   h('div',{className:'row'},h('button',{on:{click:()=>{const g=calc(),his=lsGet(HIS,[]);his.push({label:ex[1],nota:g.sobre10,fecha:new Date().toLocaleDateString('es-ES')});lsSet(HIS,his.slice(-20));st=null;lsSet(KEY,null);setup()}}},'Guardar resultado y empezar de nuevo'),h('button',{on:{click:()=>{st=null;lsSet(KEY,null);setup()}}},'Descartar')));
  calc()}
 st?run():setup();reg(root,()=>{})}
// ---------- revisor de código ----------
const EJ_REV={herencia:`#include <iostream>
#include <vector>
using namespace std;

class Figura {
public:
    virtual double area() const = 0;
    double get_lado() { return lado_; }
protected:
    double lado_ = 1;
};

class Cuadrado : public Figura {
public:
    double area() const { return lado_ * lado_; }
    ostream& operator<<(ostream& os) { return os << "cuadrado"; }
};

int main() {
    vector<Figura*> v;
    v.push_back(new Cuadrado);
    cout << v[0]->area() << endl;
}`,monitor:`#include <iostream>
#include <thread>
#include <vector>
using namespace std;

class Cola {
public:
    void poner(int x) { lock_guard<mutex> lk{m_}; datos_.push_back(x); cv_.notify_one(); }
    int sacar(void) {
        unique_lock<mutex> lk{m_};
        if (datos_.empty()) cv_.wait(lk);
        int v = datos_.front(); datos_.erase(datos_.begin());
        return v;
    }
    int esperar_dos() {
        lock_guard<mutex> g{m_};
        cv_.wait(g, [this]{ return datos_.size() >= 2; });
        return datos_.size();
    }
private:
    mutex m_; condition_variable cv_; vector<int> datos_;
};

void consumidor(Cola& c, int n) { for (int i = 0; i < n; ++i) cout << c.sacar() << endl; }

int main() {
    Cola c;
    thread t{consumidor, c, 3};
    c.poner(1); c.poner(2); c.poner(3);
}`};
function revisor(root,arg){box(root,'Revisor de código: busca los fallos típicos antes de entregar');
 const ta=h('textarea',{rows:16,spellcheck:false,style:'width:100%;font-family:ui-monospace,Consolas,monospace;font-size:.85rem;padding:8px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);color:var(--fg);tab-size:4'}),out=h('div');
 const sel=h('select',{on:{change:()=>{if(sel.value&&EJ_REV[sel.value])ta.value=EJ_REV[sel.value];run()}}},h('option',{value:''},'(pega tu código o elige un ejemplo con fallos)'),h('option',{value:'herencia'},'Ejemplo con fallos de herencia'),h('option',{value:'monitor'},'Ejemplo con fallos de monitor'));
 const COLR={error:'#c92a2a',warn:'#e67700',info:'#1971c2'},ETQ={error:'Error',warn:'Aviso',info:'Sugerencia'};
 function run(){const c=ta.value;if(!c.trim()){out.innerHTML='<p><small>Pega aquí tu solución. La revisión es heurística: detecta patrones típicos, <b>no sustituye al compilador</b>.</small></p>';return}
  const f=P.review(c),v=P.reviewVerdict(f);
  let html=`<p>${v.compilaria?'<b style="color:#2b8a3e">No veo errores de compilación evidentes</b>':'<b style="color:#c92a2a">Veo '+v.errores+' error'+(v.errores>1?'es':'')+' que impedirían compilar</b>'} · ${v.avisos} aviso${v.avisos===1?'':'s'}. Compila siempre con <code>g++ -std=c++17 -Wall -Wextra -pthread</code>.</p>`;
  html+=f.length?'<ol style="padding-left:1.2em">'+f.map(x=>`<li style="margin:6px 0"><span style="color:${COLR[x.level]};font-weight:700">${ETQ[x.level]}</span> · línea <b>${x.line}</b> <small>(${x.id})</small><br>${x.msg}</li>`).join('')+'</ol>':'<p>✔ Ningún patrón problemático detectado.</p>';
  out.innerHTML=html}
 root.append(h('div',{className:'row'},sel),ta,out);ta.addEventListener('input',run);run();
 reg(root,a=>{if(EJ_REV[a]){ta.value=EJ_REV[a];sel.value=a;run()}});if(arg&&EJ_REV[arg]){ta.value=EJ_REV[arg];sel.value=arg;run()}}
const R={rta,frames,race,vec,patriot,inv,philo,'lab-words':labWords,'lab-rows':labRows,bind,complejo,almacen,examen,revisor};
function init(){document.querySelectorAll('.sim[data-sim]').forEach(el=>{const[name,arg]=el.dataset.sim.split(':');try{R[name](el,arg)}catch(e){el.textContent='Error en el simulador: '+e.message;console.error(e)}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
