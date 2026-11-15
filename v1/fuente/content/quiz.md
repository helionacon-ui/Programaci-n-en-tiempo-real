@quiz En un ejecutivo cíclico con $T_s=8$ y una tarea de periodo 12, ¿se cumple $2T_s-\gcd(T_s,T_i)\le D_i$ con $D_i=12$? | No, da 14 | Sí, da exactamente 12 | No, da 16 | Sí, da 4 | 2 | $2\cdot8-\gcd(8,12)=16-4=12\le12$: se cumple con igualdad.
@quiz Un conjunto de 3 tareas con $U=0{,}814$ y RM… | No es planificable (supera la cota) | Puede serlo: hay que calcular los tiempos de respuesta | Es planificable seguro | Solo lo es con EDF | 2 | La cota 0,780 es suficiente, no necesaria: sobre ella el test no decide.
@quiz Con ICPP, el bloqueo $B_i$ de una tarea es… | La suma de todas las secciones críticas posibles | El máximo de **una** sección crítica de menor prioridad con techo $\ge P_i$ | Siempre 0 | La duración de la sección crítica más larga de cualquier tarea | 2 | ICPP garantiza bloqueo único y acotado por una sección.
@quiz ¿Por qué se usa `sleep_until` en una tarea periódica en vez de `sleep_for`? | Porque consume menos CPU | Para no acumular la deriva del tiempo de trabajo | Porque `sleep_for` no existe en C++17 | Para que el hilo pueda ser interrumpido | 2 | `sleep_for` suma el trabajo al periodo; `sleep_until` fija instantes absolutos.
@quiz En `vector<unique_ptr<Item>> v`, para añadir un elemento hay que… | `v.push_back(p)` con una copia | `v.push_back(move(p))` | `v.push_back(&p)` | `v = p` | 2 | Un `unique_ptr` no se copia; se mueve.
@quiz Para borrar de un `vector` todos los elementos que cumplen una condición se usa… | `v.remove_if(...)` | `v.erase(remove_if(v.begin(), v.end(), f), v.end())` | `delete v` | `v.clear()` | 2 | `remove_if` reordena; `erase` elimina la cola sobrante.
@quiz Un monitor tiene un `wait` con predicado que incluye `|| cerrado_`. ¿Qué hay que hacer al cerrar? | `notify_one` | `notify_all` bajo/tras tomar el `mutex` | Nada, el hilo se despierta solo | `terminate` | 2 | Todos los hilos que esperan deben comprobar la nueva condición.
@quiz ¿Qué hace `in.clear(); in.ignore(numeric_limits<streamsize>::max(), '\n');` tras una lectura fallida? | Borra el fichero | Limpia el estado de error y descarta el resto de la línea | Cierra el flujo | Reinicia el programa | 2 | Sin `clear()` las lecturas siguientes seguirían fallando.
@quiz Con una criba de Eratóstenes, ¿por qué el bucle interior empieza en `i*i`? | Por rendimiento solo | Los múltiplos menores ya los marcó un primo más pequeño | Para evitar el desbordamiento | Porque 1 no es primo | 2 | $k\cdot i$ con $k<i$ tiene un factor primo menor que $i$.
@quiz En un `vector` que duplica su capacidad, `push_back` es… | $O(n)$ siempre | $O(1)$ amortizado | $O(\log n)$ | $O(n^2)$ | 2 | Las copias suman menos de $2n$ en $n$ inserciones.
@card Fórmula del tiempo de respuesta con bloqueo | $R_i=C_i+B_i+\sum_{j\in hp(i)}\lceil R_i/T_j\rceil C_j$, iterando desde $R^{(0)}=C_i+B_i$ hasta que no cambie o supere $D_i$.
@card Restricciones de marco en el ejecutivo cíclico | $T_s\ge\max C_i$; $T_s\mid H$; $2T_s-\gcd(T_s,T_i)\le D_i$ para toda tarea.
@card Cota de Liu–Layland | $U\le n(2^{1/n}-1)$ (suficiente, no necesaria); tiende a $\ln2\approx0{,}693$. Con periodos armónicos, $U\le1$.
@card ¿Cuándo es planificable con EDF? | Con $D_i=T_i$, apropiativo y un procesador: si y solo si $U\le1$.
@card ¿Qué garantiza ICPP? | Bloqueo único y acotado por una sección crítica, y ausencia de interbloqueos.
@card `sleep_for` frente a `sleep_until` | `sleep_for` acumula deriva; `sleep_until` con instante teórico + periodo, no.
@card copy-and-swap | `operator=(T o) { swap(*this, o); return *this; }`: copia por valor, intercambio, y el destructor limpia lo viejo.
@gl Hiperperiodo | Mínimo común múltiplo de los periodos; el plan cíclico se repite cada $H$.
@gl Marco secundario | Intervalo de tamaño $T_s$ en el que se ejecutan enteras las tareas asignadas, sin apropiación.
@gl Techo de prioridad | Mayor prioridad entre las tareas que usan un recurso.
@gl Bloqueo | Tiempo que una tarea espera a otra de menor prioridad por un recurso compartido.
@gl Instante crítico | Instante en que todas las tareas se liberan a la vez; es el peor caso para RM.
@gl Amortizado | Coste medio por operación sobre una secuencia larga, aunque alguna operación aislada sea cara.
@gl Criba de Eratóstenes | Algoritmo para marcar los primos hasta $N$ tachando múltiplos de cada primo.
