## Qué hay que decidir: quién ejecuta y cuándo {#t6-que}

Con una sola CPU y varias tareas con plazos, hace falta una **política de planificación**. Después hay que **demostrar** (no probar) que todas cumplen sus plazos incluso en el peor caso. Hay dos familias:

- **Planificación estática** (ejecutivo cíclico): el plan se calcula **antes** de ejecutar y se repite.
- **Planificación por prioridades con expulsión**: cada tarea tiene una prioridad; si llega una más prioritaria, **expulsa** a la que está ejecutando.

Notación (la misma de T0): cada tarea $i$ tiene cómputo $C_i$, periodo $T_i$ y plazo $D_i \le T_i$.

## Ejecutivo cíclico {#t6-ciclico}

Si todas las tareas son periódicas, el comportamiento se repite cada **ciclo principal** $T_M = \mathrm{mcm}(T_i)$ (el **hiperperiodo**). Se divide en **ciclos secundarios** de duración $T_S$ y en cada uno se ejecutan unas tareas, sin interrupciones. Entre ciclos se espera con `sleep_until`.

[[fig:cyc]]

Condiciones para elegir $T_S$:

1. $T_S$ **divide** a $T_M$ (el ciclo principal es un número entero de secundarios).
2. $T_S \ge \max C_i$ (así ninguna tarea se parte; si no, hay que trocear tareas).
3. Para cada tarea, entre su activación y su plazo debe caber un ciclo secundario completo: $2T_S - \gcd(T_S, T_i) \le D_i$.

[[sim:frames]]

El código es un bucle con `switch (ciclo)` y `sleep_until`:

```cpp
auto siguiente = steady_clock::now() + ts;
int ciclo = 0;
while (true) {
    switch (ciclo) {                      // plan estático del ciclo principal
        case 0: A(); B(); C(); break;
        case 1: A(); break;
        /* ... */
    }
    ciclo = (ciclo + 1) % N_CICLOS;
    this_thread::sleep_until(siguiente);   // instante absoluto: sin deriva
    siguiente += ts;
}
```

Ventajas: simple y predecible. Inconvenientes: rígido, difícil con tareas esporádicas y con periodos «incómodos» (hiperperiodo enorme).

## Prioridades fijas: RM y DM {#t6-rmdm}

- **RM (Rate Monotonic):** menor **periodo** ⇒ mayor prioridad. Óptimo cuando $D_i = T_i$.
- **DM (Deadline Monotonic):** menor **plazo** ⇒ mayor prioridad. Óptimo cuando $D_i \le T_i$ (incluye RM).

Dos formas de comprobar la planificabilidad:

**1. Condición suficiente (rápida, pero pesimista).** Para $n$ tareas con $D=T$ (Liu y Layland):

$$U = \sum_{i=1}^{n} \frac{C_i}{T_i} \le n\left(2^{1/n} - 1\right)$$

La cota baja de 1 (n=1) a $\ln 2 \approx 0{,}693$ cuando $n \to \infty$. Si $U$ la cumple, el conjunto es planificable. Si no, **no se puede concluir** nada.

**2. Tiempo de respuesta (exacta).** El tiempo de respuesta $R_i$ es el máximo desde que $i$ se activa hasta que termina. Se calcula iterando:

$$R_i^{(0)} = C_i + B_i,\qquad R_i^{(k+1)} = C_i + B_i + \sum_{j \in hp(i)} \left\lceil \frac{R_i^{(k)}}{T_j} \right\rceil C_j$$

hasta que $R_i^{(k+1)} = R_i^{(k)}$ (converge) o se pasa de $D_i$ (no planificable). $hp(i)$ son las tareas de **mayor prioridad** y $B_i$ es el **bloqueo** (más abajo, vale 0 sin recursos compartidos). La tarea cumple si $R_i \le D_i$.

:::tip Intuición
El tiempo de respuesta es «mi trabajo + el trabajo de los más prioritarios que llegan mientras espero». Cada vez que sumo trabajo ajeno, tardo más, y puede entrar **otra** activación de una tarea más prioritaria. La iteración busca el punto fijo.
:::

Ejemplo: $(C,T)=(3,7),(3,12),(5,20)$ con $D=T$. Es $U = 0{,}929 > 0{,}780$, así que la cota no sirve, pero el tiempo de respuesta sí concluye:

| Tarea | Iteraciones de $R$ | $R$ | $D$ | ¿Cumple? |
|---|---|---|---|---|
| A (3,7) | 3 | 3 | 7 | Sí |
| B (3,12) | 3 → 6 → 6 | 6 | 12 | Sí |
| C (5,20) | 5 → 11 → 14 → 17 → 20 → 20 | 20 | 20 | Sí (justo) |

[[sim:rta:burns]]

[[fig:gantt_rm]]

## Recursos compartidos: inversión de prioridad {#t6-inversion}

Una tarea baja (L) toma un `mutex`. Llega una alta (H) que lo necesita: se **bloquea**. Hasta aquí, normal. Pero si ahora llega una **media** (M) que no usa el recurso, M expulsa a L (tiene más prioridad que L) y H sigue esperando **a M**, que tiene menos prioridad que H. Eso es la **inversión de prioridad**: la espera de H no está acotada por la sección crítica de L, sino por todo lo que haga M.

[[fig:inversion]]

[[sim:inv]]

Dos protocolos que la resuelven:

| Protocolo | Regla | Bloqueo |
|---|---|---|
| **Herencia de prioridad** | Si H se bloquea por L, L **hereda** la prioridad de H mientras tenga el recurso | Puede haber bloqueo en cadena; interbloqueo posible |
| **Techo de prioridad inmediato** (ICPP) | Cada recurso tiene un **techo** = prioridad máxima de las tareas que lo usan. Al **tomar** el recurso, la tarea sube a ese techo | Una tarea se bloquea **como mucho una vez** y como mucho una sección crítica; sin interbloqueos |

### Cálculo con ICPP

1. **Prioridades** (DM o RM).
2. **Techo** de cada recurso: máximo de las prioridades de las tareas que lo usan.
3. **Bloqueo** de la tarea $i$:

$$B_i = \max \{\, c_{k,r} \;:\; k \text{ de menor prioridad que } i,\ r \text{ con techo}(r) \ge P_i \,\}$$

donde $c_{k,r}$ es la duración máxima de la sección crítica de $k$ sobre $r$. La tarea de **menor** prioridad tiene $B=0$ y nunca se bloquea por una de **menor** prioridad.

4. **Tiempo de respuesta** con $B_i$ en la recurrencia.

:::warn Qué suele fallar
- Tomar secciones críticas de tareas de **mayor o igual** prioridad en $B_i$: solo cuentan las de **menor** prioridad.
- Incluir recursos cuyo **techo es menor** que la prioridad de la tarea: no la bloquean (el techo es lo que lo decide, no quién usa el recurso).
- Olvidar que el plazo de una tarea esporádica es $D$ y su periodo mínimo $T$: se analiza igual, con $T$ como separación mínima.
- Parar la iteración en la primera vuelta: hay que repetir hasta que el valor **no cambie**.
- Mezclar «prioridad más alta» con «número más grande»: fija la convención (aquí, mayor número = mayor prioridad).
:::

## EDF y utilización {#t6-edf}

**EDF (Earliest Deadline First)** da la prioridad a la tarea cuyo plazo absoluto es más próximo. Con $D=T$ y una CPU, el conjunto es planificable si y solo si $U \le 1$ (Liu y Layland, 1973). Es más eficiente que RM, pero las prioridades cambian en tiempo de ejecución y el análisis con recursos es más complejo.

:::deep Más a fondo
**La cota $n(2^{1/n}-1)$** sale de buscar el peor reparto de periodos para el que RM aún funciona: para $n=2$ es $0{,}828$, para $n=3$ es $0{,}780$. Es solo suficiente: el conjunto $(3,7),(3,12),(5,20)$ tiene $U=0{,}929$ y es planificable. Referencias: C. L. Liu y J. W. Layland, «Scheduling Algorithms for Multiprogramming in a Hard-Real-Time Environment», *J. ACM*, 1973; A. Burns y A. Wellings, *Real-Time Systems and Programming Languages*.
:::

:::formula Planificación: fórmulas clave
- Utilización: $U = \sum C_i/T_i$.
- Cota RM (D=T): $U \le n(2^{1/n}-1)$ — $n=1{:}\,1$; $n=2{:}\,0{,}828$; $n=3{:}\,0{,}780$.
- EDF (D=T): $U \le 1$.
- Hiperperiodo: $T_M = \mathrm{mcm}(T_i)$.
- Ciclo secundario: $T_S \mid T_M$, $T_S \ge \max C_i$, $2T_S - \gcd(T_S,T_i) \le D_i$.
- Tiempo de respuesta: $R_i = C_i + B_i + \sum_{j\in hp(i)} \lceil R_i/T_j \rceil C_j$.
- ICPP: techo$(r) = \max P_k$ de quienes usan $r$; $B_i = \max c_{k,r}$ con $P_k<P_i$ y techo$(r)\ge P_i$.
:::

@gl Hiperperiodo | Mínimo común múltiplo de los periodos; el plan se repite cada hiperperiodo.
@gl Rate Monotonic (RM) | Prioridad fija: a menor periodo, mayor prioridad.
@gl Deadline Monotonic (DM) | Prioridad fija: a menor plazo, mayor prioridad.
@gl Tiempo de respuesta | Tiempo máximo desde la activación de una tarea hasta que termina.
@gl Bloqueo (B) | Tiempo máximo que una tarea espera por una tarea de menor prioridad que usa un recurso.
@gl Inversión de prioridad | Una tarea de alta prioridad espera a una de baja que a su vez es retrasada por una de prioridad media.
@gl Herencia de prioridad | Quien tiene el recurso hereda la prioridad del más prioritario que espera por él.
@gl Techo de prioridad inmediato | Al tomar un recurso la tarea sube a su techo (prioridad máxima de sus usuarios).
@quiz En RM, ¿qué tarea tiene la mayor prioridad? | La de mayor cómputo | La de menor periodo | La de mayor plazo | La de mayor utilización | 2 | Rate Monotonic: tasa más alta (periodo más pequeño), prioridad más alta.
@quiz Si $U$ supera la cota de Liu y Layland, el sistema… | No es planificable | Puede serlo o no: hay que calcular el tiempo de respuesta | Es planificable con EDF siempre | Es de tiempo real blando | 2 | La cota es solo condición suficiente.
@quiz Tareas (C,T): (1,4) y (2,6), D=T. ¿Cuál es $R$ de la segunda con RM? | 2 | 3 | 4 | 6 | 2 | R = 2 + ⌈R/4⌉·1: 2→3→3 (⌈3/4⌉=1).
@quiz Con ICPP, ¿cuántas veces se bloquea como máximo una tarea por activación? | Una vez | Tantas como recursos use | Indefinidas | Dos | 1 | Como mucho una vez y una sección crítica; además, no hay interbloqueo.
@card Recurrencia del tiempo de respuesta | R = C + B + Σ ⌈R/Tj⌉·Cj sobre las tareas más prioritarias; iterar hasta punto fijo.
@card Bloqueo con ICPP | B_i = máx. sección crítica de tareas de menor prioridad sobre recursos con techo ≥ P_i.
@card Condición del ciclo secundario | Ts divide a Tm, Ts ≥ máx C, 2Ts − mcd(Ts,Ti) ≤ Di.
