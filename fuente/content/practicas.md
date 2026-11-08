Las tres prácticas del curso, desarrolladas paso a paso. Cada una tiene el código completo (también disponible como archivos independientes), la salida esperada y la interpretación que se espera que escribas. Compila siempre con:

```
g++ -std=c++17 -Wall -Wextra -pthread fichero.cpp -o programa
```

## Práctica 1 · Programación basada en objetos: strings y colecciones {#p1}

Usar objetos de la biblioteca estándar sin definir clases propias: `string`, `vector`, `map`, flujos.

### 1.1 a 1.3 · Palabras, ordenación y ficheros {#p1-basico}

**Qué se pide.** Leer una línea, imprimir cada palabra en su propia línea sin signos de puntuación, guardarlas en un `vector<string>`, ordenarlas (de menor a mayor y de mayor a menor) y pasar a leer/escribir ficheros comprobando que entrada y salida son distintos.

**Cómo se piensa.**

1. Para separar palabras, un `istringstream` y `in >> p` (corta por espacios). Para quitar puntuación, `remove_if` + `erase` con `ispunct`.
2. `sort(v.begin(), v.end())` ordena por **código de carácter**: las mayúsculas (65-90) van **antes** que las minúsculas (97-122). Para ignorar mayúsculas, pasa un comparador (lambda) que compare las versiones en minúsculas.
3. Con ficheros, `ifstream` y `ofstream` se usan igual que `cin` y `cout`. Comprueba siempre `if (!in)`.

@include cpp code/practicas/p1_basico.cpp runout

[[open:lab-words:mayus]]

**Interpretación que debes escribir.** «Sin comparador, `Programación` aparece antes que `de` porque la `P` (80) es menor que la `d` (100). Se soluciona comparando en minúsculas. `ispunct` solo reconoce signos ASCII: `¿` (UTF-8, dos bytes) no se elimina.»

### 1.4 y 1.5 · Histograma de palabras {#p1-histograma}

**Qué se pide.** Un `map<string,int>` con el número de apariciones de cada palabra; mostrar las dos más repetidas y qué palabras acumulan el 20 % de las apariciones; después, un histograma por longitud con `vector<map<string,int>>`.

**Cómo se piensa.**

- `++hist[palabra]` hace todo: si no existe la crea con 0 y suma 1.
- Un `map` está ordenado por **clave**, no por valor. Para ordenar por frecuencia, copia a un `vector<pair<string,int>>` y ordénalo con un comparador por `second`.
- El 20 %: recorre ordenado de más a menos frecuente acumulando hasta llegar a `total/5`.
- Por longitud: `por_longitud[palabra.size()][palabra]`.

@include cpp code/practicas/p1_histograma.cpp runout

[[sim:lab-words]]

[[open:lab-words:quijote]]

**Interpretación.** Con el fragmento de 1882 palabras, `de` (123) e `y` (104) suman casi el 12 % del texto: las palabras funcionales dominan. Cinco palabras (`de`, `y`, `que`, `a`, `el`) acumulan el 20 %. Es la **ley de Zipf**: la frecuencia cae muy deprisa con el puesto en el ranking.

:::warn Qué suele fallar
- `hist[palabra]` para **consultar** si existe: la crea. Usa `find`.
- Olvidar convertir a minúsculas: `El` y `el` cuentan como palabras distintas.
- No comprobar el fichero abierto, o dejar `argv[1]` sin comprobar `argc`.
- Los acentos: `tolower` del C solo funciona con ASCII. `É` no se convierte.
:::

## Práctica 2 · Programación orientada a objetos {#p2}

### 2.1 · Clase número complejo {#p2-complejo}

**Qué se pide.** Atributos real e imaginario; constructor con dos valores y un constructor **delegado** sin parámetros (0+0i); `get`; módulo y argumento como `pair` con `hypot` y `atan2`; `operator<<`, `operator>>`, `+`, `-`.

**Decisiones de diseño.** Los operadores y `modulo_argumento` pueden ser funciones **libres** (fuera de la clase) porque solo necesitan los `get`: la clase queda más pequeña y estable. `operator>>` construye un temporal y hace `swap`: si la lectura falla, el objeto original no queda a medias.

@include cpp code/practicas/p2_complejo.cpp runout

[[sim:complejo]]

[[open:complejo]]

### 2.2 y 2.3 · Mensajes secretos y su registro {#p2-mensajes}

**Qué se pide.** `Mensaje_Secreto` con texto, clave y pista; `bloquear` (sin y con clave nueva, esta última solo si está desbloqueado), `desbloquear(clave)`, `esta_bloqueado`, `borrar`; `operator<<` que muestra la pista si está bloqueado. `Registro_Mensajes` con un `map<string, vector<Mensaje_Secreto>>` y métodos para añadir, consultar, leer el primero/último (borrándolo), listar y borrar con claves.

**Cómo se piensa.**

- `total_mensajes_persona` usa `find` (no `[]`) para no crear personas fantasma y convierte `size()` (sin signo) a `int`.
- `primer_mensaje` y `ultimo_mensaje` se parecen mucho: un método **privado** `leer(persona, clave, primero)` evita repetir código.
- Borrar del vector mientras se recorre exige iteradores: `m = erase(m)` o `++m`.

@include cpp code/practicas/p2_mensajes.cpp runout

### 2.4 · Figuras y herencia {#p2-figuras}

Clase abstracta `Figura` con `area()` y `perimetro()` virtuales puros, `operator<<` polimórfico apoyado en un `to_string()` protegido y virtual, destructor virtual, `Circulo`, `Rectangulo` y `Agrupacion_Figuras` (contenedor recursivo con `set<Figura*>`). La solución completa, compilada y ejecutada, está en el tema T3 («Ejemplo completo»).

[[sim:bind]]

[[open:bind]]

### 2.5 · Actividades de un proyecto {#p2-actividades}

Misma idea con un contenedor recursivo, ahora con **dos** niveles de abstracción: `Tarea_Compuesta` es abstracta (no implementa `duracion`) y sus dos hijas deciden cómo combinarla. Paralelas: el **máximo** de las duraciones. Secuenciales: la **suma**.

@include cpp code/practicas/p2_actividades.cpp runout

**Interpretación.** La duración de `S` es 8 = max(3, 5) + 2 + 1: la tarea paralela interna aporta 5 (la más larga), no 3 + 5. El polimorfismo hace que `S.duracion()` llame a `P.duracion()` sin saber qué tipo de tarea es.

## Práctica 3 · Programación concurrente {#p3}

### 3.1 y 3.3 · Suma de matrices con hilos y con thread pool {#p3-matrices}

**Qué se pide.** Sumar dos matrices `vector<vector<int>>` con $n$ hilos de forma que no haya carreras **sin mutex**: cada hilo suma filas **disjuntas**. Después, un *thread pool*: los hilos piden al «director» la siguiente fila.

**Cómo se piensa.**

- 3.1: el hilo $id$ suma las filas $id, id+n, id+2n, \ldots$. Como cada hilo **escribe** en filas distintas de `c`, no hay carrera y no hace falta `mutex`. Las matrices de entrada solo se leen: se pasan con `cref`.
- 3.3: ahora el reparto es dinámico. El contador de «siguiente fila» **sí** es un dato compartido: lo protege un `mutex` dentro de la clase `Director`.

@include cpp code/practicas/p3_suma_matrices.cpp

Salida de una ejecución (los tiempos cambian en cada máquina y ejecución):

```out
a + b con 3 hilos:
0 2 4 6 
0 2 4 6 
0 2 4 6 
0 2 4 6 
mismo resultado con thread pool: true
1 hilos: 7713 us (C[7][7]=14)
2 hilos: 7088 us (C[7][7]=14)
4 hilos: 6739 us (C[7][7]=14)
```

[[sim:lab-rows]]

[[open:lab-rows]]

**Interpretación.** La mejora real es **modesta**: sumar es muy barato y el tiempo lo domina el acceso a memoria y la reserva de la matriz resultado. Más hilos que núcleos no ayuda. Para un cálculo más costoso por elemento, la mejora sí se acerca al número de núcleos.

### 3.2 · La cena de los filósofos {#p3-filosofos}

**Qué se pide.** $n$ filósofos, $n+1$ cubiertos (un `mutex` cada uno). Para comer, el filósofo $i$ necesita **tres** cubiertos: $i$, $i+1$, $i+2$ (módulo $n+1$). Ciclo: coge cubiertos, come 10 ms, los suelta, piensa 10 ms. Usar `std::lock` o `scoped_lock`; probar después con `lock()` individuales y observar el interbloqueo.

**Cómo se piensa.** Con `lock()` uno a uno, cada filósofo se queda con su primer cubierto y espera el segundo, que tiene otro: **espera circular** ⇒ interbloqueo. `scoped_lock lk{c1, c2, c3}` los coge **todos a la vez** con un algoritmo seguro.

@include cpp code/practicas/p3_filosofos.cpp

Con `-DINTERBLOQUEO` (cada `lock()` por separado y una pausa de 1 ms entre ellos) el programa se bloquea: en cinco ejecuciones de prueba con 3 filósofos y 50 ciclos se cortó por tiempo en las cinco. Sin esa definición, termina siempre:

```out
F1 come
F2 piensa
...
todos han terminado
```

[[sim:philo]]

[[open:philo]]

### 3.4 · Almacén (monitor) {#p3-almacen}

**Qué se pide.** Un generador que escribe los valores 0 a 6 y varios lectores. Cada lector debe leer cada valor **una vez** y el generador **no puede escribir** el siguiente hasta que **todos** hayan leído el actual. Clase `Almacen` como monitor, con cierre ordenado.

**Cómo se piensa.** Estado: el valor y un `map<thread::id,bool>` que dice quién ya lo leyó. Dos condiciones de espera, ambas sobre el mismo `mutex`:

- El **generador** espera hasta que `todos_han_leido()`.
- Un **lector** espera hasta que él **no** ha leído el valor actual.

Cada cambio de estado (`anyadir`, `leer`) hace `notify_all`: así se despierta quien corresponda y los demás recomprueban su predicado. `cerrar()` pone una bandera y despierta a todos para que ninguno se quede dormido para siempre.

@include cpp code/practicas/p3_almacen.cpp runout

[[sim:almacen]]

[[open:almacen]]

**Interpretación.** Cada lector lee exactamente 7 valores y suma 21 (0+1+…+6), sea cual sea la velocidad de cada uno: la sincronización fuerza el ritmo del más lento. Es el esquema de «productor con varios consumidores que necesitan todos el mismo dato».

:::formula Resumen de prácticas
- P1: `++hist[p]`, `find` para consultar, `sort` con lambda para ordenar por valor.
- P2: constructor delegado, `operator<<` con `to_string()` virtual, destructor virtual, contenedor recursivo con punteros.
- P3: filas disjuntas ⇒ sin mutex; contador compartido ⇒ mutex; varios recursos ⇒ `scoped_lock`; esperar condición ⇒ `condition_variable` con predicado.
:::

@check c-p1 | P1: escribí y ejecuté el histograma de palabras
@check c-p2 | P2: escribí complejo, mensajes y actividades
@check c-p3 | P3: escribí suma por filas, filósofos y almacén
