/* Figuras interactivas de Programación de Sistemas en Tiempo Real. Vanilla JS + canvas. */
(function(){
const C = {};
function paleta(el){const cs=getComputedStyle(el);const v=n=>cs.getPropertyValue(n).trim();
  C.bg=v('--surface')||'#fff';C.grid=v('--line')||'#d5dcd9';C.text=v('--fg')||'#16211d';C.muted=v('--muted')||'#56635e';
  C.a=v('--tc')||v('--accent')||'#b4232f';C.b=v('--warn')||'#b8730c';C.c=v('--c6')||'#2c8a52';C.d=v('--c5')||'#c43d63';C.e=v('--c4')||'#b8730c';C.f=v('--c2')||'#3a63c4';}
const F=n=>Number.isInteger(n)?String(n):(Math.abs(n)<1e-9?'0':n.toFixed(2).replace('.',','));

function build(el, spec){
  el.classList.add('sim-box');paleta(el);
  const ctrls=document.createElement('div'); ctrls.className='ctrl sim-ctrls';
  const cv=document.createElement('canvas'); cv.width=spec.w||640; cv.height=spec.h||360; cv.className='sim-cv';
  const out=document.createElement('div'); out.className='readout sim-out';
  el.append(ctrls,cv,out);
  const st={};
  (spec.sliders||[]).forEach(s=>{st[s.k]=s.v;const lab=document.createElement('label');const sp=document.createElement('span');sp.textContent=`${s.l}: ${F(s.v)} ${s.u||''}`;
    const inp=document.createElement('input');inp.type='range';inp.min=s.min;inp.max=s.max;inp.step=s.step||0.01;inp.value=s.v;
    inp.oninput=()=>{st[s.k]=parseFloat(inp.value);sp.textContent=`${s.l}: ${F(st[s.k])} ${s.u||''}`;draw();};lab.append(sp,inp);ctrls.append(lab);});
  (spec.selects||[]).forEach(s=>{st[s.k]=s.v;const lab=document.createElement('label');const sp=document.createElement('span');sp.textContent=s.l;
    const sel=document.createElement('select');s.opts.forEach(o=>{const op=document.createElement('option');op.value=o[0];op.textContent=o[1];if(o[0]===s.v)op.selected=true;sel.append(op);});
    sel.onchange=()=>{st[s.k]=sel.value;draw();};lab.append(sp,sel);ctrls.append(lab);});
  const g=cv.getContext('2d');
  const api={st,cv,g,out,W:cv.width,H:cv.height,
    clear(){paleta(el);g.fillStyle=C.bg;g.fillRect(0,0,cv.width,cv.height);},
    txt(s,x,y,col,sz,al){g.fillStyle=col||C.text;g.font=(sz||13)+'px system-ui';g.textAlign=al||'left';g.fillText(s,x,y);},
    arrow(x1,y1,x2,y2,col,wd){g.strokeStyle=g.fillStyle=col;g.lineWidth=wd||2.5;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();const a=Math.atan2(y2-y1,x2-x1),L=10;g.beginPath();g.moveTo(x2,y2);g.lineTo(x2-L*Math.cos(a-0.4),y2-L*Math.sin(a-0.4));g.lineTo(x2-L*Math.cos(a+0.4),y2-L*Math.sin(a+0.4));g.closePath();g.fill();},
    line(x1,y1,x2,y2,col,wd,dash){g.strokeStyle=col;g.lineWidth=wd||1.5;g.setLineDash(dash||[]);g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke();g.setLineDash([]);},
    circ(x,y,r,col,fill){g.beginPath();g.arc(x,y,r,0,Math.PI*2);if(fill){g.fillStyle=col;g.fill();}else{g.strokeStyle=col;g.lineWidth=2;g.stroke();}},
    html(h){out.innerHTML=h;},
    // sistema de ejes cartesiano
    axes(cx,cy,u,xmin,xmax,ymin,ymax){for(let i=Math.ceil(xmin);i<=xmax;i++)api.line(cx+i*u,cy-ymax*u,cx+i*u,cy-ymin*u,C.grid,1);for(let j=Math.ceil(ymin);j<=ymax;j++)api.line(cx+xmin*u,cy-j*u,cx+xmax*u,cy-j*u,C.grid,1);api.line(cx+xmin*u,cy,cx+xmax*u,cy,C.muted,1.5);api.line(cx,cy-ymax*u,cx,cy-ymin*u,C.muted,1.5);}
  };
  function draw(){spec.draw(api);}
  draw(); return api;
}
const SIMS={};

/* ---- helpers Programación de Sistemas en Tiempo Real ---- */
const NR=(x,d)=>{if(!isFinite(x))return '—';const s=x.toFixed(d===undefined?2:d);return (Math.abs(parseFloat(s))<1e-9?(0).toFixed(d===undefined?2:d):s).replace('.',',');};
const N0=x=>NR(x,0),N1=x=>NR(x,1),N2=x=>NR(x,2),N3=x=>NR(x,3),N4=x=>NR(x,4);
const sup=s=>String(s).replace(/-/g,'−');
const gcd=(a,b)=>b?gcd(b,a%b):a, lcm=(a,b)=>a*b/gcd(a,b);
function Rbox(a,x,y,w,h,col,r){const g=a.g;r=r||6;g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();g.fillStyle=col;g.fill();}
function Rline(a,x,y,w,h,col,r,lw){const g=a.g;r=r||6;g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();g.strokeStyle=col;g.lineWidth=lw||1.6;g.stroke();}
function alpha(a,v,fn){a.g.save();a.g.globalAlpha=v;fn();a.g.restore();}

/* 1 · Pila, montón y paso de parámetros */
SIMS.memoria=el=>build(el,{w:680,h:300,
 selects:[{k:'modo',l:'Paso de parámetros',v:'ref',opts:[['valor','Por valor:  f(int x)'],['ref','Por referencia:  f(int &x)'],['cref','Por referencia const:  f(const vector<int> &v)'],['punt','Puntero a memoria dinámica:  int *p = new int']]}],
 sliders:[{k:'paso',l:'Momento de la ejecución',v:2,min:0,max:3,step:1}],
 draw(a){a.clear();const s=a.st,p=s.paso;
  const info={
   valor:{tit:'void f(int x) { x = 99; }',lineas:['int n = 7;','f(n);','  // dentro: x = 99','// fuera: n sigue valiendo 7'],
     res:'La función recibe una <b>copia</b>. Modificarla no afecta al original.',ok:false,cop:true},
   ref:{tit:'void f(int &x) { x = 99; }',lineas:['int n = 7;','f(n);','  // dentro: x ES n','// fuera: n vale 99'],
     res:'La referencia es un <b>alias</b>: no hay copia y el cambio se ve fuera.',ok:true,cop:false},
   cref:{tit:'void f(const vector<int> &v)',lineas:['vector<int> v(1000);','f(v);','  // dentro: no se copia','  // y no se puede modificar'],
     res:'No copia los 1000 elementos y el compilador impide modificarlos. Es la forma correcta de pasar objetos grandes que sólo se leen.',ok:true,cop:false},
   punt:{tit:'int *p = new int(7);',lineas:['int *p = new int(7);','*p = 99;','delete p;','p = nullptr;'],
     res:'La variable p vive en la <b>pila</b> pero el entero vive en el <b>montón</b>. Cada new necesita exactamente un delete.',ok:true,cop:false}}[s.modo];
  /* pila */
  const px=40,py=58,pw=180,ph=176;
  Rline(a,px,py,pw,ph,C.grid,8,1.6);
  a.txt('PILA  (stack)',px+pw/2,py-10,C.c,12.5,'center');
  a.txt('variables locales',px+pw/2,py+ph+18,C.muted,11,'center');
  a.txt('se libera sola',px+pw/2,py+ph+34,C.muted,11,'center');
  /* montón */
  const mx=256,my=58,mw=160,mh=176;
  Rline(a,mx,my,mw,mh,C.grid,8,1.6);
  a.txt('MONTÓN  (heap)',mx+mw/2,my-10,C.b,12.5,'center');
  a.txt('new / delete',mx+mw/2,my+mh+18,C.muted,11,'center');
  a.txt('lo liberas tú',mx+mw/2,my+mh+34,C.muted,11,'center');
  /* contenido según modo y paso */
  const bloque=(x,y,w,nom,val,col)=>{alpha(a,0.18,()=>Rbox(a,x,y,w,34,col,6));Rline(a,x,y,w,34,col,6,1.4);
    a.txt(nom,x+9,y+15,C.text,12);a.txt(val,x+w-9,y+15,col,13,'right');
    a.txt('',x,y+28,C.muted,10);};
  if(s.modo==='punt'){
    bloque(px+14,py+112,pw-28,'p  (puntero)',p>=1?'0x7f3a':'—',C.c);
    if(p>=1){bloque(mx+14,my+60,mw-28,'*p',p>=2?'99':'7',C.b);
      a.arrow(px+pw-14,py+129,mx+14,my+77,C.a,2);
      if(p>=3){alpha(a,0.5,()=>{a.line(mx+14,my+60,mx+mw-14,my+94,C.d,2.5);a.line(mx+mw-14,my+60,mx+14,my+94,C.d,2.5);});
        a.txt('liberado',mx+mw/2,my+112,C.d,11.5,'center');}}
  }else if(s.modo==='valor'){
    bloque(px+14,py+40,pw-28,'n  (main)',p>=1?'7':'—',C.c);
    if(p>=1&&p<=2){bloque(px+14,py+104,pw-28,'x  (copia)',p>=2?'99':'7',C.d);
      a.txt('copia ↓',px+pw/2,py+92,C.d,11,'center');}
    if(p>=3){a.txt('x ya no existe',px+pw/2,py+120,C.muted,11.5,'center');
      a.txt('n sigue valiendo 7',px+pw/2,py+142,C.d,13,'center');}
  }else if(s.modo==='ref'){
    bloque(px+14,py+40,pw-28,'n  (main)',p>=2?'99':'7',C.c);
    if(p>=1&&p<=2){Rline(a,px+14,py+104,pw-28,34,C.a,6,1.4);
      a.txt('x  →  es n',px+23,py+119,C.a,12);
      a.arrow(px+pw/2,py+104,px+pw/2,py+78,C.a,2);
      a.txt('mismo objeto',px+pw/2,py+160,C.muted,11,'center');}
    if(p>=3)a.txt('n vale 99',px+pw/2,py+120,C.a,14,'center');
  }else{
    bloque(px+14,py+40,pw-28,'v  (1000 elem.)','…',C.c);
    if(p>=1){Rline(a,px+14,py+104,pw-28,34,C.a,6,1.4);
      a.txt('const v&  →  es v',px+23,py+119,C.a,11.5);
      a.arrow(px+pw/2,py+104,px+pw/2,py+78,C.a,2);}
    if(p>=2)a.txt('0 copias',px+pw/2,py+164,C.c,13,'center');
    if(p>=3)a.txt('no se puede modificar',px+pw/2,py+186,C.d,11.5,'center');
  }
  /* código */
  const bx=440,by=50;
  a.txt(info.tit,bx,by-16,C.a,12.5);
  info.lineas.forEach((l,i)=>a.txt(l,bx,by+10+i*22,i<=p?C.text:C.grid,12));
  a.html('<b>'+(s.modo==='valor'?'Por valor':s.modo==='ref'?'Por referencia':s.modo==='cref'?'Por referencia constante':'Memoria dinámica')+'.</b> '+info.res+(info.cop?'<br>Con un vector o un string grande, esa copia se hace <b>en cada llamada</b>: es el error de rendimiento más común en los exámenes.':''));
 }});

/* 2 · Contenedores de la STL */
SIMS.contenedores=el=>build(el,{w:680,h:290,
 selects:[{k:'op',l:'Operación',v:'buscar',opts:[['acceso','Acceder al elemento i'],['buscar','Buscar por clave o valor'],['final','Insertar al final'],['medio','Insertar o borrar en medio'],['recorrer','Recorrer todo']]}],
 sliders:[{k:'n',l:'Número de elementos',v:1000,min:10,max:100000,step:10}],
 draw(a){a.clear();const s=a.st,n=s.n;
  const L=Math.log2(Math.max(2,n));
  const cost={
   acceso:{vector:[1,'O(1)'],list:[n,'O(n)'],map:[null,'—'],umap:[null,'—']},
   buscar:{vector:[n,'O(n)'],list:[n,'O(n)'],map:[L,'O(log n)'],umap:[1,'O(1) medio']},
   final:{vector:[1,'O(1) amort.'],list:[1,'O(1)'],map:[L,'O(log n)'],umap:[1,'O(1) medio']},
   medio:{vector:[n,'O(n)'],list:[1,'O(1)*'],map:[L,'O(log n)'],umap:[1,'O(1) medio']},
   recorrer:{vector:[n,'O(n)'],list:[n,'O(n)'],map:[n,'O(n)'],umap:[n,'O(n)']}}[s.op];
  const nom={vector:'vector',list:'list',map:'map',umap:'unordered_map'};
  const cl={vector:C.a,list:C.b,map:C.c,umap:C.f};
  const ks=['vector','list','map','umap'];
  const mx=Math.max(...ks.map(k=>cost[k][0]||0),1);
  const ox=150,oy=64,bw=330;
  ks.forEach((k,i)=>{const y=oy+i*44,v=cost[k][0];
    a.txt(nom[k],ox-12,y+16,C.text,13,'right');
    alpha(a,0.12,()=>Rbox(a,ox,y,bw,24,C.text,5));
    if(v===null){a.txt('no aplica',ox+10,y+17,C.muted,12);}
    else{const w=Math.max(6,bw*(Math.log10(v+1)/Math.log10(mx+1)));
      Rbox(a,ox,y,w,24,cl[k],5);
      const dentro=w>bw*0.62;
      a.txt(cost[k][1],dentro?ox+w-10:ox+w+10,y+17,dentro?C.bg:cl[k],12.5,dentro?'right':'left');
      a.txt(v<2?'~1 paso':(v<1000?N0(v)+' pasos':N0(v/1000)+' mil pasos'),ox+bw+14,y+17,C.muted,11);}});
  a.txt('coste relativo con n = '+N0(n)+' elementos  (escala logarítmica)',ox,oy+4*44+16,C.muted,11);
  const txt={acceso:'<b>Acceder por índice.</b> El vector es el único que lo hace en tiempo constante, porque sus elementos están contiguos en memoria. En una lista hay que recorrerla eslabón a eslabón, y un map no tiene posiciones: tiene claves.',
   buscar:'<b>Buscar.</b> Aquí es donde se gana o se pierde. En un vector sin ordenar hay que mirarlo todo; el <b>map</b> baja a log n gracias a su árbol equilibrado y el <b>unordered_map</b> a tiempo constante medio con una tabla hash. Si tu programa busca mucho por clave, no uses un vector.',
   final:'<b>Insertar al final.</b> El vector es constante <i>amortizado</i>: casi siempre no cuesta nada, pero de vez en cuando reserva el doble de memoria y copia todo. Ese momento es el que <b>invalida los iteradores</b>.',
   medio:'<b>Insertar o borrar en medio.</b> El vector tiene que desplazar todos los elementos posteriores. La list sólo recoloca dos punteros, pero (*) sólo si ya tienes el iterador: llegar hasta él cuesta O(n).',
   recorrer:'<b>Recorrer.</b> Todos son O(n), pero no tardan lo mismo: el vector es muchísimo más rápido en la práctica porque sus datos están <b>contiguos</b> y la caché los trae de golpe. Es la diferencia entre la teoría y el reloj.'}[s.op];
  a.html(txt);
 }});

/* 3 · Ciclo de vida de un objeto */
SIMS.objeto=el=>build(el,{w:680,h:306,
 sliders:[{k:'paso',l:'Paso de la ejecución',v:3,min:0,max:7,step:1}],
 draw(a){a.clear();const s=a.st,p=s.paso;
  const lineas=[
   ['int main() {',null,null],
   ['    Punto a(1, 2);','Punto(double,double)','a'],
   ['    {','',''],
   ['        Punto b = a;','Punto(const Punto&)','b'],
   ['        cout << b;','operator<<','' ],
   ['    }','~Punto()  de b','-b'],
   ['    a.set_x(9);','set_x','' ],
   ['}','~Punto()  de a','-a']];
  const ox=40,oy=56;
  lineas.forEach((l,i)=>{
    const act=i===p, hecho=i<p;
    if(act){alpha(a,0.14,()=>Rbox(a,ox-8,oy+i*26-15,330,24,C.a,4));}
    a.txt(l[0],ox,oy+i*26,act?C.a:(hecho?C.text:C.grid),13);
    if(l[1]&&(hecho||act))a.txt('→ '+l[1],ox+200,oy+i*26,act?C.b:C.muted,11.5);});
  /* objetos vivos */
  const vivos=[];
  for(let i=0;i<=p;i++){const t=lineas[i][2];
    if(t&&t[0]!=='-')vivos.push(t); else if(t&&t[0]==='-'){const k=vivos.indexOf(t.slice(1));if(k>=0)vivos.splice(k,1);}}
  const bx=420,by=56;
  a.txt('Objetos vivos',bx,by-14,C.c,13);
  Rline(a,bx-10,by-2,230,120,C.grid,8,1.5);
  if(!vivos.length)a.txt('(ninguno)',bx+6,by+28,C.muted,12);
  vivos.forEach((v,i)=>{const y=by+10+i*40;
    alpha(a,0.14,()=>Rbox(a,bx,y,208,32,C.c,5));Rline(a,bx,y,208,32,C.c,5,1.4);
    a.txt('Punto '+v,bx+10,y+21,C.text,13);
    a.txt(v==='a'?(p>=6?'(9 , 2)':'(1 , 2)'):'(1 , 2)',bx+198,y+21,C.c,13,'right');});
  a.txt('Orden de destrucción',bx-10,by+146,C.muted,12);
  a.txt('inverso al de creación',bx-10,by+166,C.text,12.5);
  a.txt('b se destruye al salir de su bloque;',bx-10,by+192,C.muted,11.5);
  a.txt('a, al terminar main',bx-10,by+210,C.muted,11.5);
  const notas=['El programa va a empezar. Todavía no existe ningún objeto.',
   'Se llama al <b>constructor con parámetros</b>. El objeto <b>a</b> queda en un estado válido desde el primer instante: ese es el trabajo del constructor.',
   'Se abre un bloque interior. Todo lo que se cree aquí morirá al cerrarlo.',
   'Se llama al <b>constructor de copia</b>, no al operador de asignación: <code>Punto b = a;</code> es una <b>construcción</b>, aunque lleve un signo igual.',
   'Se usa el <code>operator&lt;&lt;</code>, que es una función libre <code>friend</code>, porque su operando izquierdo es el flujo.',
   'Al cerrar la llave se llama al <b>destructor</b> de <b>b</b>. Nadie ha tenido que acordarse: eso es RAII, y es lo que hace seguros a <code>lock_guard</code> y a los ficheros.',
   'Un método normal modifica el estado de <b>a</b>. Si <code>set_x</code> fuese <code>const</code>, esto no compilaría.',
   'Al terminar <code>main</code> se destruye <b>a</b>. Los objetos de la pila se destruyen en orden <b>inverso</b> al de creación.'];
  a.html(notas[p]);
 }});

/* 4 · Polimorfismo y vtable */
SIMS.polimorfismo=el=>build(el,{w:680,h:306,
 selects:[{k:'virt',l:'Método de la base',v:'si',opts:[['si','virtual double area() const'],['no','double area() const   (sin virtual)']],},
  {k:'obj',l:'Objeto real apuntado',v:'circ',opts:[['circ','new Circulo(1.0)'],['rect','new Rectangulo(2.0, 3.0)']]}],
 draw(a){a.clear();const s=a.st,vir=s.virt==='si';
  const real=s.obj==='circ'?'Circulo':'Rectangulo';
  const valor=s.obj==='circ'?3.1416:6.0;
  a.txt('Figura *f = new '+(s.obj==='circ'?'Circulo(1.0)':'Rectangulo(2.0, 3.0)')+';',40,44,C.text,13.5);
  a.txt('cout << f->area();',40,70,C.text,13.5);
  /* puntero */
  const px=52,py=108;
  Rline(a,px,py,150,40,C.a,6,1.6);
  a.txt('f : Figura*',px+12,py+25,C.a,13);
  /* objeto real */
  const ox=270,oy=96;
  alpha(a,0.12,()=>Rbox(a,ox,oy,180,64,C.c,6));Rline(a,ox,oy,180,64,C.c,6,1.6);
  a.txt(real,ox+12,oy+24,C.c,14);
  a.txt(s.obj==='circ'?'r_ = 1,0':'a_ = 2,0   b_ = 3,0',ox+12,oy+46,C.muted,12);
  a.arrow(px+150,py+20,ox,oy+32,C.a,2.2);
  if(vir){
    /* vtable */
    const tx=270,ty=186;
    alpha(a,0.1,()=>Rbox(a,tx,ty,180,56,C.f,6));Rline(a,tx,ty,180,56,C.f,6,1.4);
    a.txt('vtable de '+real,tx+12,ty+20,C.f,12);
    a.txt('area() → '+real+'::area',tx+12,ty+42,C.text,11.5);
    a.line(ox+90,oy+64,tx+90,ty,C.f,1.5,[4,3]);
    a.txt('cada objeto polimórfico guarda',tx-4,ty+78,C.muted,11);
    a.txt('un puntero a la tabla de su clase',tx-4,ty+96,C.muted,11);
  }
  /* resultado */
  const bx=486,by=116;
  a.txt('Se ejecuta',bx,by-18,C.muted,12);
  a.txt((vir?real:'Figura')+'::area()',bx,by+4,vir?C.c:C.d,14);
  a.txt('Resultado',bx,by+40,C.muted,12);
  a.txt(vir?N4(valor):'0,0000',bx,by+64,vir?C.c:C.d,20);
  a.txt(vir?'ligadura DINÁMICA':'ligadura ESTÁTICA',bx,by+96,vir?C.c:C.d,12.5);
  a.txt(vir?'se decide en ejecución':'se decide al compilar',bx,by+116,C.muted,11.5);
  a.txt(vir?'según el tipo REAL':'según el tipo DECLARADO',bx,by+134,C.muted,11.5);
  a.html(vir
   ? 'Con <code>virtual</code>, la llamada pasa por la <b>tabla de funciones virtuales</b> del objeto real, así que un <code>Figura*</code> que apunta a un <code>'+real+'</code> ejecuta <code>'+real+'::area()</code>. Eso es el polimorfismo: el <code>main</code> no necesita saber qué clases existen.'
   : 'Sin <code>virtual</code>, el compilador resuelve la llamada mirando el tipo <b>declarado</b> del puntero, que es <code>Figura*</code>, y ejecuta <code>Figura::area()</code> aunque el objeto sea un <code>'+real+'</code>. El programa <b>compila y se ejecuta</b>, pero da un resultado equivocado sin ningún aviso: por eso este error es tan difícil de encontrar.');
 }});

/* 5 · Condición de carrera */
SIMS.hilos=el=>build(el,{w:680,h:300,
 selects:[{k:'prot',l:'Protección',v:'nada',opts:[['nada','Ninguna:  ++contador'],['mutex','lock_guard<mutex> en cada incremento'],['atomic','atomic<int> contador'],['local','Acumulador local + una suma al final']]}],
 sliders:[{k:'nh',l:'Número de hilos',v:4,min:2,max:8,step:1},{k:'inc',l:'Incrementos por hilo (miles)',v:100,min:10,max:500,step:10}],
 draw(a){a.clear();const s=a.st,total=s.nh*s.inc*1000;
  /* traza intercalada */
  const pasos=[['A','lee','10'],['B','lee','10'],['A','suma','11'],['B','suma','11'],['A','escribe','11'],['B','escribe','11']];
  const ox=40,oy=70;
  a.txt('Qué hace realmente  ++contador',ox,oy-22,C.a,13);
  a.txt('Hilo A',ox+10,oy,C.c,12);a.txt('Hilo B',ox+104,oy,C.f,12);a.txt('contador',ox+222,oy,C.muted,12);
  if(s.prot==='nada'){
    pasos.forEach((p,i)=>{const y=oy+22+i*26;
      const x=p[0]==='A'?ox+10:ox+104;
      alpha(a,0.13,()=>Rbox(a,x-6,y-15,86,22,p[0]==='A'?C.c:C.f,4));
      a.txt(p[1],x,y,p[0]==='A'?C.c:C.f,12);
      a.txt(i<4?'10':(i===4?'11':'11'),ox+232,y,i===5?C.d:C.text,12.5);});
    a.txt('dos incrementos, el contador sólo sube 1',ox,oy+22+6*26+6,C.d,12);
  }else{
    const lab={mutex:['A: lock','A: lee 10','A: suma 11','A: escribe 11','A: unlock','B: lock → ... → 12'],
      atomic:['A: fetch_add','  → 11  (indivisible)','B: fetch_add','  → 12  (indivisible)','','la CPU garantiza que nadie','se intercala dentro'],
      local:['A: local_A++  ×'+N0(s.inc)+'000','B: local_B++  ×'+N0(s.inc)+'000','…','lock + contador += local_A','lock + contador += local_B','sólo '+s.nh+' bloqueos en todo','el programa']}[s.prot];
    lab.forEach((l,i)=>a.txt(l,ox+10,oy+24+i*24,i<2?C.c:(i<4?C.f:C.muted),12.5));
  }
  /* resultado */
  const bx=400,by=74;
  a.txt('Valor esperado',bx,by-20,C.muted,12);
  a.txt(N0(total),bx,by+4,C.text,20);
  a.txt('Valor que sale',bx,by+44,C.muted,12);
  const malo=Math.round(total*(0.42+0.18*((s.nh*7)%5)/5));
  a.txt(s.prot==='nada'?'≈ '+N0(malo):N0(total),bx,by+70,s.prot==='nada'?C.d:C.c,20);
  if(s.prot==='nada')a.txt('y distinto en cada ejecución',bx,by+92,C.d,11.5);
  else a.txt('siempre correcto',bx,by+92,C.c,11.5);
  a.txt('Coste relativo',bx,by+128,C.muted,12);
  const coste={nada:[8,'rapidísimo, pero mal'],mutex:[100,'muy lento: 2 operaciones'],atomic:[22,'bastante rápido'],local:[9,'casi como un solo hilo']}[s.prot];
  alpha(a,0.14,()=>Rbox(a,bx,by+140,230,16,C.text,4));
  Rbox(a,bx,by+140,230*coste[0]/100,16,s.prot==='nada'?C.d:(s.prot==='mutex'?C.b:C.c),4);
  a.txt(coste[1],bx,by+176,C.text,12);
  a.html({nada:'<b>Condición de carrera.</b> <code>++contador</code> son tres operaciones (leer, sumar, escribir) y otro hilo puede colarse entre ellas. Cada vez que ocurre se pierde una cuenta, y por eso el resultado es menor y <b>distinto en cada ejecución</b>.',
   mutex:'<b>Con mutex el resultado es exacto</b>, pero el programa resulta <b>más lento que con un solo hilo</b>: bloquear y desbloquear en cada incremento cuesta más que el propio incremento, y además los hilos se esperan unos a otros.',
   atomic:'<b>atomic</b> hace indivisible la operación sin bloquear: lo resuelve la CPU con una instrucción especial. Es correcto y mucho más rápido que el mutex, pero sólo sirve para operaciones sobre <b>una sola variable</b>.',
   local:'<b>La solución buena.</b> Cada hilo acumula en una variable <b>suya</b>, sin compartir nada, y al final suma una sola vez al total. Pasamos de '+N0(total)+' bloqueos a '+s.nh+'. La lección: lo caro no es el paralelismo, es <b>compartir</b>.'}[s.prot]);
 }});

/* 6 · Productor-consumidor */
SIMS.productor=el=>build(el,{w:680,h:272,
 sliders:[{k:'cap',l:'Capacidad del buffer',v:8,min:2,max:14,step:1},
  {k:'vp',l:'Velocidad del productor',v:6,min:1,max:10,step:1},
  {k:'vc',l:'Velocidad del consumidor',v:4,min:1,max:10,step:1},
  {k:'t',l:'Instante de la simulación',v:46,min:0,max:90,step:1}],
 draw(a){a.clear();const s=a.st;
  /* simulación determinista de ocupación */
  let ocup=0,blqP=0,blqC=0,prod=0,cons=0;
  for(let k=1;k<=s.t;k++){
    if(k*s.vp%10<s.vp){ if(ocup<s.cap){ocup++;prod++;} else blqP++; }
    if(k*s.vc%10<s.vc){ if(ocup>0){ocup--;cons++;} else blqC++; }
  }
  /* buffer */
  const ox=56,oy=148,cw=Math.min(30,340/s.cap),ch=36;
  a.txt('Buffer circular  (capacidad '+s.cap+')',ox,oy-16,C.a,12.5);
  for(let i=0;i<s.cap;i++){const x=ox+i*(cw+4);
    if(i<ocup){alpha(a,0.75,()=>Rbox(a,x,oy,cw,ch,C.c,4));}
    Rline(a,x,oy,cw,ch,C.grid,4,1.3);}
  a.txt('ocupación: '+ocup+' / '+s.cap,ox,oy+ch+24,C.text,13);
  /* productor y consumidor */
  const py=oy-118;
  const estP=ocup>=s.cap, estC=ocup<=0;
  alpha(a,0.12,()=>Rbox(a,ox,py,150,38,estP?C.d:C.b,6));
  Rline(a,ox,py,150,38,estP?C.d:C.b,6,1.5);
  a.txt('productor',ox+12,py+24,estP?C.d:C.b,13);
  a.txt(estP?'BLOQUEADO (lleno)':'produciendo',ox+12,py+58,estP?C.d:C.muted,11.5);
  a.arrow(ox+75,py+42,ox+75,oy-6,estP?C.grid:C.b,2);
  const cx2=ox+344;
  alpha(a,0.12,()=>Rbox(a,cx2-150,py,150,38,estC?C.d:C.f,6));
  Rline(a,cx2-150,py,150,38,estC?C.d:C.f,6,1.5);
  a.txt('consumidor',cx2-138,py+24,estC?C.d:C.f,13);
  a.txt(estC?'BLOQUEADO (vacío)':'consumiendo',cx2-138,py+58,estC?C.d:C.muted,11.5);
  a.arrow(cx2-6,oy-6,cx2-6,py+42,estC?C.grid:C.f,2);
  /* panel */
  const bx=452,by=50;
  a.txt('t = '+s.t,bx+70,by-26,C.muted,12);
  const fil=[['producidos',prod,C.b],['consumidos',cons,C.f],['en el buffer',ocup,C.c],
   ['esperas del productor',blqP,blqP?C.d:C.muted],['esperas del consumidor',blqC,blqC?C.d:C.muted]];
  fil.forEach((f,i)=>{a.txt(f[0],bx,by+i*26,C.muted,11.5);a.txt(String(f[1]),bx+186,by+i*26,f[2],13,'right');});
  a.txt('cv.wait(lk, []{ ... });',bx,by+156,C.a,12);
  a.txt('productor espera a  size() < MAX',bx,by+178,C.muted,11);
  a.txt('consumidor espera a  !empty()',bx,by+196,C.muted,11);
  a.html(estP?'El buffer está <b>lleno</b>: el productor duerme en <code>cv.wait</code> y <b>no consume CPU</b>. Despertará cuando el consumidor saque un elemento y notifique.'
   :estC?'El buffer está <b>vacío</b>: el consumidor duerme esperando a que haya algo. Es exactamente lo que no se consigue con un simple mutex: el mutex da exclusión, la <b>variable de condición</b> da espera.'
   :'El buffer actúa de <b>amortiguador</b> entre dos hilos que van a velocidades distintas. Sube la velocidad del productor por encima de la del consumidor y verás cómo se llena y el productor empieza a bloquearse: el sistema acaba yendo al ritmo del <b>más lento</b>.');
 }});

/* 7 · Planificación clásica */
SIMS.planificador=el=>build(el,{w:680,h:312,
 selects:[{k:'alg',l:'Algoritmo',v:'rr',opts:[['fcfs','FCFS (orden de llegada)'],['sjf','SJF no expulsivo'],['rr','Round-Robin']]}],
 sliders:[{k:'q',l:'Quantum (sólo Round-Robin)',v:4,min:1,max:8,step:1}],
 draw(a){a.clear();const s=a.st;
  const P=[{n:'P1',l:0,c:8},{n:'P2',l:1,c:4},{n:'P3',l:2,c:9},{n:'P4',l:3,c:5}];
  const cl=[C.a,C.c,C.b,C.f];
  const rest=P.map(p=>p.c), fin=P.map(()=>0), ini=P.map(()=>-1);
  const tramos=[];let t=0;
  if(s.alg==='fcfs'){P.forEach((p,i)=>{t=Math.max(t,p.l);ini[i]=t;tramos.push([i,t,p.c]);t+=p.c;fin[i]=t;});}
  else if(s.alg==='sjf'){const hecho=P.map(()=>false);
    for(let k=0;k<P.length;k++){let mejor=-1;
      for(let i=0;i<P.length;i++)if(!hecho[i]&&P[i].l<=t&&(mejor<0||P[i].c<P[mejor].c))mejor=i;
      if(mejor<0){t++;k--;continue;}
      ini[mejor]=t;tramos.push([mejor,t,P[mejor].c]);t+=P[mejor].c;fin[mejor]=t;hecho[mejor]=true;}}
  else{const cola=[];let i=0;const ord=[...P.keys()].sort((x,y)=>P[x].l-P[y].l);let idx=0;
    while(idx<ord.length&&P[ord[idx]].l<=t)cola.push(ord[idx++]);
    while(cola.length){const k=cola.shift();
      const e=Math.min(s.q,rest[k]);
      if(ini[k]<0)ini[k]=t;
      tramos.push([k,t,e]);t+=e;rest[k]-=e;
      while(idx<ord.length&&P[ord[idx]].l<=t)cola.push(ord[idx++]);
      if(rest[k]>0)cola.push(k); else fin[k]=t;
      if(!cola.length&&idx<ord.length){t=P[ord[idx]].l;while(idx<ord.length&&P[ord[idx]].l<=t)cola.push(ord[idx++]);}}}
  const T=t, ox=46,oy=102,W=560;
  const X=u=>ox+u/T*W;
  a.txt('Cronograma',ox,oy-44,C.a,13);
  tramos.forEach(([k,ini2,dur])=>{const x=X(ini2),w=X(ini2+dur)-x;
    alpha(a,0.75,()=>Rbox(a,x,oy,Math.max(2,w-1.5),34,cl[k],3));
    if(w>26)a.txt(P[k].n,x+w/2-1,oy+22,C.bg,12,'center');});
  a.line(ox,oy+34,ox+W,oy+34,C.muted,1.5);
  for(let u=0;u<=T;u+=Math.max(2,Math.round(T/13))){a.line(X(u),oy+34,X(u),oy+40,C.muted,1);
    a.txt(String(u),X(u),oy+54,C.muted,10,'center');}
  P.forEach((p,i)=>{a.line(X(p.l),oy-10,X(p.l),oy,cl[i],1.5,[3,2]);
    a.txt('↓'+p.n,X(p.l),oy-14,cl[i],10,'center');});
  /* tabla */
  const bx=46,by=184;
  ['Proc','Lleg','CPU','Fin','Retorno','Espera'].forEach((h,j)=>a.txt(h,bx+[0,52,100,148,206,282][j],by,C.muted,11.5));
  let sr=0,se=0;
  P.forEach((p,i)=>{const ret=fin[i]-p.l,esp=ret-p.c;sr+=ret;se+=esp;
    const y=by+22+i*22;
    a.txt(p.n,bx,y,cl[i],12.5);
    [p.l,p.c,fin[i],ret,esp].forEach((v,j)=>a.txt(String(v),bx+[52,100,148,206,282][j]+18,y,C.text,12,'right'));});
  a.txt('media',bx,by+22+4*22+4,C.muted,12);
  a.txt(N2(sr/4),bx+224,by+22+4*22+4,C.a,13,'right');
  a.txt(N2(se/4),bx+300,by+22+4*22+4,C.a,13,'right');
  /* panel lateral */
  const px=460,py=190;
  a.txt('Tiempo medio',px,py,C.muted,12);
  a.txt('retorno:  '+N2(sr/4),px,py+24,C.a,14);
  a.txt('espera:   '+N2(se/4),px,py+48,C.a,14);
  a.txt('cambios de contexto: '+(tramos.length-1),px,py+78,C.muted,11.5);
  a.html({fcfs:'<b>FCFS</b> atiende por orden de llegada. Es justo y simplísimo, pero un proceso largo al principio retrasa a todos los que vienen detrás: es el <b>efecto convoy</b>.',
   sjf:'<b>SJF</b> da el <b>tiempo medio de espera mínimo</b>, y se puede demostrar que ningún otro algoritmo lo mejora. Sus dos problemas: hay que conocer la duración de antemano (en la práctica se estima) y los procesos largos pueden quedarse sin CPU indefinidamente si siguen llegando cortos.',
   rr:'<b>Round-Robin</b> con quantum '+s.q+'. La espera media es peor, pero <b>todos</b> los procesos empiezan a ejecutarse enseguida: su ventaja es el <b>tiempo de respuesta</b>, que es lo que nota el usuario de un sistema interactivo. Baja el quantum y mira cómo se disparan los cambios de contexto; súbelo mucho y acabará comportándose como FCFS.'}[s.alg]);
 }});

/* 8 · Planificación en tiempo real: RM / DM / EDF */
SIMS.tiemporeal=el=>build(el,{w:680,h:312,
 selects:[{k:'alg',l:'Algoritmo',v:'rm',opts:[['rm','Rate Monotonic (prioridad por periodo)'],['edf','EDF (prioridad por plazo absoluto)']]}],
 sliders:[{k:'T1',l:'T₁',v:4,min:2,max:12,step:1,u:'ms'},{k:'C1',l:'C₁',v:1,min:1,max:6,step:0.5,u:'ms'},
  {k:'T2',l:'T₂',v:6,min:3,max:16,step:1,u:'ms'},{k:'C2',l:'C₂',v:2,min:1,max:8,step:0.5,u:'ms'},
  {k:'T3',l:'T₃',v:12,min:4,max:24,step:1,u:'ms'},{k:'C3',l:'C₃',v:3,min:1,max:10,step:0.5,u:'ms'}],
 draw(a){a.clear();const s=a.st;
  const Tv=[s.T1,s.T2,s.T3],Cv=[s.C1,s.C2,s.C3],nom=['τ₁','τ₂','τ₃'],cl=[C.a,C.c,C.f];
  const U=Tv.reduce((t,T,i)=>t+Cv[i]/T,0);
  const H=Math.min(lcm(lcm(Tv[0],Tv[1]),Tv[2]),48);
  /* simulación por pasos de 0,5 ms */
  const dt=0.5,N=Math.round(H/dt);
  const rest=[0,0,0],dl=[Tv[0],Tv[1],Tv[2]];
  const traza=[];let fallo=-1;
  for(let k=0;k<N;k++){const t=k*dt;
    for(let i=0;i<3;i++){if(Math.abs(t%Tv[i])<1e-9){if(rest[i]>1e-9&&fallo<0)fallo=t;rest[i]=Cv[i];dl[i]=t+Tv[i];}}
    let sel=-1;
    for(let i=0;i<3;i++){if(rest[i]<=1e-9)continue;
      if(sel<0)sel=i;
      else if(s.alg==='rm'? Tv[i]<Tv[sel] : dl[i]<dl[sel]) sel=i;}
    traza.push(sel);
    if(sel>=0)rest[sel]-=dt;}
  for(let i=0;i<3;i++)if(rest[i]>1e-9&&fallo<0)fallo=H;
  /* cronograma */
  const ox=52,oy=76,W=500,hh=30;
  const X=u=>ox+u/H*W;
  for(let i=0;i<3;i++){const y=oy+i*(hh+14);
    a.txt(nom[i],ox-10,y+20,cl[i],13,'right');
    alpha(a,0.08,()=>Rbox(a,ox,y,W,hh,C.text,3));
    for(let k=0;k<N;k++)if(traza[k]===i){const x=X(k*dt);
      alpha(a,0.85,()=>Rbox(a,x,y,Math.max(1.5,X(dt)-ox-0.6),hh,cl[i],1));}
    for(let t=0;t<=H;t+=Tv[i]){a.line(X(t),y-7,X(t),y,cl[i],1.5);
      a.g.beginPath();a.g.moveTo(X(t),y-7);a.g.lineTo(X(t)-3.5,y-2);a.g.lineTo(X(t)+3.5,y-2);a.g.closePath();a.g.fillStyle=cl[i];a.g.fill();}}
  const yb=oy+3*(hh+14);
  a.line(ox,yb,ox+W,yb,C.muted,1.4);
  for(let t=0;t<=H;t+=Math.max(2,Math.round(H/12))){a.line(X(t),yb,X(t),yb+5,C.muted,1);
    a.txt(String(t),X(t),yb+19,C.muted,10,'center');}
  a.txt('ms',ox+W+14,yb+19,C.muted,10);
  a.txt('las flechas marcan las activaciones',ox,yb+38,C.muted,11);
  /* panel */
  const bx=584,by=66;
  a.txt('U = ΣCᵢ/Tᵢ',bx,by-12,C.muted,11.5);
  a.txt(N4(U),bx,by+12,U<=1?C.text:C.d,17);
  const cota=3*(Math.pow(2,1/3)-1);
  if(s.alg==='rm'){a.txt('cota RM (n=3)',bx,by+44,C.muted,11.5);
    a.txt(N4(cota),bx,by+66,C.muted,13);
    a.txt(U<=cota?'cumple la cota':(U<=1?'no cumple la cota':'U > 1'),bx,by+92,U<=cota?C.c:(U<=1?C.b:C.d),11.5);
    if(U>cota&&U<=1){a.txt('pero puede ser',bx,by+110,C.muted,11);a.txt('planificable igual',bx,by+126,C.muted,11);}}
  else{a.txt('EDF: basta U ≤ 1',bx,by+44,C.muted,11.5);
    a.txt(U<=1?'planificable':'imposible',bx,by+68,U<=1?C.c:C.d,13);}
  a.txt('Simulación',bx,by+152,C.muted,11.5);
  a.txt(fallo<0?'sin fallos':'fallo en t='+N1(fallo),fallo<0?bx:bx,by+174,fallo<0?C.c:C.d,13);
  const ocio=traza.filter(x=>x<0).length/N;
  a.txt('CPU ociosa: '+N0(ocio*100)+' %',bx,by+200,C.muted,11.5);
  a.html(fallo>=0
   ? 'En t = '+N1(fallo)+' ms una tarea se activa <b>sin haber terminado</b> la activación anterior: ha perdido su plazo. Con U = '+N3(U)+(U>1?' el sistema es imposible para cualquier algoritmo.':' el problema no es la carga, sino el reparto de prioridades.')
   : (s.alg==='rm'
     ? '<b>Rate Monotonic:</b> prioridad fija, mayor cuanto menor es el periodo. Si U ≤ '+N3(cota)+' el sistema está garantizado. Pero la cota es sólo <b>suficiente</b>: sube la utilización por encima y verás que muchos conjuntos siguen cumpliendo, sobre todo si los periodos son múltiplos unos de otros.'
     : '<b>EDF:</b> en cada instante ejecuta la tarea cuyo <b>plazo absoluto</b> esté más cerca, así que las prioridades cambian continuamente. Es óptimo: si U ≤ 1 cumple, y ningún algoritmo puede hacerlo mejor. A cambio, en sobrecarga falla de forma impredecible, mientras que con prioridades fijas sabes que la primera en caer es la menos prioritaria.'));
 }});

/* 9 · Tiempos de respuesta con bloqueo */
SIMS.respuesta=el=>build(el,{w:680,h:326,
 sliders:[{k:'CA',l:'C de τA',v:10,min:2,max:16,step:1,u:'ms'},{k:'TA',l:'T = D de τA',v:20,min:12,max:40,step:1,u:'ms'},
  {k:'CB',l:'C de τB',v:8,min:2,max:16,step:1,u:'ms'},{k:'DB',l:'D de τB',v:25,min:10,max:60,step:1,u:'ms'},
  {k:'CC',l:'C de τC',v:12,min:2,max:30,step:1,u:'ms'},{k:'BA',l:'Bloqueo de τA',v:3,min:0,max:8,step:1,u:'ms'}],
 draw(a){a.clear();const s=a.st;
  const Tar=[{n:'τA',C:s.CA,T:s.TA,D:s.TA,B:s.BA},{n:'τB',C:s.CB,T:500,D:s.DB,B:3},{n:'τC',C:s.CC,T:120,D:120,B:0}];
  const cl=[C.a,C.c,C.f];
  const res=Tar.map((t,i)=>{
    let R=t.C+t.B;const it=[R];
    for(let k=0;k<40;k++){
      let nR=t.C+t.B;
      for(let j=0;j<i;j++) nR+=Math.ceil(R/Tar[j].T)*Tar[j].C;
      if(Math.abs(nR-R)<1e-9)break;
      R=nR;it.push(R);
      if(R>t.D) break;}
    return {R:R,it:it,ok:R<=t.D};});
  /* tabla de iteraciones */
  const ox=44,oy=64;
  a.txt('Rᵢ = Cᵢ + Bᵢ + Σ ⌈Rᵢ/Tⱼ⌉·Cⱼ        (j = tareas más prioritarias)',ox,oy-22,C.a,12.5);
  ['Tarea','C','B','iteraciones','R','D',''].forEach((h,j)=>a.txt(h,ox+[0,48,86,130,330,390,440][j],oy,C.muted,11.5));
  Tar.forEach((t,i)=>{const y=oy+26+i*34,r=res[i];
    a.txt(t.n,ox,y,cl[i],13);
    a.txt(String(t.C),ox+60,y,C.text,12,'right');
    a.txt(String(t.B),ox+98,y,C.text,12,'right');
    a.txt(r.it.map(v=>N0(v)).join(' → '),ox+130,y,C.muted,12);
    a.txt(N0(r.R),ox+368,y,r.ok?C.c:C.d,14,'right');
    a.txt(String(t.D),ox+416,y,C.text,12,'right');
    a.txt(r.ok?'cumple':'NO cumple',ox+452,y,r.ok?C.c:C.d,12.5);});
  /* barras R vs D */
  const by=196,BW=360;
  const mx=Math.max(...Tar.map((t,i)=>Math.max(t.D,res[i].R)))*1.08;
  a.txt('Tiempo de respuesta frente al plazo',ox,by-16,C.muted,12);
  Tar.forEach((t,i)=>{const y=by+6+i*34;
    a.txt(t.n,ox-8,y+15,cl[i],12,'right');
    alpha(a,0.1,()=>Rbox(a,ox,y,BW,20,C.text,3));
    const w=BW*res[i].R/mx;
    Rbox(a,ox,y,w,20,res[i].ok?cl[i]:C.d,3);
    const xd=ox+BW*t.D/mx;
    a.line(xd,y-4,xd,y+24,C.b,2);
    a.txt('D',xd,y-8,C.b,10,'center');
    a.txt('R = '+N0(res[i].R),ox+BW+10,y+15,res[i].ok?C.text:C.d,12);});
  a.txt('la línea vertical es el plazo D',ox,by+6+3*34+14,C.muted,11);
  const U=Tar.reduce((t,x)=>t+x.C/x.T,0);
  const todas=res.every(r=>r.ok);
  const px=508,py=206;
  a.txt('Utilización',px,py,C.muted,11.5);
  a.txt(N3(U),px,py+24,U<=1?C.text:C.d,17);
  a.txt('Sistema',px,py+58,C.muted,11.5);
  a.txt(todas?'GARANTIZADO':'NO garantizado',px,py+80,todas?C.c:C.d,todas?13.5:13);
  a.html(todas
   ? 'Las tres tareas terminan dentro de su plazo en el peor caso: el sistema está <b>garantizado</b>. Fíjate en cuántas iteraciones hace falta en cada una: la ecuación converge porque cada paso sólo puede aumentar el número de interferencias, y se detiene cuando el valor deja de crecer.'
   : 'Alguna tarea <b>no llega a tiempo</b> en el peor caso, y la utilización ('+N3(U)+') no lo explica: el problema está en <b>cuántas veces interrumpen</b> las tareas más prioritarias más el bloqueo. Baja C de τA un par de milisegundos y mira cómo τB entra en plazo de golpe: no hace falta reducir mucho la carga, basta con que R deje de superar un múltiplo del periodo.');
 }});

/* 10 · Ejecutivo cíclico */
SIMS.ciclico=el=>build(el,{w:680,h:306,
 sliders:[{k:'TA',l:'T de la tarea A',v:40,min:10,max:80,step:10,u:'ms'},{k:'CA',l:'C de A',v:10,min:2,max:30,step:1,u:'ms'},
  {k:'TB',l:'T de B',v:80,min:20,max:200,step:20,u:'ms'},{k:'CB',l:'C de B',v:8,min:2,max:30,step:1,u:'ms'},
  {k:'TC',l:'T de C',v:120,min:30,max:360,step:30,u:'ms'},{k:'CC',l:'C de C',v:12,min:2,max:30,step:1,u:'ms'}],
 draw(a){a.clear();const s=a.st;
  const Tv=[s.TA,s.TB,s.TC],Cv=[s.CA,s.CB,s.CC],nom=['A','B','C'],cl=[C.a,C.c,C.f];
  const H=lcm(lcm(Tv[0],Tv[1]),Tv[2]);
  const f=gcd(gcd(Tv[0],Tv[1]),Tv[2]);
  const nm=Math.round(H/f);
  const U=Tv.reduce((t,T,i)=>t+Cv[i]/T,0);
  const cabe=f>=Math.max(...Cv);
  const ox=50,oy=92,W=540;
  const nvis=Math.min(nm,12);
  const mw=W/nvis;
  a.txt('Esquema del ejecutivo cíclico  ('+nvis+(nm>nvis?' de '+nm:'')+' marcos de '+f+' ms)',ox,oy-34,C.a,13);
  let peor=0;
  for(let m=0;m<nvis;m++){const t0=m*f,x=ox+m*mw;
    alpha(a,0.07,()=>Rbox(a,x+1,oy,mw-3,74,C.text,3));
    Rline(a,x+1,oy,mw-3,74,C.grid,3,1);
    let acum=0;
    for(let i=0;i<3;i++) if(t0%Tv[i]===0){
      const hh=74*Cv[i]/f;
      alpha(a,0.8,()=>Rbox(a,x+3,oy+74-acum-hh,mw-7,hh-1,cl[i],2));
      if(hh>13)a.txt(nom[i],x+mw/2-1,oy+74-acum-hh/2+4,C.bg,11,'center');
      acum+=hh;}
    peor=Math.max(peor,acum/74*f);
    a.txt(String(m),x+mw/2-1,oy+90,C.muted,10,'center');
    if(acum>74.5){a.txt('!',x+mw/2-1,oy-8,C.d,14,'center');}}
  a.txt('marco',ox+W/2,oy+110,C.muted,11,'center');
  a.line(ox,oy+74,ox+W,oy+74,C.muted,1.4);
  a.txt('carga',ox-10,oy+40,C.muted,11,'right');
  a.txt(f+' ms',ox-10,oy+6,C.muted,10,'right');
  /* panel */
  const bx=50,by=224;
  const fil=[['Hiperperiodo  H = mcm(T)',H+' ms',C.text],['Ciclo menor  f = mcd(T)',f+' ms',C.text],
   ['Número de marcos  H/f',String(nm),C.text],['Utilización',N3(U),U<=1?C.text:C.d],
   ['Marco más cargado',N1(peor)+' / '+f+' ms',peor<=f?C.c:C.d]];
  fil.forEach((v,i)=>{const x=bx+(i%3)*212,y=by+Math.floor(i/3)*40;
    a.txt(v[0],x,y,C.muted,11);a.txt(v[1],x,y+19,v[2],13);});
  a.html(!cabe
   ? 'El ciclo menor ('+f+' ms) es <b>más corto</b> que la tarea más larga ('+Math.max(...Cv)+' ms): no cabe en un marco. Habría que <b>trocear</b> esa tarea a mano en partes que sí quepan, que es justamente el mayor inconveniente del ejecutivo cíclico.'
   : peor>f
   ? 'Hay marcos <b>sobrecargados</b> (marcados con !): la suma de los tiempos de cómputo que coinciden supera los '+f+' ms del ciclo menor. Habría que desplazar alguna tarea a otro marco o trocearla.'
   : 'Un único bucle llama a las tareas en un orden <b>calculado de antemano</b>: no hay hilos, ni planificador, ni mutex, ni interbloqueos posibles, y el comportamiento es completamente <b>determinista</b>. El esquema se repite cada '+H+' ms. El precio es la rigidez: cambia cualquier periodo y hay que recalcularlo todo.');
 }});

/* 11 · Controlador difuso de Sugeno */
SIMS.fuzzy=el=>build(el,{w:680,h:306,
 sliders:[{k:'x',l:'Temperatura de entrada',v:19,min:8,max:40,step:0.5,u:'ºC'},
  {k:'s2',l:'Centro del conjunto «templada»',v:23,min:18,max:30,step:0.5,u:'ºC'},
  {k:'o3',l:'Salida de la regla «caliente»',v:100,min:50,max:100,step:5,u:'%'}],
 draw(a){a.clear();const s=a.st;
  const conj=[{n:'fría',a:10,b:15,c:20,z:0,col:C.f},
   {n:'templada',a:s.s2-5,b:s.s2,c:s.s2+5,z:50,col:C.c},
   {n:'caliente',a:26,b:32,c:38,z:s.o3,col:C.a}];
  const mu=(k,x)=>{if(x<=k.a||x>=k.c)return 0;if(x<k.b)return (x-k.a)/(k.b-k.a);if(x>k.b)return (k.c-x)/(k.c-k.b);return 1;};
  const w=conj.map(k=>mu(k,s.x));
  const den=w.reduce((t,v)=>t+v,0);
  const num=w.reduce((t,v,i)=>t+v*conj[i].z,0);
  const z=den>1e-9?num/den:0;
  /* gráfico de pertenencia */
  const ox=52,oy=172,W=380,H=104;
  const X=v=>ox+(v-8)/32*W, Y=m=>oy-m*H;
  a.line(ox,oy,ox+W,oy,C.muted,1.4);
  a.line(ox,oy,ox,oy-H,C.muted,1.4);
  a.txt('μ',ox-16,oy-H+6,C.muted,11);a.txt('1',ox-10,oy-H+4,C.muted,10,'right');
  a.txt('0',ox-10,oy+4,C.muted,10,'right');
  for(let v=10;v<=40;v+=5){a.line(X(v),oy,X(v),oy+5,C.muted,1);a.txt(String(v),X(v),oy+19,C.muted,10,'center');}
  a.txt('ºC',ox+W+12,oy+5,C.muted,10);
  conj.forEach((k,i)=>{a.g.strokeStyle=k.col;a.g.lineWidth=2.2;a.g.beginPath();
    a.g.moveTo(X(k.a),Y(0));a.g.lineTo(X(k.b),Y(1));a.g.lineTo(X(k.c),Y(0));a.g.stroke();
    a.txt(k.n,X(k.b),Y(1)-8,k.col,11.5,'center');
    if(w[i]>0.001){alpha(a,0.18,()=>{a.g.fillStyle=k.col;a.g.beginPath();
      a.g.moveTo(X(k.a),Y(0));a.g.lineTo(X(k.b),Y(1));a.g.lineTo(X(k.c),Y(0));a.g.closePath();a.g.fill();});}});
  a.line(X(s.x),oy+4,X(s.x),oy-H-6,C.b,2,[4,3]);
  a.txt(N1(s.x)+' ºC',X(s.x),oy-H-24,C.b,12,'center');
  conj.forEach((k,i)=>{if(w[i]>0.001)a.circ(X(s.x),Y(w[i]),4.5,k.col,true);});
  /* tabla de reglas */
  const bx=470,by=62;
  a.txt('Reglas y pesos',bx,by-18,C.a,13);
  ['SI … ENTONCES','w','z'].forEach((h,j)=>a.txt(h,bx+[0,110,150][j],by,C.muted,11));
  conj.forEach((k,i)=>{const y=by+24+i*26;
    a.txt(k.n,bx,y,k.col,12.5);
    a.txt(N3(w[i]),bx+140,y,w[i]>0.001?C.text:C.grid,12,'right');
    a.txt(N0(k.z),bx+180,y,w[i]>0.001?C.text:C.grid,12,'right');});
  a.txt('z* = Σwᵢzᵢ / Σwᵢ',bx,by+114,C.muted,11.5);
  a.txt(N2(num)+' / '+N3(den),bx,by+136,C.muted,12);
  a.txt(N1(z)+' %',bx,by+166,C.a,24);
  /* barra de salida */
  const sx=52,sy=246;
  a.txt('Potencia del ventilador',sx,sy-10,C.muted,11.5);
  alpha(a,0.12,()=>Rbox(a,sx,sy,380,22,C.text,4));
  Rbox(a,sx,sy,380*z/100,22,C.a,4);
  a.txt('0 %',sx,sy+36,C.muted,10);a.txt('100 %',sx+380,sy+36,C.muted,10,'right');
  a.html('El valor de entrada pertenece <b>a la vez</b> a varios conjuntos, con grados distintos. En Sugeno cada regla aporta una <b>constante</b> y la salida es la <b>media ponderada</b> por esos grados, que es una división y nada más: por eso se usa en controladores empotrados, mientras que Mamdani exige integrar el área de un conjunto agregado.<br>Mueve el centro de «templada» y observa que la salida cambia de forma <b>continua</b>: no hay saltos, que es justo lo que se busca en un control.');
 }});

/* 12 · kNN */
SIMS.knn=el=>build(el,{w:680,h:306,
 selects:[{k:'norm',l:'Atributos',v:'si',opts:[['si','Normalizados a [0,1]'],['no','Sin normalizar (x ×100)']]}],
 sliders:[{k:'k',l:'Número de vecinos k',v:3,min:1,max:9,step:2},
  {k:'px',l:'Punto nuevo: x',v:0.5,min:0.05,max:0.95,step:0.01},
  {k:'py',l:'Punto nuevo: y',v:0.5,min:0.05,max:0.95,step:0.01}],
 draw(a){a.clear();const s=a.st;
  /* conjunto fijo y determinista */
  const D=[[0.15,0.22,0],[0.25,0.35,0],[0.12,0.48,0],[0.31,0.18,0],[0.22,0.62,0],[0.38,0.45,0],[0.08,0.33,0],[0.42,0.28,0],
   [0.72,0.78,1],[0.84,0.62,1],[0.65,0.88,1],[0.90,0.80,1],[0.58,0.70,1],[0.78,0.52,1],[0.92,0.68,1],[0.60,0.55,1],
   [0.52,0.40,0],[0.55,0.82,1],[0.46,0.66,1],[0.35,0.72,0]];
  const esc=s.norm==='si'?1:100;
  const P=[s.px,s.py];
  const dist=D.map((p,i)=>{const dx=(p[0]-P[0])*esc, dy=p[1]-P[1];
    return {i:i,d:Math.sqrt(dx*dx+dy*dy),c:p[2]};});
  dist.sort((u,v)=>u.d-v.d);
  const vec=dist.slice(0,s.k);
  const v0=vec.filter(v=>v.c===0).length, v1=s.k-v0;
  const clase=v0>v1?0:1;
  /* gráfico */
  const ox=56,oy=60,W=228,H=206;
  const X=v=>ox+v*W, Y=v=>oy+H-v*H;
  Rline(a,ox,oy,W,H,C.grid,4,1.3);
  a.txt('atributo x',ox+W/2,oy+H+22,C.muted,11,'center');
  a.g.save();a.g.translate(ox-18,oy+H/2);a.g.rotate(-Math.PI/2);a.txt('atributo y',0,0,C.muted,11,'center');a.g.restore();
  const rad=vec.length?vec[vec.length-1].d/esc:0;
  if(rad>0.001){alpha(a,0.1,()=>{a.g.fillStyle=C.b;a.g.beginPath();a.g.ellipse(X(P[0]),Y(P[1]),rad*W*(esc>1?esc:1)/(esc>1?esc:1),rad*H,0,0,6.2832);a.g.fill();});
    a.g.strokeStyle=C.b;a.g.lineWidth=1.4;a.g.setLineDash([4,3]);a.g.beginPath();
    a.g.ellipse(X(P[0]),Y(P[1]),rad*W,rad*H,0,0,6.2832);a.g.stroke();a.g.setLineDash([]);}
  const enK=new Set(vec.map(v=>v.i));
  D.forEach((p,i)=>{const col=p[2]===0?C.c:C.a;
    if(enK.has(i)){a.circ(X(p[0]),Y(p[1]),7,C.b,false);a.circ(X(p[0]),Y(p[1]),4.5,col,true);}
    else alpha(a,0.45,()=>a.circ(X(p[0]),Y(p[1]),4,col,true));});
  a.circ(X(P[0]),Y(P[1]),6.5,C.b,true);
  a.txt('nuevo',X(P[0]),Y(P[1])-14,C.b,11,'center');
  /* panel */
  const bx=320,by=66;
  a.txt('Los '+s.k+' vecinos más próximos',bx,by-18,C.a,13);
  ['#','distancia','clase'].forEach((h,j)=>a.txt(h,bx+[0,46,140][j],by,C.muted,11));
  vec.forEach((v,i)=>{const y=by+22+i*21;
    a.txt(String(i+1),bx,y,C.muted,11.5);
    a.txt(N4(v.d),bx+110,y,C.text,11.5,'right');
    a.txt(v.c===0?'A':'B',bx+146,y,v.c===0?C.c:C.a,12.5);});
  const yv=by+24+vec.length*21+14;
  a.txt('Votos',bx,yv,C.muted,11.5);
  a.txt('A: '+v0,bx+60,yv,C.c,13);
  a.txt('B: '+v1,bx+120,yv,C.a,13);
  a.txt('Clasificación',bx,yv+30,C.muted,11.5);
  a.txt('clase '+(clase===0?'A':'B'),bx,yv+54,clase===0?C.c:C.a,18);
  if(s.norm==='no'){a.txt('⚠ x multiplicado por 100',bx,yv+88,C.d,11.5);
    a.txt('la distancia la domina x;',bx,yv+106,C.d,11);
    a.txt('el atributo y casi no cuenta',bx,yv+124,C.d,11);}
  a.html(s.norm==='no'
   ? '<b>Sin normalizar.</b> El atributo x va de 0 a 100 y el y de 0 a 1, así que la distancia euclídea está <b>completamente dominada</b> por x: los «vecinos más próximos» son en realidad los que tienen una x parecida, sin importar la y. Por eso <b>normalizar es obligatorio</b> en kNN, y es el error que más veces estropea el resultado.'
   : 'kNN no entrena nada: guarda los ejemplos y, para clasificar, mide la distancia a todos, se queda con los k más cercanos y <b>vota</b>. Mueve el punto a la frontera entre las dos nubes y cambia k: con k = 1 la clasificación salta con cualquier ejemplo aislado, y al subir k se suaviza. Por eso se elige k <b>impar</b> con dos clases: para que no haya empates.');
 }});




/* ---- paso a paso declarativo ---- */
SIMS.__paso=(el,D)=>build(el,{w:D.w||660,h:D.h||340,
 sliders:[{k:'paso',v:0,min:0,max:D.steps.length,step:1,l:'paso de la resolución (0 = enunciado)',u:''}],
 draw(a){a.clear();const g=a.g,p=a.st.paso;
  const it=(x,col)=>{const k=x[0];
   if(k==='t')a.txt(x[1],x[2],x[3],col,x[4]||13,x[5]||'left');
   else if(k==='l')a.line(x[1],x[2],x[3],x[4],col,x[5]||1.5,x[6]);
   else if(k==='a')a.arrow(x[1],x[2],x[3],x[4],col,x[5]);
   else if(k==='c')a.circ(x[1],x[2],x[3],col,!!x[4]);
   else if(k==='r'){g.strokeStyle=col;g.lineWidth=1.8;if(x[5]){g.fillStyle=col;g.globalAlpha=.18;g.fillRect(x[1],x[2],x[3],x[4]);g.globalAlpha=1;}g.strokeRect(x[1],x[2],x[3],x[4]);}
   else if(k==='p'){g.strokeStyle=col;g.lineWidth=x[2]||2;g.beginPath();x[1].forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.stroke();}};
  (D.base||[]).forEach(x=>it(x,C.muted));
  D.steps.forEach((s,i)=>{if(i+1>p)return;const cur=(i+1===p);(s.add||[]).forEach(x=>it(x,cur?C.d:C.text));if(cur)(s.now||[]).forEach(x=>it(x,C.d));});
  a.html('<div>'+(p===0?D.q:D.steps[p-1].text)+'</div>');}});
/* ---- fin paso a paso declarativo ---- */

/* ---- paso2 rtaPaso ---- */
SIMS.rtaPaso=el=>SIMS.__paso(el,{"w":660,"h":315,"q":"Tres tareas periódicas con plazo igual al periodo, planificadas con RM. ¿Cuál es el tiempo de respuesta de la tarea de menor prioridad y cumple su plazo? Sube el paso.","base":[["t","τ1 (C=1, T=4)   τ2 (C=2, T=6)   τ3 (C=3, T=12) · prioridades RM",30,24,12,"left"]],"steps":[{"text":"Por Rate Monotonic, la prioridad es mayor cuanto menor el periodo: <b>τ₁ &gt; τ₂ &gt; τ₃</b>. Se calcula el tiempo de respuesta de cada una con la ecuación recursiva R = C + Σ ⌈R/Tⱼ⌉ Cⱼ sobre las tareas más prioritarias.","add":[["t","R = C + Σ ⌈R/Tⱼ⌉·Cⱼ   (j de mayor prioridad)",40,70,14,"left"]]},{"text":"<b>τ₁</b> (la más prioritaria) nunca es interrumpida: R₁ = C₁ = <b>1</b>. <b>τ₂</b>: R = 2 + ⌈R/4⌉·1; con R = 2 → 3 → 3: <b>R₂ = 3</b> ≤ 6.","add":[["t","R₁ = 1 ;  R₂ = 3",40,100,14,"left"]]},{"text":"<b>τ₃</b>, primera iteración: se parte de R⁰ = C₃ = 3. R¹ = 3 + ⌈3/4⌉·1 + ⌈3/6⌉·2 = 3 + 1 + 2 = <b>6</b>.","add":[["t","R⁰ = 3  →  R¹ = 3 + 1·1 + 1·2 = 6",40,134,14,"left"]]},{"text":"Segunda: R² = 3 + ⌈6/4⌉·1 + ⌈6/6⌉·2 = 3 + 2 + 2 = <b>7</b>. Como R² ≠ R¹, hay que seguir iterando.","add":[["t","R² = 3 + 2·1 + 1·2 = 7",40,164,14,"left"]]},{"text":"Tercera: R³ = 3 + ⌈7/4⌉·1 + ⌈7/6⌉·2 = 3 + 2 + 4 = <b>9</b>. Cuarta: R⁴ = 3 + ⌈9/4⌉·1 + ⌈9/6⌉·2 = 3 + 3 + 4 = <b>10</b>.","add":[["t","R³ = 3 + 2·1 + 2·2 = 9",40,194,14,"left"],["t","R⁴ = 3 + 3·1 + 2·2 = 10",40,224,14,"left"]]},{"text":"Quinta: R⁵ = 3 + ⌈10/4⌉·1 + ⌈10/6⌉·2 = 3 + 3 + 4 = <b>10</b> = R⁴: la sucesión <b>converge</b>. Tiempo de respuesta de τ₃ = 10.","add":[["t","R⁵ = 10 = R⁴  →  R₃ = 10",40,254,15,"left"]]},{"text":"Como <b>R₃ = 10 ≤ D₃ = 12</b>, la tarea cumple su plazo (y R₁, R₂ también): el conjunto es <b>planificable con RM</b>. Si la sucesión superara el plazo, se pararía y la tarea no sería planificable.","add":[["t","10 ≤ 12  ✓  planificable",40,284,15,"left"]]}]});
/* ---- fin paso2 rtaPaso ---- */
document.querySelectorAll("[data-sim]").forEach(function(el){var k=el.getAttribute("data-sim");if(SIMS[k]){try{SIMS[k](el);}catch(e){console.error("sim "+k,e);}}else console.warn("sim no encontrada: "+k);});
})();
