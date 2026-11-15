@ejercicio ex-feb17-plan | Febrero 2017 · Planificación con techo de prioridad inmediato | tema=plan | tipo=final | exam=febrero2017 | n=0 | curso=2015-16
@enunciado
Un sistema de tiempo real consta de 3 tareas con los siguientes parámetros temporales. Las tareas se ejecutan con planificación con prioridades fijas en plazo y con expulsión, y los accesos a los objetos compartidos se efectúan mediante el protocolo del techo de prioridad inmediato. La duración máxima de las secciones críticas que ejecutan las tareas sobre los objetos compartidos es:

| Tarea | Tipo | T | C | D | Sección crítica sobre M | Sección crítica sobre N |
|---|---|---|---|---|---|---|
| A | Esporádica | 60 | 4 | 20 | — | 2 |
| B | Periódica | 10 | 4 | 10 | 2 | — |
| C | Periódica | 50 | 8 | 50 | 1 | 2 |

Se pide: 1) calcular las prioridades de las tareas y los techos de prioridad de los objetos compartidos; 2) calcular el tiempo de bloqueo máximo de cada tarea; 3) calcular el tiempo de respuesta máximo de todas las tareas y decir si están garantizados los requisitos temporales.
@antes
**Qué piden.** Prioridades (DM), techos, bloqueos y tiempos de respuesta. Es el cálculo completo de T6 en tres tablas.

**Teoría que usas.** Deadline Monotonic; techo = máxima prioridad de las tareas que usan el recurso; $B_i$ = máxima sección crítica de tareas de **menor** prioridad sobre recursos con techo **≥** $P_i$; recurrencia del tiempo de respuesta.
@paso 1. Prioridades (DM)
Menor plazo ⇒ mayor prioridad. Plazos: B = 10, A = 20, C = 50. Con mayor número = mayor prioridad: $P_B = 3,\ P_A = 2,\ P_C = 1$.
@paso 2. Techos de prioridad
- M lo usan B y C ⇒ techo$(M) = \max(P_B, P_C) = 3$.
- N lo usan A y C ⇒ techo$(N) = \max(P_A, P_C) = 2$.
@paso 3. Bloqueos
Solo cuentan las secciones críticas de tareas de **menor** prioridad sobre recursos cuyo techo sea **≥ P** de la tarea que se bloquea.
- **C** (la de menor prioridad): $B_C = 0$.
- **A** ($P=2$): las de menor prioridad es C. Usa M (techo 3 ≥ 2, dura 1) y N (techo 2 ≥ 2, dura 2). $B_A = \max(1, 2) = 2$.
- **B** ($P=3$): las de menor prioridad son A y C. De A: N tiene techo 2 < 3, **no cuenta**. De C: M tiene techo 3 ≥ 3 (dura 1); N tiene techo 2 < 3, no cuenta. $B_B = 1$.
@paso 4. Tiempos de respuesta
$R_i = C_i + B_i + \sum_{j \in hp(i)} \lceil R_i / T_j \rceil C_j$.
- **B** (la más prioritaria): $R_B = 4 + 1 = 5 \le 10$. Cumple.
- **A**: $R^{(0)} = 4+2 = 6$; $R^{(1)} = 4+2+\lceil 6/10 \rceil \cdot 4 = 10$; $R^{(2)} = 4+2+\lceil 10/10 \rceil \cdot 4 = 10$. $R_A = 10 \le 20$. Cumple.
- **C**: $R^{(0)} = 8$; $R^{(1)} = 8 + \lceil 8/60 \rceil 4 + \lceil 8/10 \rceil 4 = 16$; $R^{(2)} = 8 + \lceil 16/60 \rceil 4 + \lceil 16/10 \rceil 4 = 8+4+8 = 20$; $R^{(3)} = 8 + \lceil 20/60 \rceil 4 + \lceil 20/10 \rceil 4 = 20$. $R_C = 20 \le 50$. Cumple.

[[sim:rta:feb17]]
@paso 5. Comprobación con código
Se ha verificado con un script (prioridades, techos, bloqueos y la recurrencia): los valores coinciden. El simulador de arriba usa los mismos datos (la columna B contiene los bloqueos).
@resultado
| Tarea | Prioridad | Bloqueo B | Respuesta R | Plazo D | ¿Cumple? |
|---|---|---|---|---|---|
| B | 3 | 1 | 5 | 10 | Sí |
| A | 2 | 2 | 10 | 20 | Sí |
| C | 1 | 0 | 20 | 50 | Sí |

Techos: M = 3, N = 2. **El sistema está garantizado.**
@ojo
La solución de referencia calcula $B_B = 2$ (toma también la sección crítica sobre N). Pero el techo de N es 2 y la prioridad de B es 3: con el techo de prioridad inmediato, B **no** se bloquea por N. El valor correcto es $B_B = 1$, y por tanto $R_B = 5$ (no 6). La conclusión (planificable) no cambia, pero el valor sí.
@fin

@ejercicio ex-jun16-plan | Junio 2016 · Planificación con 4 tareas y dos recursos | tema=plan | tipo=final | exam=junio2016 | n=0 | curso=2015-16
@enunciado
Un sistema de tiempo real consta de 4 tareas con los siguientes parámetros temporales. Las tareas se ejecutan con planificación con prioridades fijas y expulsión, y los accesos a los objetos compartidos se efectúan mediante el protocolo del techo de prioridad inmediato. La duración máxima de las secciones críticas es:

| Tarea | Tipo | T | C | D | Sección crítica sobre M | Sección crítica sobre N |
|---|---|---|---|---|---|---|
| A | Esporádica | 100 | 4 | 15 | 1 | — |
| B | Periódica | 10 | 4 | 10 | 2 | 1 |
| C | Periódica | 50 | 8 | 50 | — | 2 |
| D | Esporádica | 40 | 6 | 25 | — | — |

Se pide: a) prioridades y techos; b) bloqueo máximo de cada tarea; c) tiempo de respuesta máximo de todas las tareas y si están garantizados los requisitos temporales.
@antes
**Qué piden.** Lo mismo que el ejercicio anterior con una tarea más (D) que **no usa recursos**. El matiz: D también se bloquea (por C) aunque no use nada.

**Teoría que usas.** DM, techos, bloqueo ICPP, recurrencia.
@paso 1. Prioridades (DM)
Plazos: B = 10, A = 15, D = 25, C = 50. Prioridades: $P_B = 4,\ P_A = 3,\ P_D = 2,\ P_C = 1$.
@paso 2. Techos
- M: usan A y B ⇒ techo $= \max(3, 4) = 4$.
- N: usan B y C ⇒ techo $= \max(4, 1) = 4$.
@paso 3. Bloqueos
- **B** ($P=4$): tareas de menor prioridad: A (M, 1; techo 4 ≥ 4 ✓), C (N, 2; techo 4 ≥ 4 ✓). $B_B = \max(1, 2) = 2$.
- **A** ($P=3$): menores: D (nada) y C (N, 2; techo 4 ≥ 3 ✓). $B_A = 2$.
- **D** ($P=2$): menor: C (N, 2; techo 4 ≥ 2 ✓). $B_D = 2$. Aunque D no use recursos, C puede estar en la sección crítica de N **con prioridad 4** (el techo) cuando D llega, y D tiene que esperar.
- **C**: $B_C = 0$.
@paso 4. Tiempos de respuesta
- **B**: $R = 4 + 2 = 6 \le 10$.
- **A**: $R^{(0)} = 4+2 = 6$; $R^{(1)} = 6 + \lceil 6/10 \rceil \cdot 4 = 10$; $R^{(2)} = 6 + \lceil 10/10 \rceil \cdot 4 = 10$. $R_A = 10 \le 15$.
- **D**: $R^{(0)} = 6 + 2 = 8$; $R^{(1)} = 8 + \lceil 8/10 \rceil 4 + \lceil 8/100 \rceil 4 = 16$; $R^{(2)} = 8 + \lceil 16/10 \rceil 4 + \lceil 16/100 \rceil 4 = 8+8+4 = 20$; $R^{(3)} = 8 + \lceil 20/10 \rceil 4 + 4 = 20$. $R_D = 20 \le 25$.
- **C**: $R^{(0)} = 8$; $R^{(1)} = 8 + 4 + 4 + 6 = 22$ (cada $\lceil 8/T \rceil = 1$ para $T = 10, 100, 40$); $R^{(2)} = 8 + \lceil 22/10 \rceil 4 + \lceil 22/100 \rceil 4 + \lceil 22/40 \rceil 6 = 8+12+4+6 = 30$; $R^{(3)} = 8 + \lceil 30/10 \rceil 4 + 4 + \lceil 30/40 \rceil 6 = 8+12+4+6 = 30$. $R_C = 30 \le 50$.

[[sim:rta:jun16]]
@resultado
| Tarea | Prioridad | B | R | D | ¿Cumple? |
|---|---|---|---|---|---|
| B | 4 | 2 | 6 | 10 | Sí |
| A | 3 | 2 | 10 | 15 | Sí |
| D | 2 | 2 | 20 | 25 | Sí |
| C | 1 | 0 | 30 | 50 | Sí |

Techos: M = 4, N = 4. **El sistema está garantizado.** Utilización $U = 0{,}75$.
@fin

@ejercicio ex-sep16-plan | Septiembre 2016 · Planificación: un sistema que NO es planificable | tema=plan | tipo=final | exam=septiembre2016 | n=0 | curso=2015-16
@enunciado
Un sistema de tiempo real tiene 3 tareas y 2 objetos compartidos, O1 y O2. La tabla contiene los atributos temporales de las tareas, incluidos los tiempos de ejecución de las operaciones protegidas que ejecutan:

| Tarea | Tipo | T | C | D | Sección crítica sobre O1 | Sección crítica sobre O2 |
|---|---|---|---|---|---|---|
| T_C | Periódica | 120 | 12 | 120 | 2 | 3 |
| T_B | Esporádica | 500 | 8 | 25 | 3 | 1 |
| T_A | Periódica | 20 | 10 | 20 | 4 | — |

El método de planificación es de prioridades fijas con expulsión, monotónicas en plazo, y el acceso a los objetos protegidos se realiza mediante el techo de prioridad inmediato. Se pide: 1) asignar prioridades y calcular los techos de los objetos; 2) calcular los bloqueos máximos; 3) calcular los tiempos de respuesta en el peor caso y decir si el sistema está garantizado.
@antes
**Qué piden.** El mismo procedimiento. La novedad: aquí **sí hay una tarea que falla**, y hay que reconocerlo en la iteración (el valor supera el plazo).
@paso 1. Prioridades y techos
Plazos: T_A = 20, T_B = 25, T_C = 120. $P_A = 3,\ P_B = 2,\ P_C = 1$.
- O1: lo usan las tres ⇒ techo $= 3$.
- O2: lo usan T_B y T_C ⇒ techo $= \max(2, 1) = 2$.
@paso 2. Bloqueos
- **T_A** ($P=3$): menores T_B (O1: 3, techo 3 ≥ 3 ✓; O2: techo 2 < 3 ✗) y T_C (O1: 2 ✓; O2 ✗). $B_A = \max(3, 2) = 3$.
- **T_B** ($P=2$): menor T_C (O1: 2, techo 3 ≥ 2 ✓; O2: 3, techo 2 ≥ 2 ✓). $B_B = \max(2, 3) = 3$.
- **T_C**: $B_C = 0$.
@paso 3. Tiempos de respuesta
- **T_A**: $R = 10 + 3 = 13 \le 20$. Cumple.
- **T_B**: $R^{(0)} = 8 + 3 = 11$; $R^{(1)} = 11 + \lceil 11/20 \rceil \cdot 10 = 21$; $R^{(2)} = 11 + \lceil 21/20 \rceil \cdot 10 = 31 > 25$. **No cumple**: llega otra activación de T_A mientras T_B espera.
- **T_C**: $R^{(0)} = 12$; $R^{(1)} = 12 + \lceil 12/20 \rceil 10 + \lceil 12/500 \rceil 8 = 30$; $R^{(2)} = 12 + \lceil 30/20 \rceil 10 + 8 = 40$; $R^{(3)} = 12 + \lceil 40/20 \rceil 10 + 8 = 40$. $R_C = 40 \le 120$.

[[sim:rta:sep16]]
@resultado
| Tarea | Prioridad | B | R | D | ¿Cumple? |
|---|---|---|---|---|---|
| T_A | 3 | 3 | 13 | 20 | Sí |
| T_B | 2 | 3 | 31 | 25 | **No** |
| T_C | 1 | 0 | 40 | 120 | Sí |

**El sistema no está garantizado**: T_B puede incumplir su plazo (31 > 25) aunque la utilización total sea baja ($U = 0{,}616$). Es el ejemplo de por qué la utilización no basta con plazos más cortos que el periodo.
@fin

@ejercicio ex-sep16-ciclico | Septiembre 2016 · Ejecutivo cíclico: ciclo secundario y código | tema=plan | tipo=final | exam=septiembre2016 | n=0 | curso=2015-16
@enunciado
Describa qué se entiende por «ejecutivo cíclico», cuáles son sus ventajas y desventajas y escriba el código necesario para crear un ejecutivo cíclico para el siguiente conjunto de tareas. Suponga que el código que deben ejecutar las tareas está definido en las funciones `void f_a()`, `void f_b()` y `void f_c()`.

| Tarea | Tipo | T (ms) | C (ms) |
|---|---|---|---|
| T_C | Periódica | 120 | 12 |
| T_B | Periódica | 80 | 8 |
| T_A | Periódica | 40 | 10 |
@antes
**Qué piden.** Diseñar el plan: hiperperiodo, ciclo secundario y qué tareas van en cada ciclo; escribir el bucle con `sleep_until`.

**Teoría que usas.** Ejecutivo cíclico (T6): $T_M = \mathrm{mcm}(T_i)$; $T_S$ divide a $T_M$, $T_S \ge \max C_i$ y $2T_S - \gcd(T_S, T_i) \le D_i$ (con $D_i = T_i$).
@paso 1. Utilización y hiperperiodo
$U = 10/40 + 8/80 + 12/120 = 0{,}25 + 0{,}10 + 0{,}10 = 0{,}45$, menor que la cota $3(2^{1/3}-1) = 0{,}78$, así que hay holgura. $T_M = \mathrm{mcm}(40, 80, 120) = 240$ ms.
@paso 2. Elección del ciclo secundario
Divisores de 240 con $T_S \ge 12$ (el mayor $C$): 12, 15, 16, 20, 24, 30, 40, 48, 60, 80, 120, 240. Se comprueba $2T_S - \gcd(T_S, T_i) \le T_i$ para $T_i = 40, 80, 120$: cumplen **12, 15, 16, 20, 24 y 40**. Con $T_S = 30$ falla ($60 - 10 = 50 > 40$); con 48, 60, 80… también. Se elige **$T_S = 40$ ms** (el mayor válido: menos ciclos, y coincide con el menor periodo, así que $T_A$ ocurre en cada ciclo).

[[sim:frames]]
@paso 3. Qué va en cada ciclo
$T_M / T_S = 6$ ciclos. A (T=40) en todos; B (T=80) en los pares; C (T=120) cada 3 ciclos (0 y 3).

| Ciclo | 0 | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| Tareas | A, B, C | A | A, B | A, C | A, B | A |
| Tiempo usado (ms) | 30 | 10 | 18 | 22 | 18 | 10 |

Ningún ciclo supera 40 ms.
@paso 4. Código
@include cpp code/t6/ciclico.cpp
@paso 5. Ventajas e inconvenientes (parte de desarrollo)
- **Ventajas:** comportamiento totalmente predecible; no necesita planificador ni sincronización entre tareas (se ejecutan en secuencia); fácil de verificar.
- **Inconvenientes:** poco flexible (cambiar una tarea obliga a rehacer el plan); el hiperperiodo puede ser enorme; difícil con tareas esporádicas y con $C$ mayores que el ciclo secundario (hay que trocear).
@resultado
$T_M = 240$ ms, $T_S = 40$ ms (también valen 12, 15, 16, 20 y 24), 6 ciclos con el reparto de la tabla, y el bucle con `sleep_until` del código.
@ojo
La solución de referencia enumera como posibles ciclos secundarios `{120, 80, 60, 48, 40, …}`. Salvo 40, **ninguno cumple** el criterio que ella misma enuncia ($T_S \le \min T_i = 40$), ni la condición $2T_S - \gcd(T_S, T_i) \le T_i$: con $T_S = 120$, por ejemplo, $240 - 40 = 200 > 40$. El plan que propone (6 ciclos de 40 ms) sí es correcto.
@fin
