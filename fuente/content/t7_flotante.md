## Números reales en el ordenador {#t7-ieee}

Un `double` guarda un número real con **52 bits** de mantisa (fracción), 11 de exponente y 1 de signo. Un `float`, con 23, 8 y 1. Con un número finito de bits solo se pueden representar **algunos** valores: el resto se **aproxima** al más cercano.

La clave: igual que $1/3 = 0{,}333\ldots$ no cabe en decimal, **$0{,}1$ no cabe en binario**:

$$0{,}1_{10} = 0{,}0001\,1001\,1001\,1001\,1001\,1001\ldots_2$$

Es una fracción periódica infinita. Cualquier cantidad finita de bits la corta y comete un pequeño error.

@include cpp code/t7/flotante.cpp runout

Consecuencias prácticas:

- **Nunca compares `double` con `==`.** Compara con tolerancia: `fabs(a - b) < 1e-9`.
- Los errores **se acumulan**: sumar 0,1 diez veces no da exactamente 1.
- Sumar un número muy pequeño a uno muy grande **lo pierde** (los dígitos no caben).
- Para dinero o tiempo, usa **enteros** (céntimos, microsegundos) o tipos de tiempo como `std::chrono`.

:::warn Qué suele fallar
- Condiciones de bucle con `double` (`while (x != 1.0)`): puede no terminar nunca.
- Convertir `double` a `int` **trunca** hacia cero (3,99 → 3), no redondea.
- Dividir enteros: `1/2` es `0`; escribe `1.0/2`.
- Restar dos números casi iguales: se pierden cifras significativas (cancelación).
:::

## Caso 1: el misil Patriot (Dhahran, 1991) {#t7-patriot}

El reloj interno del Patriot contaba el tiempo en **décimas de segundo** como un entero. Para convertirlo a segundos multiplicaba por $1/10$, almacenado con 24 bits y por tanto **truncado**. El error de cada tic era

$$e = 0{,}1 - \frac{\lfloor 0{,}1 \cdot 2^{23} \rfloor}{2^{23}} \approx 9{,}5\cdot 10^{-8}\ \text{s}.$$

Parece diminuto, pero la batería llevaba unas **100 horas** encendida, es decir, $100\cdot 3600\cdot 10 = 3{,}6\cdot 10^{6}$ tics:

$$\text{deriva} = 3{,}6\cdot 10^{6}\cdot 9{,}5\cdot 10^{-8} \approx 0{,}34\ \text{s}.$$

Un Scud viaja a unos 1676 m/s, así que en 0,34 s se mueve más de **medio kilómetro**: el sistema miraba donde el misil ya no estaba y lo descartó como falsa alarma. (Con $e = 9{,}5\cdot10^{-8}$ exactos salen 573 m; con el valor sin redondear, 575 m: el orden de magnitud es lo importante.)

[[sim:patriot]]

:::tip Lección
Un error **pequeño y sistemático** se vuelve grande con el tiempo. En tiempo real, el tiempo es lo que más se acumula. Por eso el tiempo se mide con enteros, o con tipos precisos, y los relojes se **recalibran**. Fuente de referencia: U.S. General Accounting Office, *Patriot Missile Defense: Software Problem Led to System Failure at Dhahran, Saudi Arabia* (IMTEC-92-26, 1992).
:::

## Caso 2: Mars Pathfinder (1997) {#t7-pathfinder}

Pocos días después de aterrizar en Marte, el ordenador de la sonda empezó a **reiniciarse** solo. El sistema operativo era VxWorks, con planificación expulsiva por prioridades fijas. Las tareas que importan, de mayor a menor prioridad:

1. `bc_sched`: planifica el bus de datos y comprueba con un *watchdog* que `bc_dist` terminó en el ciclo anterior.
2. `bc_dist`: distribuye datos por el bus.
3. Varias tareas de prioridad media (comunicaciones, etc.).
4. `ASI/MET`: tarea científica de **baja** prioridad.

`bc_dist` y `ASI/MET` compartían una estructura protegida por un `mutex`. La secuencia fatal fue la **inversión de prioridad** que ya conoces:

1. `ASI/MET` toma el `mutex`.
2. `bc_dist` (alta) se bloquea esperándolo.
3. Tareas **medias** expulsan a `ASI/MET`, así que `bc_dist` espera cuanto ellas quieran.
4. `bc_sched` detecta que `bc_dist` no ha terminado y **reinicia** el sistema.

[[fig:inversion]]

La solución fue activar la **herencia de prioridad** en el `mutex` (estaba desactivada por rendimiento). Se pudo hacer **desde la Tierra**, actualizando parámetros, porque el sistema conservaba sus herramientas de trazas. Puedes reproducir el efecto en el simulador de T6 (sin protocolo frente a herencia o techo).

:::deep Más a fondo
El protocolo de herencia y el de techo de prioridad se deben a L. Sha, R. Rajkumar y J. Lehoczky, «Priority Inheritance Protocols: An Approach to Real-Time Synchronization», *IEEE Trans. on Computers*, 1990. La explicación de lo ocurrido en Pathfinder circuló en el foro *RISKS Digest* (vol. 19, n.º 49, 1997). Sobre aritmética de coma flotante, la referencia clásica es D. Goldberg, «What Every Computer Scientist Should Know About Floating-Point Arithmetic», *ACM Computing Surveys*, 1991.
:::

:::formula Coma flotante
- `double`: 1 bit de signo + 11 de exponente + 52 de mantisa (≈ 15-16 cifras decimales).
- `float`: 1 + 8 + 23 (≈ 7 cifras decimales).
- Comparar: `fabs(a - b) < tolerancia`.
- Error acumulado ≈ (error por operación) × (número de operaciones).
- Patriot: $e = 0{,}1 - \lfloor 0{,}1\cdot 2^{23}\rfloor / 2^{23} \approx 9{,}5\cdot 10^{-8}$ s; en 100 h: 0,34 s.
:::

@gl Mantisa | Parte fraccionaria de un número en coma flotante (52 bits en `double`).
@gl Épsilon de máquina | Distancia entre 1 y el siguiente número representable ($\approx 2{,}2\cdot10^{-16}$ en `double`).
@gl Truncamiento | Descartar los bits que no caben, sin redondear.
@gl Deriva | Error de tiempo que se acumula tic tras tic.
@gl Watchdog | Temporizador que reinicia el sistema si no se le «alimenta» a tiempo.
@quiz ¿Por qué `0.1 + 0.2 == 0.3` es falso en `double`? | Por un error del compilador | Porque 0,1 y 0,2 no son exactos en binario y el error se acumula | Porque `==` no funciona con `double` | Porque `0.3` es `float` | 2 | 0,1 y 0,2 se aproximan; la suma no coincide exactamente con la aproximación de 0,3.
@quiz El error del Patriot fue grande porque… | El error por tic era enorme | Un error pequeño se acumuló durante ~100 h | El radar fallaba | Usaba `float` | 2 | 3,6 millones de tics con 9,5·10⁻⁸ s de error dan 0,34 s.
@quiz En Pathfinder, ¿qué tarea expulsó a la que tenía el mutex y alargó el bloqueo de la tarea más prioritaria? | Una tarea de prioridad media | La de menor prioridad | El watchdog | El planificador cíclico | 1 | Las tareas medias expulsan a la baja y la alta espera por ellas: inversión de prioridad.
@quiz ¿Cuál es la forma correcta de comparar dos `double`? | `a == b` | `fabs(a-b) < eps` | `a - b == 0` | `(int)a == (int)b` | 2 | Comparar con una tolerancia adecuada al problema.
@card ¿Por qué 0,1 no es exacto en binario? | Es una fracción periódica infinita en base 2; solo cabe una aproximación.
@card ¿Qué falló en Mars Pathfinder? | Inversión de prioridad con un mutex sin herencia de prioridad; el watchdog reinició el sistema. Se arregló activando la herencia.
