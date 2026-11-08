Tres simulacros para practicar con reloj. Cada uno imita el examen: **2 h 30 min**, parte de programación orientada a objetos (≈ 70 %) y parte de concurrencia (≈ 30 %); el tercero es de planificación. Hazlos **sin mirar** las soluciones: cada paso está plegado, y el resultado final también. Escribe el código a mano o en un editor sin ayuda, y compílalo con `g++ -std=c++17 -Wall -Wextra -pthread`.

:::tip Cómo usarlos
1. Pon un temporizador de 75 minutos por ejercicio (150 min para el simulacro completo).
2. Si el programa **no compila**, la nota de ese ejercicio se divide por 2 en el examen reciente: compila siempre antes de dar por bueno.
3. Al terminar, abre los pasos y compara. Anota qué te ha fallado en la lista de «Qué suele fallar» del tema.
:::

## Modo examen con reloj {#modo-examen}

Elige un examen real de los resueltos en la guía, pulsa **Empezar** y trabaja con el reloj en marcha (2 h 30 min). El enunciado se abre en otra pestaña y **las soluciones no aparecen hasta que entregas**. Al terminar te autoevalúas con una rúbrica (70 % programación orientada a objetos, 30 % concurrencia) y la herramienta calcula una nota estimada, dividiendo por 2 el ejercicio que no compile. Tus últimos intentos se guardan en este navegador.

[[sim:examen]]

## Revisor de código {#revisor}

Pega tu solución (se revisa mientras escribes): el revisor busca los fallos que más se repiten en los exámenes (falta de `override`, destructor no virtual, `if` en lugar de `while` en una espera, `wait` sin predicado, `lock_guard` con `wait`, falta de `ref()` al crear el hilo, hilos sin `join`, `operator<<` sin `friend`, consultas sin `const`, `#include` que faltan, `;` después de la clase…). Es una revisión por patrones: **no sustituye al compilador**, pero te avisa antes de entregar.

[[sim:revisor]]

## Simulacro 1 · Biblioteca y parking {#sim1}

@ejercicio sim1-ej1 | Simulacro 1 · Ejercicio 1: préstamos de una biblioteca (POO, 70 %) | tema=herencia | tipo=simulacro
@enunciado
Una biblioteca presta **libros** y **DVD**. Todo elemento tiene título y año, un número de días de préstamo y una multa por día de retraso.

1. Diseña una clase base abstracta `Item` con título, año, `dias_prestamo()` y `multa_por_dia()` (virtuales puros). Los libros (14 días, 0,50 €/día) guardan además las páginas; los DVD (7 días, 1 €/día), los minutos.
2. Sobrecarga `operator<<` para que todo elemento se imprima con su título, año y días, y cada hija añada sus datos **sin repetir** el código de la base.
3. Diseña `Biblioteca`, que guarda los elementos en un `vector` con punteros inteligentes y permite: añadir; calcular la multa de un título por unos días de retraso; devolver el elemento de mayor multa diaria; contar cuántos hay de un tipo (con `typeid`) y eliminar un título.
4. Escribe un `main` que pruebe todo.
@antes
**Qué piden.** Herencia con clase abstracta, polimorfismo (colección de punteros a la base), `operator<<` con gancho virtual, y algoritmos STL con lambdas.

**Teoría que usas.** T3: clase abstracta, destructor virtual, `override`, `unique_ptr` en `vector`, `max_element`, `remove_if` + `erase`, `typeid`.
@paso 1. La base abstracta
El destructor es **virtual** (se borran objetos hijos a través de la base). Los métodos de política son virtuales puros. `operator<<` es `friend` y delega en un método **protegido virtual** `imprimir`, que las hijas reutilizan llamando a `Item::imprimir`.

@include cpp code/simulacros/s1_biblioteca.cpp 9-24
@paso 2. Libro y DVD
Cada una implementa los dos métodos y amplía `imprimir`. Usa `override` para que el compilador te avise si te equivocas en la firma.

@include cpp code/simulacros/s1_biblioteca.cpp 26-46
@paso 3. Biblioteca
- `find_if` con lambda para localizar un título (si no hay, o los días no son positivos, la multa es 0).
- `max_element` con comparador sobre `multa_por_dia()`.
- `typeid(*p) == t` compara el **tipo dinámico**; `typeid(p)` sería el del puntero.
- `remove_if` mueve los elementos que se mantienen al principio; `erase` borra la cola. Con `unique_ptr`, la memoria se libera sola.

@include cpp code/simulacros/s1_biblioteca.cpp 48-76
@paso 4. `main`
@include cpp code/simulacros/s1_biblioteca.cpp 78-90
@paso 5. Lista de comprobación
- ¿Compila sin avisos? ¿Destructor virtual? ¿`override` en las hijas?
- ¿`vector<unique_ptr<Item>>` y `move` al añadir (no se puede copiar un `unique_ptr`)?
- ¿`typeid(*p)` y no `typeid(p)`?
@resultado
@out code/out/s1_biblioteca.cpp.txt
@fin

@ejercicio sim1-ej2 | Simulacro 1 · Ejercicio 2: parking con plazas limitadas (concurrencia, 30 %) | tema=monitor | tipo=simulacro
@enunciado
Un parking tiene `n` plazas. Los coches (hilos) llaman a `entrar()`, que **espera** si no hay plaza libre, y a `salir()`. Cuando el parking **cierra**, ningún coche que espere puede quedarse bloqueado: `entrar()` devuelve `false`. Implementa el monitor `Parking` y un `main` con 6 coches y 2 plazas que compruebe que nunca hay más de 2 coches dentro.
@antes
**Qué piden.** Un monitor con `mutex` y `condition_variable`, una condición de espera con predicado y una condición de cierre.

**Teoría que usas.** T5: monitor, `unique_lock`, `wait` con predicado, `notify_one` / `notify_all`, bandera de cierre.
@paso 1. Estado
`libres_` (plazas libres), `cerrado_`, `ocupadas_max_` (para comprobar la invariante) y el `mutex`.
@paso 2. `entrar` y `salir`
`entrar` espera con el predicado `libres_ > 0 || cerrado_`; si se despertó por el cierre, devuelve `false` **sin tomar plaza**. `salir` incrementa bajo el `mutex` y avisa **a uno** (hay un solo hueco). `cerrar` activa la bandera y avisa a **todos**.

@include cpp code/simulacros/s1_parking.cpp 12-39
@paso 3. `main`
@include cpp code/simulacros/s1_parking.cpp 41-54
@paso 4. Por qué es correcto
- Toda lectura/escritura de `libres_` y `cerrado_` se hace con el `mutex` tomado.
- El predicado se vuelve a comprobar tras despertar: un coche que llega de fuera puede quitarte el hueco antes de que reacciones.
- `notify_all` en `cerrar()` + condición `|| cerrado_`: ningún hilo queda dormido para siempre.
@resultado
@out code/out/s1_parking.cpp.txt
@fin

## Simulacro 2 · Matriz y tarea periódica {#sim2}

@ejercicio sim2-ej1 | Simulacro 2 · Ejercicio 1: clase `Matriz` con memoria dinámica (POO, 70 %) | tema=clases | tipo=simulacro
@enunciado
Diseña una clase `Matriz` de números reales que gestione su propia memoria (`double*`) con:

1. Constructor `(filas, columnas)` con ceros, y acceso `m(i, j)` (versiones modificable y `const`).
2. Regla de los cinco: destructor, constructor de copia (copia **profunda**), constructor de movimiento y asignación con **copy-and-swap**.
3. `operator+`, `operator*` (producto), `traspuesta()` y `operator<<`. Dimensiones incompatibles → excepción.
4. Un `main` que construya $A=\begin{pmatrix}1&2&3\\4&5&6\end{pmatrix}$, calcule $A\,A^T$, demuestre que la copia es independiente y capture un error.
@antes
**Qué piden.** Una clase con recursos propios: si no escribes la copia profunda, dos matrices compartirían el mismo `double*` y se borrarían dos veces.

**Teoría que usas.** T2: reglas de 0/3/5, copy-and-swap, `friend swap`, `noexcept`, `operator()`, excepciones.
@paso 1. Memoria y regla de los cinco
- Constructor: `new double[n]{}` (inicializa a 0).
- Copia: reserva nueva y `copy`.
- Movimiento: roba el puntero y deja el origen **vacío** (`nullptr`, 0×0), para que su destructor no borre lo robado.
- Asignación por **valor** + `swap`: gestiona a la vez la copia y la asignación a uno mismo, y es segura ante excepciones.

@include cpp code/simulacros/s2_matriz.cpp 7-20
@paso 2. Operaciones
La suma exige mismas dimensiones; el producto, columnas de la izquierda = filas de la derecha. Se acumula en `r(i,j)` (la matriz resultado empieza en 0).

@include cpp code/simulacros/s2_matriz.cpp 21-45
@paso 3. `main`
@include cpp code/simulacros/s2_matriz.cpp 47-59
@paso 4. Comprobación
$A\,A^T=\begin{pmatrix}1+4+9&4+10+18\\4+10+18&16+25+36\end{pmatrix}=\begin{pmatrix}14&32\\32&77\end{pmatrix}$: coincide con la salida. $A\cdot A$ es $2\times3$ por $2\times3$: error de dimensiones.
@resultado
@out code/out/s2_matriz.cpp.txt
@fin

@ejercicio sim2-ej2 | Simulacro 2 · Ejercicio 2: tarea periódica y contador compartido (concurrencia, 30 %) | tema=hilos | tipo=simulacro
@enunciado
1. Escribe un hilo que ejecute 5 veces una tarea cada 20 ms **sin acumular deriva** (usa `sleep_until`) y cuenta cuántas veces se ejecutó. Comprueba que la duración total es de unos 100 ms.
2. Lanza 4 hilos que incrementen 1 000 veces un contador compartido y comprueba que el resultado es 4 000. Usa el mecanismo mínimo adecuado.
@antes
**Qué piden.** Diferenciar `sleep_for` (deriva) de `sleep_until` (sin deriva) y proteger un contador con `atomic`.

**Teoría que usas.** T4: `sleep_until`, `steady_clock`, `atomic`, `join`.
@paso 1. Tarea periódica
El instante siguiente se calcula **sumando el periodo al instante teórico anterior**, no a `now()`. Con `sleep_for(20ms)` cada vuelta duraría 20 ms **más** lo que tardara el trabajo, y el error se acumularía.

@include cpp code/simulacros/s2_periodico.cpp 9-24
@paso 2. Contador compartido
`atomic<int>` basta: la operación es un incremento simple. Un `mutex` también valdría, pero es más pesado. Sin protección, el resultado sería menor que 4 000 (demostración de «Pérdida de actualización»).

@include cpp code/simulacros/s2_periodico.cpp 26-33
@resultado
@out code/out/s2_periodico.cpp.txt
@fin

## Simulacro 3 · Planificación {#sim3}

@ejercicio sim3-ej1 | Simulacro 3 · Planificación de tiempo real | tema=plan | tipo=simulacro
@enunciado
Tres tareas periódicas con plazo igual al periodo: $\tau_1$ ($C=2$, $T=8$), $\tau_2$ ($C=3$, $T=12$) y $\tau_3$ ($C=4$, $T=24$). La tarea $\tau_1$ y la $\tau_3$ comparten el recurso `r1`; $\tau_3$ lo mantiene durante 2 unidades de tiempo como máximo y $\tau_1$ durante 1.

1. Calcula la utilización y aplica el test de Liu–Layland con Rate Monotonic.
2. Calcula los tiempos de respuesta (sin bloqueo).
3. Con el protocolo de techo de prioridad inmediato, calcula los bloqueos $B_i$ y los tiempos de respuesta.
4. Diseña un ejecutivo cíclico: hiperperiodo, tamaños de marco válidos y plan de ejecución.
@antes
**Qué piden.** Los tres análisis clásicos de T6: test de utilización, tiempo de respuesta con bloqueo y ejecutivo cíclico.

**Teoría que usas.** $U\le n(2^{1/n}-1)$, $R=C+B+\sum\lceil R/T_j\rceil C_j$, techos y bloqueo único, restricciones de marco.
@paso 1. Utilización
$U=\tfrac28+\tfrac3{12}+\tfrac4{24}=0{,}25+0{,}25+0{,}1667=0{,}667$. La cota para $n=3$ es $3(2^{1/3}-1)=0{,}780$. Como $0{,}667\le0{,}780$, es **planificable** con RM (condición suficiente).
@paso 2. Tiempos de respuesta sin bloqueo
Prioridades RM: $\tau_1>\tau_2>\tau_3$.
- $R_1=2$.
- $R_2$: $3\to3+\lceil3/8\rceil2=5\to3+\lceil5/8\rceil2=5$: $R_2=5$.
- $R_3$: $4\to4+2+3=9\to4+\lceil9/8\rceil2+\lceil9/12\rceil3=4+4+3=11\to4+\lceil11/8\rceil2+\lceil11/12\rceil3=11$: $R_3=11$.

Todos $\le D_i$.
@paso 3. Bloqueos con ICPP
Techo de `r1` = prioridad de $\tau_1$ (la mayor de las que lo usan).
- $B_1$: bloquea la sección crítica de $\tau_3$ con techo $\ge P_1$: $B_1=2$.
- $B_2$: $\tau_3$ (menor prioridad) tiene `r1` con techo $P_1\ge P_2$: $B_2=2$ (aunque $\tau_2$ no usa `r1`: es el bloqueo **por techo**, típico del ICPP).
- $B_3=0$ (no hay tareas de menor prioridad).

Recurrencias: $R_1=2+2=4\le8$; $R_2$: $3+2=5\to5+\lceil5/8\rceil2=7\to5+2=7$: $R_2=7\le12$; $R_3=11$ (igual).
@paso 4. Ejecutivo cíclico
$H=\operatorname{mcm}(8,12,24)=24$, $C_{max}=4$. Candidatos $T_s\mid24$ con $T_s\ge4$: 4, 6, 8, 12, 24. Condición $2T_s-\gcd(T_s,T_i)\le D_i$:
- $T_s=4$: $8-4=4\le8$, $8-4=4\le12$, $8-4=4\le24$. ✓.
- $T_s=6$: para $T_i=8$, $12-2=10>8$. ✗
- $T_s=8$: $16-8=8\le8$, $16-4=12\le12$, $16-8=8\le24$. ✓.
- $T_s=12$: para $T_i=8$, $24-4=20>8$. ✗
- $T_s=24$: ✗.

Válidos: **4 y 8**.
@paso 5. Plan con $T_s=8$ (3 marcos de 8)
- Marco 1 (0–8): $\tau_1$ (2) + $\tau_2$ (3) = 5.
- Marco 2 (8–16): $\tau_1$ (2) + $\tau_3$ (4) = 6.
- Marco 3 (16–24): $\tau_1$ (2) + $\tau_2$ (3) = 5.

Comprobación: $\tau_2$ se libera en 0 y 12: se ejecuta en 0–8 y 16–24 (ambas dentro de su ventana, el segundo trabajo empieza tras su liberación en 12). $\tau_3$ (plazo 24) en 8–16. Ningún marco pasa de 8.
@resultado
@out code/out/s3_plan.cpp.txt
@fin
