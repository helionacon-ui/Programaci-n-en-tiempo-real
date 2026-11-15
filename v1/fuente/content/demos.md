Las demostraciones de los resultados teóricos que usas en el examen y en el trabajo de planificación. Cada paso está plegado: intenta primero el paso por tu cuenta y ábrelo para comprobar. Los números de cada demostración se han verificado con código (comparación por fuerza bruta o enumeración).

## 1 · Cota de Liu–Layland para dos tareas {#dem-ll}

@ejercicio dem-liu-layland | Cota de utilización de Rate Monotonic: $U \le 2(\sqrt2-1)$ y límite $\ln 2$ | tema=plan | tipo=demo
@enunciado
Demuestra que todo conjunto de **dos** tareas periódicas con $D_i=T_i$ y prioridades Rate Monotonic es planificable si $U \le 2(\sqrt 2 - 1)\approx 0{,}8284$, y que la cota general $n(2^{1/n}-1)$ tiende a $\ln 2 \approx 0{,}6931$.
@antes
**Qué piden.** Encontrar la **peor** utilización de un conjunto de tareas que aun así llega justo a incumplir (conjunto «saturado»). La cota es el **mínimo** de $U$ entre todos los conjuntos saturados: por debajo de ella nada puede fallar.

**Teoría que usas.** Instante crítico (todas las tareas se liberan a la vez), Rate Monotonic (menor periodo, mayor prioridad), derivadas para minimizar.
@paso 1. Planteamiento
Sean $T_1<T_2$. Con RM, $\tau_1$ tiene mayor prioridad. Se estudia el instante crítico $t=0$ y se define $F=\lfloor T_2/T_1\rfloor\ge 1$ (cuántos periodos completos de $\tau_1$ caben en un periodo de $\tau_2$). Fijado $C_1$, el mayor $C_2$ que mantiene el conjunto planificable es el que **satura**; si $C_2$ fuera menor, $U$ sería menor y aun así planificable, así que solo hay que buscar el mínimo de $U$ entre los saturados.
@paso 2. Caso A: $C_1 \le T_2 - F\,T_1$
La última liberación de $\tau_1$ antes de $T_2$ (en $t=F\,T_1$) termina antes de $T_2$. En $[0,T_2]$ hay $F+1$ ejecuciones de $\tau_1$, que ocupan $(F+1)C_1$. A $\tau_2$ le queda $T_2-(F+1)C_1$:
$$C_2^{max}=T_2-(F+1)C_1,\qquad U=\frac{C_1}{T_1}+1-\frac{(F+1)C_1}{T_2}=1+C_1\,\frac{T_2-(F+1)T_1}{T_1T_2}.$$
Como $T_2<(F+1)T_1$, el coeficiente de $C_1$ es **negativo**: $U$ **baja** al subir $C_1$. Su mínimo está en el mayor $C_1$ permitido, $C_1=T_2-F\,T_1$.
@paso 3. Caso B: $C_1 > T_2 - F\,T_1$
Ahora la ejecución de $\tau_1$ liberada en $F\,T_1$ dura hasta pasar $T_2$, así que $\tau_2$ no puede ejecutar nada en $[F\,T_1,T_2]$ y debe acabar antes de $F\,T_1$. En $[0,F\,T_1]$ hay $F$ ejecuciones de $\tau_1$: $C_2^{max}=F\,(T_1-C_1)$ y
$$U=\frac{C_1}{T_1}+\frac{F(T_1-C_1)}{T_2}=\frac{F\,T_1}{T_2}+C_1\,\frac{T_2-F\,T_1}{T_1T_2}.$$
El coeficiente de $C_1$ es **positivo**: $U$ **sube** con $C_1$ y su mínimo está en el menor $C_1$ permitido, de nuevo $C_1=T_2-F\,T_1$.
@paso 4. Valor mínimo en función de $F$ y $f$
Los dos casos coinciden: el mínimo es en $C_1=T_2-F\,T_1$. Sea $T_2/T_1=F+f$ con $0\le f<1$. Entonces $C_1/T_1=f$ y $C_2=F\,(T_1-C_1)$ da $C_2/T_2=F(1-f)/(F+f)$:
$$U(f)=f+\frac{F(1-f)}{F+f}=\frac{F+f^2}{F+f}.$$
@paso 5. Minimizar en $f$
Derivando: $U'(f)=\dfrac{f^2+2Ff-F}{(F+f)^2}=0 \Rightarrow f^*=\sqrt{F^2+F}-F$. En el punto crítico, $\dfrac{d}{df}\left(F+f^2\right)=U\,\dfrac{d}{df}(F+f)$, es decir $2f^*=U$:
$$U_{min}(F)=2\left(\sqrt{F^2+F}-F\right)=\frac{2F}{\sqrt{F^2+F}+F}.$$
@paso 6. El peor caso es $F=1$
$U_{min}(F)=\dfrac{2}{\sqrt{1+1/F}+1}$ **crece** con $F$ (el denominador decrece). Su mínimo es en $F=1$: $U_{min}=2(\sqrt2-1)\approx0{,}8284$ (con $f^*=\sqrt2-1\approx0{,}4142$). Para $F=2,3,5$ salen $0{,}8990$, $0{,}9282$, $0{,}9545$ (comprobado numéricamente).
@paso 7. Límite para $n$ grande
La cota general (Liu y Layland, 1973) es $U_n=n(2^{1/n}-1)$. Con $x=1/n\to0$: $U_n=\dfrac{2^x-1}{x}\to\dfrac{d}{dx}2^x\Big|_{x=0}=\ln 2$. Valores: $U_1=1$, $U_2=0{,}828$, $U_3=0{,}780$, $U_{10}=0{,}718$, $U_{1000}=0{,}6934$.
@paso 8. Comprobación por fuerza bruta
Se probaron todos los conjuntos saturados con $T_1\in[5,40]$ y $T_2\le 2T_1$ enteros, calculando la planificabilidad con el análisis de tiempo de respuesta: la menor utilización encontrada es $0{,}8284$ (con $T=(29,41)$, $C=(12,17)$, $T_2/T_1=1{,}414$). Coincide con la demostración.
@resultado
Todo conjunto de dos tareas con $U\le 2(\sqrt2-1)$ es planificable con RM; la cota baja a $\ln 2$ con $n$ creciente.

:::ojo Ojo
La cota es **suficiente, no necesaria**. Un conjunto con $U$ mayor puede ser planificable, p. ej. $(C,T)=(1,4),(2,6),(3,13)$: $U=0{,}814>0{,}780=U_3$, y sin embargo $R_3=10\le13$ (demostración 2).
:::
@fin

## 2 · Análisis de tiempo de respuesta {#dem-rta}

@ejercicio dem-rta | Por qué funciona la recurrencia $R=C+\sum\lceil R/T_j\rceil C_j$ y por qué termina | tema=plan | tipo=demo
@enunciado
Justifica la ecuación del tiempo de respuesta en el peor caso, demuestra que la iteración $R^{(k+1)}=f(R^{(k)})$ termina y que converge al **menor** punto fijo, y aplícala a $(C,T)=(1,4),(2,6),(3,13)$ con prioridades por periodo (RM).
@antes
**Qué piden.** Entender las tres propiedades que hacen que el método sea correcto: ecuación, terminación y minimalidad.

**Teoría que usas.** Instante crítico, techo $\lceil x\rceil$, funciones monótonas, inducción.
@paso 1. La ecuación
En el instante crítico todas las tareas se liberan a la vez. Hasta el tiempo $R$, la tarea $j$ de mayor prioridad se libera $\lceil R/T_j\rceil$ veces (en $0,T_j,2T_j,\dots$ mientras sea $<R$) y cada vez consume $C_j$. La tarea $\tau_i$ acaba cuando el procesador ha terminado su $C_i$ **y** todo el trabajo de mayor prioridad liberado antes. Eso ocurre en el menor $R>0$ tal que
$$R = C_i+\sum_{j\in hp(i)}\left\lceil \frac{R}{T_j}\right\rceil C_j =: f(R).$$
@paso 2. La función $f$ es monótona no decreciente
Si $R\le R'$ entonces $\lceil R/T_j\rceil\le\lceil R'/T_j\rceil$ y por tanto $f(R)\le f(R')$.
@paso 3. La iteración es creciente y termina
Se toma $R^{(0)}=C_i$ y $R^{(k+1)}=f(R^{(k)})$. Como $f(R)\ge C_i$, $R^{(1)}\ge R^{(0)}$. Si $R^{(k)}\ge R^{(k-1)}$, por monotonía $R^{(k+1)}=f(R^{(k)})\ge f(R^{(k-1)})=R^{(k)}$. La sucesión es **no decreciente** y con parámetros enteros sube al menos 1 en cada paso hasta estabilizarse. Se detiene cuando $R^{(k+1)}=R^{(k)}$ (tiempo de respuesta) o cuando $R^{(k)}>D_i$ (no planificable). Como máximo hay $D_i$ pasos.
@paso 4. Es el menor punto fijo
Sea $R^*$ cualquier solución positiva de $R=f(R)$. Por inducción $R^{(k)}\le R^*$: $R^{(0)}=C_i\le f(R^*)=R^*$ y, si $R^{(k)}\le R^*$, entonces $R^{(k+1)}=f(R^{(k)})\le f(R^*)=R^*$. El límite es el **menor** punto fijo.
@paso 5. Ejemplo
$\tau_1$: $R_1=1$. $\tau_2$: $R=2\to 2+\lceil2/4\rceil1=3\to 2+\lceil3/4\rceil1=3$: $R_2=3$. $\tau_3$:
$$3\to 3+1\cdot1+1\cdot2=6\to3+2\cdot1+1\cdot2=7\to3+2\cdot1+2\cdot2=9\to3+3\cdot1+2\cdot2=10\to3+3\cdot1+2\cdot2=10.$$
$R_3=10\le13$: planificable, aunque $U=0{,}814>U_3=0{,}780$.
@resultado
La recurrencia es correcta (da el menor instante en que se completa el trabajo exigido), siempre termina y su resultado es exacto, no una cota.
@fin

## 3 · EDF es óptimo con $U\le1$ {#dem-edf}

@ejercicio dem-edf | EDF planifica un conjunto si y solo si $U\le1$ | tema=plan | tipo=demo
@enunciado
Para tareas periódicas independientes, con $D_i=T_i$, apropiativas y en un solo procesador, demuestra que EDF cumple todos los plazos **si y solo si** $U=\sum C_i/T_i\le 1$.
@antes
**Qué piden.** Una condición necesaria y suficiente. La necesaria es casi trivial; la suficiente se demuestra por contradicción con la **demanda** de trabajo en un intervalo.

**Teoría que usas.** EDF (más cercano el plazo, más prioridad), demanda de procesador.
@paso 1. Necesidad
En un intervalo largo $L$ llega trabajo $\approx L\cdot U$. Si $U>1$, el procesador no puede ejecutar más de $L$ unidades: tarde o temprano falla un plazo.
@paso 2. Suficiencia: suposición contraria
Supón $U\le1$ y que EDF falla un plazo; sea $t_2$ el primer instante en que ocurre. Sea $t_1<t_2$ el último instante anterior en el que el procesador estaba ocioso o ejecutaba un trabajo con plazo $>t_2$ (si no existe, $t_1=0$).
@paso 3. Qué hace el procesador en $[t_1,t_2]$
Como EDF da prioridad al plazo más cercano, en $[t_1,t_2]$ solo se ejecutan trabajos con plazo $\le t_2$ y **liberados en $t_1$ o después**. Está ocupado todo el intervalo (no hay ocio por la definición de $t_1$).
@paso 4. Demanda máxima
La demanda de trabajos liberados en $[t_1,t_2]$ con plazo $\le t_2$ es, para la tarea $i$, a lo sumo $\lfloor (t_2-t_1)/T_i\rfloor C_i$. Total:
$$W\le\sum_i\left\lfloor\frac{t_2-t_1}{T_i}\right\rfloor C_i\le (t_2-t_1)\,U\le t_2-t_1.$$
@paso 5. Contradicción
Si falló un plazo en $t_2$, el trabajo con plazo $\le t_2$ no cupo: $W>t_2-t_1$. Esto contradice $W\le t_2-t_1$. Luego con $U\le1$ no falla ningún plazo.
@resultado
EDF es **óptimo**: planifica todo lo que cualquier algoritmo pueda planificar en un procesador (para $D_i=T_i$, exactamente cuando $U\le1$).

:::ojo Ojo
Con $D_i<T_i$ la condición $U\le1$ **ya no es suficiente** (hace falta el análisis de demanda de procesador). Y para RM con $D=T$, $U\le1$ no basta: solo si los periodos son armónicos (demostración 6).
:::
@fin

## 4 · Protocolo de techo inmediato (ICPP) {#dem-icpp}

@ejercicio dem-icpp | Con ICPP una tarea se bloquea como mucho una vez, durante una sola sección crítica, y no hay interbloqueos | tema=plan | tipo=demo
@enunciado
Con el protocolo de techo de prioridad inmediato (ICPP): el techo de un recurso es la mayor prioridad de las tareas que lo usan, y quien lo toma pasa a ejecutar a esa prioridad. Demuestra que una tarea $\tau_H$ sufre bloqueo de **como máximo una** sección crítica de una tarea de menor prioridad y que no puede haber interbloqueo.
@antes
**Qué piden.** Que $B_i$ sea el **máximo** de una sola sección crítica (no la suma), y que el protocolo sea seguro.

**Teoría que usas.** Prioridad dinámica por techo, planificación apropiativa por prioridades fijas.
@paso 1. Cuándo se puede bloquear $\tau_H$
Supón que $\tau_H$ está bloqueada porque una tarea de menor prioridad $\tau_L$ tiene un recurso $R$ con $techo(R)\ge P_H$ (si el techo fuera menor, $\tau_L$ no pasaría por encima de $\tau_H$ y no habría bloqueo). Al tomarlo, $\tau_L$ ejecutó a prioridad $techo(R)\ge P_H$.
@paso 2. $\tau_L$ tomó $R$ antes de que llegara $\tau_H$
Si $\tau_L$ hubiera intentado tomar $R$ **después** de la llegada de $\tau_H$, estaría ejecutando mientras $\tau_H$ está lista, lo que solo ocurre si su prioridad es mayor: absurdo, porque $P_L<P_H$. Por tanto $\tau_L$ ya tenía $R$ cuando $\tau_H$ llegó.
@paso 3. Solo una tarea de menor prioridad puede estar dentro de una sección crítica con techo $\ge P_H$
Supón que otra tarea de menor prioridad $\tau'$ tiene otro recurso $R'$ con $techo(R')\ge P_H$ al llegar $\tau_H$. Cuando $\tau_L$ (o $\tau'$) tomó el segundo recurso, estaba ejecutando mientras la otra mantenía el suyo a prioridad $\ge P_H>$ su prioridad base: no habría podido ejecutar. Contradicción. Hay a lo sumo **una** tarea así.
@paso 4. Duración del bloqueo
Una vez $\tau_L$ ejecuta a prioridad $\ge P_H$ nadie de menor prioridad la interrumpe, y $\tau_H$ solo espera a que acabe **esa** sección crítica (no puede empezar otra: para empezar tendría que tomar otro recurso, y el paso 3 lo impide para recursos con techo $\ge P_H$). Por tanto
$$B_H=\max\{c_{k,r}\;:\;k\text{ de menor prioridad},\;techo(r)\ge P_H\}.$$
@paso 5. No hay interbloqueo
Un interbloqueo exige que $\tau_a$, con $R_1$, pida $R_2$ ocupado por $\tau_b$. Dos casos:
- $\tau_b$ tomó $R_2$ **antes** que $\tau_a$ tomara $R_1$. Entonces $\tau_b$ ejecutaba a $techo(R_2)\ge P_a$ (porque $\tau_a$ usa $R_2$), y $\tau_a$ no habría podido ejecutar para tomar $R_1$.
- $\tau_b$ tomó $R_2$ **después**. Entonces $\tau_a$ ejecutaba a $techo(R_1)\ge P_b$ (porque $\tau_b$ usa $R_1$) y $\tau_b$ no habría podido ejecutar.

Ninguno de los dos casos puede darse. En general, con ICPP **nadie ejecuta nunca pidiendo un recurso ocupado**: el bloqueo se produce antes de empezar a ejecutar. Sin espera circular, no hay interbloqueo.
@resultado
El bloqueo máximo que entra en la recurrencia es el de **una** sección crítica (la mayor entre las de menor prioridad con techo $\ge P_i$) y con ICPP no hay inversión de prioridad no acotada ni interbloqueos.

:::ojo Ojo
En el análisis, sumar todas las secciones críticas posibles da una cota **válida pero pesimista** (puede declarar no planificable lo que sí lo es). El valor correcto de $B_i$ es el máximo, como aquí.
:::
@fin

## 5 · Restricciones del ejecutivo cíclico {#dem-frames}

@ejercicio dem-marcos | Por qué $T_s\ge \max C_i$, $T_s\mid H$ y $2T_s-\gcd(T_s,T_i)\le D_i$ | tema=plan | tipo=demo
@enunciado
En un ejecutivo cíclico con marco secundario $T_s$ e hiperperiodo $H=\operatorname{mcm}(T_i)$, demuestra las tres condiciones para que un tamaño de marco sea válido.
@antes
**Qué piden.** Justificar cada restricción con un argumento. La tercera es la que más se olvida en la práctica: el trabajo que llega **justo después** de empezar un marco debe esperar al siguiente.

**Teoría que usas.** Tareas que se ejecutan enteras dentro de un marco (sin apropiación), máximo común divisor.
@paso 1. $T_s\ge\max C_i$
Dentro de un marco las tareas no se interrumpen, así que cada una debe caber **entera** en un marco: $C_i\le T_s$ para toda $i$.
@paso 2. $T_s$ divide al hiperperiodo
El plan se repite cada $H$. Si $T_s\nmid H$ el último marco quedaría cortado y la repetición no sería idéntica; $H=m\,T_s$ con $m$ entero.
@paso 3. Cuándo se libera el trabajo respecto a los marcos
Las liberaciones de $\tau_i$ están en los múltiplos de $T_i$ y los marcos empiezan en múltiplos de $T_s$. La distancia $r-m\,T_s$ entre una liberación y el inicio de marco anterior toma valores **múltiplos de** $g=\gcd(T_s,T_i)$ (todos los que cumplen la identidad de Bézout al recorrer $k$). El valor positivo más pequeño que se alcanza es exactamente $g$.
@paso 4. El peor caso
Una liberación $g$ unidades **después** del inicio de un marco no puede empezar en ese marco (ya empezó) y espera $T_s-g$ hasta el siguiente. Como mucho, la tarea terminará al final de **ese** marco siguiente, $T_s$ más tarde. Instante de fin $\le r+(T_s-g)+T_s=r+2T_s-g$. Para cumplir el plazo,
$$2T_s-\gcd(T_s,T_i)\le D_i.$$
@paso 5. Comprobación numérica
Se recorrieron todos los $T_s\in[1,39]$ y $T_i\in[T_s,119]$ y se calculó la espera máxima hasta el siguiente marco: coincide con $T_s-\gcd(T_s,T_i)$ en **todos** los casos.
@resultado
Las tres restricciones son $T_s\ge\max C_i$, $T_s\mid H$ y $2T_s-\gcd(T_s,T_i)\le D_i$ para toda tarea.
@fin

## 6 · RM con periodos armónicos {#dem-armonicos}

@ejercicio dem-armonicos | Con periodos armónicos, RM planifica si y solo si $U\le1$ | tema=plan | tipo=demo
@enunciado
Si cada periodo es múltiplo del anterior ($T_1\mid T_2\mid\dots\mid T_n$) y $D_i=T_i$, demuestra que RM es planificable exactamente cuando $U\le1$.
@antes
**Qué piden.** Que en el caso armónico la cota $n(2^{1/n}-1)$ se mejora hasta $1$.

**Teoría que usas.** Recurrencia de tiempo de respuesta; si $T_j\mid T_i$, entonces $\lceil T_i/T_j\rceil=T_i/T_j$ exactamente.
@paso 1. Se evalúa $f$ en $R=T_i$
$$f(T_i)=C_i+\sum_{j<i}\frac{T_i}{T_j}C_j=T_i\sum_{j\le i}\frac{C_j}{T_j}=T_i\,U_i,$$
donde $U_i$ es la utilización de las $i$ primeras tareas.
@paso 2. Se compara con el plazo
Si $U\le1$, entonces $U_i\le1$ y $f(T_i)\le T_i$. Por monotonía de $f$ y minimalidad del punto fijo (demostración 2), el menor punto fijo cumple $R_i\le T_i=D_i$. Todas las tareas cumplen el plazo.
@paso 3. Reciprocidad
Si $U>1$ el procesador no puede con la carga (demostración 3, necesidad): no es planificable con ningún algoritmo.
@paso 4. Comprobación
Con 2 000 conjuntos armónicos aleatorios (2 a 5 tareas) la planificabilidad por tiempo de respuesta coincidió siempre con $U\le1$.
@resultado
Con periodos armónicos, RM llega al 100 % de utilización.
@fin

## 7 · Pérdida de actualización {#dem-race}

@ejercicio dem-race | Por qué `++contador` desde dos hilos pierde incrementos, y cuánto puede perder | tema=hilos | tipo=demo
@enunciado
Dos hilos hacen cada uno $n$ veces `++contador` sobre un `int` compartido sin protección. Explica por qué el resultado no es siempre $2n$, da un entrelazado concreto y encuentra el menor valor posible.
@antes
**Qué piden.** Entender que `++x` no es una operación única, sino **leer, sumar y escribir**.

**Teoría que usas.** Condición de carrera, entrelazados de instrucciones, exclusión mutua.
@paso 1. Qué hace `++x`
Tres pasos: `r = x` (leer), `r = r + 1` (sumar, en un registro propio) y `x = r` (escribir). Si dos hilos leen el mismo valor, ambos escriben ese valor + 1 y **un incremento se pierde**.
@paso 2. Entrelazado con $n=1$
| Hilo A | Hilo B | $x$ |
|---|---|---|
| lee 0 | | 0 |
| | lee 0 | 0 |
| escribe 1 | | 1 |
| | escribe 1 | 1 |

Resultado 1 en lugar de 2.
@paso 3. Cota superior
Cada escritura aumenta $x$ en 1 como mucho respecto a lo que su hilo leyó: nunca se supera $2n$. Con exclusión mutua se alcanza siempre.
@paso 4. El peor caso, $n\ge2$: valor 2
A lee 0; B ejecuta $n-1$ incrementos completos ($x=n-1$); A escribe 1; B lee 1; A ejecuta sus $n-1$ incrementos restantes ($x=n$); B escribe 2. Resultado: **2**.
@paso 5. No se puede bajar de 2 (verificación)
Se enumeraron **todos** los entrelazados de las instrucciones leer/escribir para $n=1,2,3,4,5$ y el valor mínimo final es $1,2,2,2,2$. (Prueba general: es un resultado clásico; aquí se verifica por enumeración exhaustiva.)
@paso 6. Solución
Proteger la sección con un `mutex` (`lock_guard`) o usar `atomic<int>`: el incremento deja de poder intercalarse y el resultado es siempre $2n$.
@resultado
Sin protección, el resultado final está entre 2 y $2n$ (para $n\ge2$). Con `mutex` o `atomic`, vale $2n$.
@fin

## 8 · `push_back` en $O(1)$ amortizado {#dem-vector}

@ejercicio dem-vector | Si la capacidad se duplica, $n$ inserciones cuestan menos de $3n$ operaciones | tema=stl | tipo=demo
@enunciado
Un `vector` guarda sus elementos contiguos. Cuando se llena, reserva el doble de espacio y **copia** todos los elementos. Demuestra que $n$ llamadas a `push_back` cuestan $O(n)$ en total (coste amortizado $O(1)$) y compara con crecer una cantidad fija $k$.
@antes
**Qué piden.** Razonar con el **coste total** y no con el peor caso de una sola inserción.

**Teoría que usas.** Serie geométrica $\sum_{i=0}^{m}2^i=2^{m+1}-1$.
@paso 1. Cuántas copias
Las copias ocurren cuando el tamaño llega a $1,2,4,\dots,2^m$ con $2^m<n$ (último crecimiento antes de acabar). Copias totales: $\sum_{i=0}^{m}2^i=2^{m+1}-1<2n$.
@paso 2. Coste total
Cada inserción cuesta 1 (escribir) y las copias suman menos de $2n$: total $<3n$, es decir menos de 3 operaciones por inserción: **amortizado $O(1)$**.
@paso 3. Con factor $f$ general
Las copias son una serie geométrica de razón $f>1$: $<n\,\dfrac{f}{f-1}$. Con $f=2$, $<2n$; con $f=1{,}5$, $<3n$.
@paso 4. Crecer una cantidad fija $k$
Se copian $k,2k,3k,\dots$ elementos: $k\,(1+2+\dots+\tfrac nk)\approx\dfrac{n^2}{2k}$ copias, **$O(n^2)$**: por inserción, $\tfrac{n}{2k}$ en promedio, que crece con $n$.
@paso 5. Comprobación numérica
Contando copias para $n=10^3,10^4,10^5$: con factor 2, entre 1,0 y 1,7 copias por inserción (siempre $<2$); con factor 1,5, de 2,1 a 2,8 ($<3$); con $+10$ fijo, 49,5, 499,5 y 4 999,5 copias por inserción ($=n/(2k)$).
@resultado
Duplicar capacidad hace que `push_back` sea $O(1)$ amortizado. Por eso `reserve` evita copias cuando conoces el tamaño final, pero no cambia la complejidad asintótica.
@fin

## 9 · El error del Patriot {#dem-patriot}

@ejercicio dem-patriot | De 0,1 s truncado a 575 m de error | tema=stl | tipo=demo
@enunciado
El reloj del Patriot contaba décimas de segundo y almacenaba $0{,}1$ con 23 bits fraccionarios truncados. Calcula el error por tic y la deriva tras 100 horas de funcionamiento, y el error de posición de un misil a 1 676 m/s.
@antes
**Qué piden.** Una cuenta con potencias de 2 que explique por qué un error de $10^{-7}$ s acaba siendo un fallo de cientos de metros.

**Teoría que usas.** Representación binaria de fracciones, truncamiento, acumulación de errores.
@paso 1. 0,1 en binario
$0{,}1=0{,}0001100110011\ldots_2$: fracción **periódica infinita** (el bloque $0011$ se repite), como $1/3=0{,}333\ldots$ en base 10. No cabe en un número finito de bits.
@paso 2. Truncar a 23 bits
$0{,}1\cdot2^{23}=838\,860{,}8$. Se guarda la parte entera $838\,860$ y se pierde $0{,}8$ unidades de $2^{-23}$:
$$e=0{,}8\cdot2^{-23}=0{,}1\cdot2^{-20}\approx9{,}537\cdot10^{-8}\text{ s por tic.}$$
@paso 3. Acumulación en 100 h
$100\text{ h}=360\,000\text{ s}=3{,}6\cdot10^{6}$ tics (10 por segundo). Deriva: $3{,}6\cdot10^6\cdot9{,}537\cdot10^{-8}\approx0{,}3433$ s.
@paso 4. En metros
A $1\,676$ m/s: $0{,}3433\cdot1\,676\approx575$ m. El sistema buscaba el misil en el sitio equivocado y lo perdió.
@resultado
Error por tic $9{,}54\cdot10^{-8}$ s; deriva en 100 h $0{,}343$ s; error de posición $\approx575$ m (la bibliografía suele citar 0,34 s y entre 573 y 575 m; la diferencia es solo de redondeo).
@fin
