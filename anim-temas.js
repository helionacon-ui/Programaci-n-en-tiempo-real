/* Programación de Sistemas en Tiempo Real: una animación por tema */
(function(){var M=window.MANIM;if(!M)return;var U=M.util,C=M.C,nf=U.nf,lerp=U.lerp,ease=U.ease,seg=U.seg,clamp=U.clamp,RG=U.RG,W=640;

/* T1 del problema al programa */
var AR=[7,3,12,5,9,15,4],MX=(function(){var o=[],m=AR[0],im=0;for(var i=1;i<AR.length;i++){o.push([i,m,im]);if(AR[i]>m){m=AR[i];im=i;}}o.push([AR.length,m,im]);return o;})();
M.reg('ptr-t1',M.base({title:'Del problema al programa: seguir un algoritmo',H:580,dur:20,caps:[[6,'Problema: encontrar el máximo de una lista. Antes de escribir código se diseña el algoritmo: recorrerla guardando el mayor visto hasta ahora.'],[13,'Se sigue a mano con un ejemplo (traza): en cada paso se compara el elemento actual con el máximo provisional.'],[99,'Después se codifica, se compila y se prueba con casos límite: lista de un elemento, todos iguales, máximo al principio o al final.']]},
 function(D,t){var k=Math.min(MX.length-1,Math.floor(seg(t,1,18)*MX.length)),s=MX[k],x0=110,cw=62;
  var code=['int m = v[0];','for (size_t i = 1; i < v.size(); ++i)','    if (v[i] > m) m = v[i];','return m;'];code.forEach(function(c,i){var on=(s[0]<AR.length&&(i===1||i===2))||(s[0]>=AR.length&&i===3);D.text(c,60,100+i*26,{s:15,c:on?C.y:C.w,mono:true,bold:on&&i===2});});
  AR.forEach(function(v,i){var x=x0+i*cw,cur=i===s[0],best=i===s[2];D.rect(x,240,cw-8,54,best?C.hl:(cur?C.m:C.ax),RG(best?C.hl:(cur?C.m:C.ax),best||cur?.25:.04),best||cur?2.6:1.4);D.text(''+v,x+cw/2-4,274,{s:20,a:'center',c:best?C.hl:(cur?C.m:C.w),bold:true,mono:true});D.text(''+i,x+cw/2-4,312,{s:12,a:'center',c:C.mut});});
  if(s[0]<AR.length){D.arrow(x0+s[0]*cw+cw/2-4,214,x0+s[0]*cw+cw/2-4,236,C.m,2.4);D.text('i',x0+s[0]*cw+cw/2-4,206,{s:15,a:'center',c:C.m,bold:true});}
  U.readout(D,['m = '+s[1]+(s[0]<AR.length?'    comparo v['+s[0]+'] = '+AR[s[0]]+(AR[s[0]]>s[1]?' > m → actualizo':' ≤ m'):'    fin: el máximo es '+s[1])],400);}));


/* T2 std::vector: tamaño y capacidad */
M.reg('ptr-t2',M.base({title:'std::vector: tamaño frente a capacidad',H:560,dur:18,caps:[[6,'push_back añade al final. Mientras quede capacidad libre, es inmediato.'],[12,'Cuando el vector está lleno, reserva un bloque mayor (típicamente el doble), copia o mueve los elementos y libera el antiguo.'],[99,'Por eso push_back es O(1) amortizado, pero las direcciones de los elementos pueden cambiar: los punteros e iteradores antiguos dejan de ser válidos.']]},
 function(D,t){var n=Math.min(17,Math.floor(seg(t,0.5,16)*18)),cap=1;while(cap<n)cap*=2;if(n===0)cap=0;var re=0,c2=1;for(var i=1;i<=n;i++){if(i>c2){c2*=2;re++;}}
  var x0=50,cw=32,y=200;for(var k=0;k<cap;k++){D.rect(x0+k*cw,y,cw-4,46,C.ax,k<n?RG(C.m,.35):null,1.4);if(k<n)D.text(''+k,x0+k*cw+cw/2-2,y+29,{s:13,a:'center',c:C.m,mono:true});}
  var justRe=n>1&&((n-1)&(n-2))===0;if(justRe){D.text('¡realojamiento! nueva capacidad = '+cap,W/2,160,{s:18,a:'center',c:C.bad,bold:true});}
  D.text('size() = '+n,60,320,{s:20,c:C.m,mono:true});D.text('capacity() = '+cap,320,320,{s:20,c:C.f,mono:true});U.readout(D,['realojamientos hasta ahora: '+re],420);}));

/* T3 objetos: constructor y destructor */
var LF3=[[0,'int main() {',[]],[1,'  Sensor a(20.0);      // constructor de a',['a']],[2,'  {',['a']],[3,'    Sensor b(35.5);    // constructor de b',['a','b']],[4,'    a.leer();  b.leer();',['a','b']],[5,'  }                    // destructor de b',['a']],[6,'  a.leer();',['a']],[7,'}                      // destructor de a',[]]];
M.reg('ptr-t3',M.base({title:'Programación basada en objetos: vida de un objeto',H:580,dur:20,caps:[[6,'Un objeto local se construye al llegar a su declaración: se ejecuta el constructor y ocupa sitio en la pila.'],[13,'Al salir del bloque {…} donde se declaró se ejecuta automáticamente su destructor, en orden inverso al de construcción.'],[99,'Esa garantía es la base de RAII: si el objeto gestiona un recurso (memoria, fichero, mutex), lo libera solo, aunque haya una excepción.']]},
 function(D,t){var k=Math.min(LF3.length-1,Math.floor(seg(t,0.5,19)*LF3.length)),s=LF3[k];
  LF3.forEach(function(l,i){var y=96+i*30,on=i===k;if(on)D.rect(30,y-21,390,28,null,RG(C.y,.14));D.text(l[1],40,y,{s:14,c:on?C.y:C.w,mono:true,bold:on});});
  D.text('pila',530,100,{s:15,a:'center',c:C.mut});D.rect(450,110,160,250,C.ax,null,1.4);
  s[2].forEach(function(o,i){var y=290-i*70;D.rect(465,y,130,56,o==='a'?C.f:C.hl,RG(o==='a'?C.f:C.hl,.2),2);D.text('Sensor '+o,530,y+24,{s:15,a:'center',c:o==='a'?C.f:C.hl,bold:true});D.text('valor_ = '+(o==='a'?'20.0':'35.5'),530,y+44,{s:12,a:'center',c:C.mut,mono:true});});
  var prev=k?LF3[k-1][2]:[],msg=s[2].length>prev.length?'constructor de '+s[2][s[2].length-1]:(s[2].length<prev.length?'destructor de '+prev[prev.length-1]:'');U.readout(D,[msg||' '],440);}));


/* T4 polimorfismo */
M.reg('ptr-t4',M.base({title:'Polimorfismo: una llamada, distintos métodos',H:580,dur:18,caps:[[6,'Un vector de punteros a la clase base Figura guarda en realidad objetos de clases derivadas.'],[12,'Como area() es <b>virtual</b>, cada llamada se resuelve en tiempo de ejecución mirando la tabla virtual del objeto real.'],[99,'El código que recorre el vector no cambia aunque se añadan figuras nuevas. Sin virtual, siempre se llamaría a Figura::area().']]},
 function(D,t){var F=[['Circulo',C.f,'π·r² = 12,57'],['Cuadrado',C.hl,'l² = 9,00'],['Triangulo',C.g,'b·h/2 = 6,00']],k=Math.min(2,Math.floor(seg(t,1,16)*3)),x0=60;
  D.text('std::vector<Figura*> v;',x0,110,{s:17,c:C.w,mono:true});D.text('for (auto f : v) total += f->area();',x0,140,{s:17,c:C.m,mono:true});
  F.forEach(function(f,i){var y=200+i*90,on=i===k;D.rect(x0,y,90,50,C.ax,on?RG(C.m,.15):null,1.6);D.text('v['+i+']',x0+45,y+31,{s:15,a:'center',c:C.ax,mono:true});
   D.arrow(x0+92,y+25,x0+170,y+25,on?C.m:C.ax,on?2.6:1.4);D.rect(x0+175,y,150,50,f[1],RG(f[1],on?.25:.08),on?2.6:1.4);D.text(f[0],x0+250,y+31,{s:16,a:'center',c:f[1],bold:on});
   if(i<=k){D.text(f[0]+'::area() → '+f[2],x0+340,y+31,{s:15,c:on?f[1]:C.mut});}});
  U.readout(D,['total = '+['12,57','21,57','27,57'][k]],500);}));

/* T5 carrera de datos */
var RACE=[['A','lee cont = 0',0],['B','lee cont = 0',0],['A','suma: 1',1],['A','escribe cont = 1',1],['B','suma: 1',1],['B','escribe cont = 1',1]];
M.reg('ptr-t5',M.base({title:'Hilos: una carrera de datos',H:580,dur:18,caps:[[6,'Dos hilos ejecutan cont++ a la vez. Esa instrucción son tres pasos: leer la variable, sumar 1 y escribirla.'],[12,'Si el planificador intercala los pasos, los dos leen el mismo valor y uno de los incrementos se pierde.'],[99,'El resultado depende del orden de ejecución: es una condición de carrera. Hace falta exclusión mutua (std::mutex) o std::atomic.']]},
 function(D,t){var k=Math.min(6,Math.floor(seg(t,1,15)*7)),x0=120,cw=80;D.text('hilo A',x0-14,170,{s:16,a:'right',c:C.f});D.text('hilo B',x0-14,270,{s:16,a:'right',c:C.hl});D.line(x0,320,x0+6*cw,320,C.ax,1.4);D.text('t',x0+6*cw+10,325,{s:14,c:C.mut});
  for(var i=0;i<k;i++){var r=RACE[i],y=r[0]==='A'?140:240,c=r[0]==='A'?C.f:C.hl;D.rect(x0+i*cw+2,y,cw-4,50,c,RG(c,.18),1.6);D.text(r[1].split(' ')[0],x0+i*cw+cw/2,y+22,{s:14,a:'center',c:c,bold:true});D.text(r[1].split(' ').slice(1).join(' '),x0+i*cw+cw/2,y+40,{s:12,a:'center',c:c});}
  var cont=k>=4?1:0;D.text('cont = '+cont,W/2,390,{s:24,a:'center',c:k>=6?C.bad:C.m,mono:true,bold:true});
  U.readout(D,[k>=6?'esperado 2, obtenido 1: se ha perdido un incremento':'…'],470);}));

/* T6 mutex */
M.reg('ptr-t6',M.base({title:'Sincronización: el mutex hace esperar',H:580,dur:18,caps:[[6,'Con un std::mutex la sección crítica (leer-sumar-escribir) solo la ejecuta un hilo cada vez.'],[12,'Si B intenta bloquear el mutex mientras lo tiene A, se queda bloqueado esperando (no consume CPU).'],[99,'Cuando A libera el mutex, B entra. El resultado es siempre 2. std::lock_guard libera el mutex automáticamente al salir del ámbito.']]},
 function(D,t){var u=seg(t,1,16)*6,x0=120,cw=80;D.text('hilo A',x0-14,170,{s:16,a:'right',c:C.f});D.text('hilo B',x0-14,270,{s:16,a:'right',c:C.hl});
  var blk=[['A',0,3,C.f,'sección crítica'],['B',0.5,3,C.mut,'bloqueado'],['B',3,6,C.hl,'sección crítica']];blk.forEach(function(b){if(u<=b[1])return;var e=Math.min(u,b[2]),y=b[0]==='A'?140:240;D.rect(x0+b[1]*cw,y,(e-b[1])*cw,50,b[3],RG(b[3],b[4]==='bloqueado'?.08:.2),1.6);if(e-b[1]>1)D.text(b[4],x0+(b[1]+e)/2*cw,y+31,{s:14,a:'center',c:b[3]});});
  var own=u<3?'A':(u<6?'B':'libre');D.rect(W/2-60,350,120,46,C.m,RG(C.m,.12),2);D.text('mutex: '+own,W/2,380,{s:17,a:'center',c:C.m,bold:true});
  U.readout(D,['cont = '+(u>=6?2:(u>=3?1:0))],470);}));

/* T7 Round Robin */
var RR=(function(){var P=[['P1',5],['P2',3],['P3',4]],q=2,rem=P.map(function(p){return p[1];}),o=[],tm=0,Q=[0,1,2];while(Q.length){var i=Q.shift(),r=Math.min(q,rem[i]);o.push([i,tm,tm+r]);tm+=r;rem[i]-=r;if(rem[i]>0)Q.push(i);}return o;})();
M.reg('ptr-t7',M.base({title:'El planificador: turno rotatorio (Round Robin)',H:560,dur:18,caps:[[6,'Cada proceso listo recibe la CPU durante un cuanto (aquí 2 unidades). Si no termina, vuelve al final de la cola.'],[12,'Así ningún proceso monopoliza la CPU y todos avanzan, a costa de más cambios de contexto.'],[99,'Un cuanto muy grande se parece a FIFO; uno muy pequeño gasta casi todo el tiempo en cambios de contexto.']]},
 function(D,t){var u=seg(t,1,16)*12,x0=90,cw=38,cols=[C.f,C.hl,C.m];['P1 (5)','P2 (3)','P3 (4)'].forEach(function(n,i){D.text(n,x0-10,150+i*60,{s:15,a:'right',c:cols[i]});});
  RR.forEach(function(s){if(u<=s[1])return;var e=Math.min(u,s[2]);D.rect(x0+s[1]*cw,126+s[0]*60,(e-s[1])*cw,40,cols[s[0]],RG(cols[s[0]],.3),1.6);if(u>=s[2])D.text(''+s[2],x0+s[2]*cw,330,{s:13,a:'center',c:C.mut});});
  D.line(x0,310,x0+12*cw,310,C.ax,1.4);D.text('0',x0,330,{s:13,a:'center',c:C.mut});
  U.readout(D,['cuanto q = 2    orden: P1 P2 P3 P1 P2 P3 P1','fin: P2 en 9, P3 en 11, P1 en 12'],420);}));

/* T8 Rate Monotonic */
var TS=[['τ1',1,4],['τ2',2,6],['τ3',2,12]],RM=(function(){var rem=[0,0,0],o=[];for(var tt=0;tt<12;tt++){TS.forEach(function(s,i){if(tt%s[2]===0)rem[i]=s[1];});var r=-1;for(var i=0;i<3;i++)if(rem[i]>0){r=i;break;}o.push(r);if(r>=0)rem[r]--;}return o;})();
M.reg('ptr-t8',M.base({title:'Planificación en tiempo real: prioridades monótonas en frecuencia',H:580,dur:18,caps:[[6,'Con Rate Monotonic la tarea de periodo más corto tiene la prioridad más alta y expulsa a las demás cuando se activa.'],[12,'Aquí τ1 (C = 1, T = 4), τ2 (2, 6) y τ3 (2, 12). τ3 solo avanza en los huecos que dejan las otras dos.'],[99,'Utilización U = 1/4 + 2/6 + 2/12 = 0,75 ≤ 3·(2<sup>1/3</sup> − 1) ≈ 0,78: la cota de Liu-Layland garantiza que todas cumplen sus plazos.']]},
 function(D,t){var u=seg(t,1,16)*12,x0=100,cw=40,cols=[C.f,C.hl,C.m];TS.forEach(function(s,i){var y=140+i*70;D.text(s[0]+' ('+s[1]+', '+s[2]+')',x0-10,y+26,{s:15,a:'right',c:cols[i]});for(var a=0;a<=12;a+=s[2]){D.arrow(x0+a*cw,y-12,x0+a*cw,y+2,cols[i],1.6);}D.line(x0,y+40,x0+12*cw,y+40,C.grid,1);});
  for(var k=0;k<12;k++){if(u<=k)break;var r=RM[k];if(r<0)continue;var e=Math.min(1,u-k);D.rect(x0+k*cw,140+r*70,e*cw,40,cols[r],RG(cols[r],.3),1.4);}
  for(var k2=0;k2<=12;k2+=2)D.text(''+k2,x0+k2*cw,370,{s:13,a:'center',c:C.mut});
  U.readout(D,['U = 0,75 ≤ 0,78  →  planificable'],450);}));

/* T9 análisis del tiempo de respuesta */
var RI=[5,6,6];
M.reg('ptr-t9',M.base({title:'Tiempo de respuesta: la iteración',H:600,dur:20,caps:[[6,'El peor caso de τ3 (C = 2) es arrancar a la vez que todas las tareas más prioritarias: τ1 (C = 1, T = 4) y τ2 (C = 2, T = 6).'],[13,'En una ventana de longitud R, τ1 se activa ⌈R/4⌉ veces y τ2 ⌈R/6⌉ veces: <i>R = C₃ + ⌈R/4⌉·1 + ⌈R/6⌉·2</i>. Se itera hasta que R no cambia.'],[99,'R⁰ = 5 → R¹ = 6 → R² = 6: converge. R₃ = 6 ≤ D₃ = 12, así que τ3 cumple su plazo en el peor caso.']]},
 function(D,t){var k=Math.min(2,Math.floor(seg(t,1,18)*3)),R=RI[k],x0=110,cw=40,cols=[C.f,C.hl,C.m];
  ['τ1 (1, 4)','τ2 (2, 6)','τ3 (2, 12)'].forEach(function(n,i){D.text(n,x0-10,150+i*70,{s:15,a:'right',c:cols[i]});});
  var sch=[0,1,1,2,0,2,1,1,0,-1,-1,-1];for(var i=0;i<12;i++){if(sch[i]<0)continue;D.rect(x0+i*cw,126+sch[i]*70,cw,40,cols[sch[i]],RG(cols[sch[i]],.3),1.4);}
  D.rect(x0,100,R*cw,240,C.y,RG(C.y,.07),2);D.text('ventana R = '+R,x0+R*cw/2,92,{s:16,a:'center',c:C.y,bold:true});
  for(var j=0;j<=12;j+=2)D.text(''+j,x0+j*cw,360,{s:13,a:'center',c:C.mut});
  var prev=k?RI[k-1]:'—',f='R^{'+k+'} = 2 + ⌈'+(k?RI[k-1]:'')+'/4⌉·1 + ⌈'+(k?RI[k-1]:'')+'/6⌉·2 = '+R;U.readout(D,[k?f:'R⁰ = C₃ + C₁ + C₂ = 5',k===2?'converge: R_{3} = 6 ≤ 12 → cumple':'…'],430);}));


/* T10 lógica difusa: funciones de pertenencia */
function tri(x,a,b,c){return x<=a||x>=c?0:(x<b?(x-a)/(b-a):(c-x)/(c-b));}
var FZ=[['fría',function(x){return x<=10?1:tri(x,0,10,20);},C.f],['templada',function(x){return tri(x,12,21,30);},C.ok],['caliente',function(x){return x>=32?1:tri(x,22,32,42);},C.bad]];
M.reg('ptr-t10',M.base({title:'Lógica difusa: grados de pertenencia',H:560,dur:18,caps:[[6,'En lógica difusa una temperatura no es «fría» o «caliente» sin más: pertenece a cada conjunto con un grado entre 0 y 1.'],[12,'A 17 °C, por ejemplo, es algo fría y bastante templada a la vez. Las reglas («si templada, ventilador medio») se activan en esa proporción.'],[99,'La salida se obtiene combinando las reglas activadas y desdifusificando (por ejemplo, con el centro de gravedad).']]},
 function(D,t){var T=lerp(2,38,U.pp(t,18)),A=U.axes(D,{xr:[0,40],yr:[0,1.15],xt:[10,20,30,40],yt:[0.5,1],xd:0,yd:1,xl:'T (°C)',yl:'μ'},{x:80,y:96,w:480,h:280,grid:true});
  FZ.forEach(function(f){U.plotf(D,A,f[1],f[2],2.6);var m=f[1](T);if(m>0){D.dot(A.X(T),A.Y(m),6,f[2]);D.line(A.X(T),A.Y(m),A.X(0),A.Y(m),f[2],1,[3,3]);}});D.line(A.X(T),A.Y(0),A.X(T),A.Y(1.15),C.m,1.6,[4,3]);
  FZ.forEach(function(f,i){D.text(f[0],A.X([5,21,36][i]),A.Y(1.08),{s:15,a:'center',c:f[2]});});
  U.readout(D,['T = '+nf(T,1)+' °C','fría '+nf(FZ[0][1](T),2)+'    templada '+nf(FZ[1][1](T),2)+'    caliente '+nf(FZ[2][1](T),2)],446);}));
var TS2=[['τ1',2,5],['τ2',4,7]],EDF=(function(){var rem=[0,0],dl=[0,0],o=[];for(var t=0;t<35;t++){TS2.forEach(function(s,i){if(t%s[2]===0){rem[i]=s[1];dl[i]=t+s[2];}});var r=-1,b=1e9;for(var i=0;i<2;i++)if(rem[i]>0&&dl[i]<b){b=dl[i];r=i;}o.push(r);if(r>=0)rem[r]--;}return o;})();
M.reg('ptr-t8b',M.base({title:'Planificación EDF: primero el plazo más cercano',H:560,dur:18,caps:[[6,'EDF asigna la CPU a la tarea cuyo plazo absoluto vence antes. Las prioridades cambian dinámicamente en cada activación.'],[12,'Con τ1 (C = 2, T = 5) y τ2 (C = 4, T = 7) la utilización es 2/5 + 4/7 = 0,97: más de lo que garantiza Rate Monotonic para dos tareas (0,83).'],[99,'Aun así EDF cumple todos los plazos: es óptimo mientras U ≤ 1.']]},
 function(D,t){var u=seg(t,1,16)*35,x0=90,cw=14.5,cols=[C.f,C.hl];TS2.forEach(function(s,i){var y=160+i*90;D.text(s[0]+' ('+s[1]+', '+s[2]+')',x0-10,y+26,{s:15,a:'right',c:cols[i]});for(var a=0;a<=35;a+=s[2])D.arrow(x0+a*cw,y-14,x0+a*cw,y+2,cols[i],1.4);D.line(x0,y+40,x0+35*cw,y+40,C.grid,1);});
  for(var k=0;k<35;k++){if(u<=k)break;var r=EDF[k];if(r<0)continue;D.rect(x0+k*cw,160+r*90,Math.min(1,u-k)*cw,40,cols[r],RG(cols[r],.35),1);}for(var k2=0;k2<=35;k2+=5)D.text(''+k2,x0+k2*cw,370,{s:12,a:'center',c:C.mut});
  U.readout(D,['U = 0,97 ≤ 1  →  EDF planificable','(con RM no está garantizado: U > 2(√2 − 1) = 0,83)'],440);}));
var KP=[[1,1,0],[1.5,2,0],[2,1.2,0],[1.2,2.8,0],[2.6,2.2,0],[4,4,1],[4.5,3,1],[3.6,4.6,1],[5,4.2,1],[4.2,2.4,1],[3,3.4,1],[2.4,3.2,0]];
M.reg('ptr-t10b',M.base({title:'Clasificador kNN: votan los k vecinos',H:580,dur:18,caps:[[6,'kNN no construye un modelo: guarda los ejemplos etiquetados. Para clasificar un punto nuevo mira sus k vecinos más cercanos.'],[12,'Cada vecino vota con su clase y gana la mayoritaria. Aquí k = 3 y distancia euclídea.'],[99,'k pequeño es sensible al ruido; k grande difumina las fronteras. Conviene normalizar las variables para que ninguna domine la distancia.']]},
 function(D,t){var s=t/18*2*Math.PI,q=[3.1+1.4*Math.cos(s),2.9+1.3*Math.sin(s)],A=U.axes(D,{xr:[0,6],yr:[0,5.5],xt:[],yt:[],xl:'x₁',yl:'x₂'},{x:120,y:80,w:400,h:360});
  var d=KP.map(function(p,i){return [Math.hypot(p[0]-q[0],p[1]-q[1]),i];}).sort(function(a,b){return a[0]-b[0];}),nb=d.slice(0,3),votes=[0,0];nb.forEach(function(n){votes[KP[n[1]][2]]++;});var cls=votes[1]>votes[0]?1:0;
  D.ring(A.X(q[0]),A.Y(q[1]),(A.X(nb[2][0])-A.X(0)),C.mut,1.2);nb.forEach(function(n){var p=KP[n[1]];D.line(A.X(q[0]),A.Y(q[1]),A.X(p[0]),A.Y(p[1]),C.mut,1.2,[3,3]);});
  KP.forEach(function(p){var c=p[2]?C.hl:C.f;if(p[2])D.rect(A.X(p[0])-7,A.Y(p[1])-7,14,14,c,RG(c,.5),1.6);else{D.dot(A.X(p[0]),A.Y(p[1]),8,RG(c,.5));D.ring(A.X(p[0]),A.Y(p[1]),8,c,1.6);}});
  D.dot(A.X(q[0]),A.Y(q[1]),9,cls?C.hl:C.f);D.ring(A.X(q[0]),A.Y(q[1]),12,C.m,2.4);
  U.readout(D,['votos: círculos '+votes[0]+' · cuadrados '+votes[1]+'  →  clase '+(cls?'cuadrado':'círculo')],500);}));
})();
