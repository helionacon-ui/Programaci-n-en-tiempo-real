@ejercicio ex-junio23-1 | Junio 2023 · Ejercicio 1: fotografías aéreas (clase con matriz) | tema=clases | tipo=final | exam=junio23 | n=1 | curso=2022-23
@enunciado
@stmt junio23 1
@antes
**Qué piden.** Una clase `C_Imagen` que guarda una matriz (`vector<vector<RGB>>`), la clasifica píxel a píxel con un enumerado, y una función libre que busca la imagen con más píxeles de un tipo.

**Teoría que usas.** Constructor con parámetro por defecto, métodos `const`, `pair` como retorno, `enum` clásico, `operator<<` como `friend`, función auxiliar privada, recorrido con `for` por referencia constante.
@paso 1. Los tipos dados y los atributos
`RGB` y `Tipo_Terreno` vienen en el enunciado: se copian tal cual. Los atributos son tres `double` (GPS), el `umbral` y la matriz. El constructor lleva `umbral = 20` por defecto y usa la lista de inicialización.

@include cpp code/exams2/junio23_ej1.cpp 8-14
@paso 2. Tamaño y nueva fila
`tam_imagen()` devuelve `{-1,-1}` si la matriz está vacía; si no, `{filas, columnas}` (el tamaño de la primera fila). `nueva_fila()` acepta la fila si la imagen está vacía **o** si mide lo mismo que las anteriores.

@include cpp code/exams2/junio23_ej1.cpp 15-23
@paso 3. Clasificar y contar
La regla de cada tipo se escribe **una sola vez** en un método privado `clasificar()`. El orden importa: primero las tres comparaciones de «un color domina», después `urbano` (los tres colores parecidos) y, si nada encaja, `mixto`. `n_pixels_tipo()` solo cuenta.

@include cpp code/exams2/junio23_ej1.cpp 24-30
@include cpp code/exams2/junio23_ej1.cpp 40-49
@paso 4. Imprimir y buscar el máximo
`operator<<` como `friend` imprime la cabecera «Imagen en 2, 3, 4; umbral 20» y la matriz. `fotos_max_tipo()` guarda la mejor posición y el mejor recuento; con `>` estricto gana la **primera** en caso de empate.

@include cpp code/exams2/junio23_ej1.cpp 31-38
@include cpp code/exams2/junio23_ej1.cpp 52-59
@paso 5. `main`
Sigue exactamente la secuencia del enunciado: tamaño vacío, fila de 2 (cabe), fila de 2 (cabe), fila de 3 (**no** cabe: devuelve `false`).

@include cpp code/exams2/junio23_ej1.cpp 61-74
@paso 6. Comprobación
- ¿`{-1,-1}` con la matriz vacía? Sí, primera línea de la salida.
- ¿La fila de 3 se rechaza y la imagen no cambia? Sí: `false` y la matriz sigue con 2 filas.
- ¿Los cinco recuentos suman los 4 píxeles? 1+1+1+1+0 = 4.
@ojo Los píxeles `(200,10,10)`, `(10,10,200)`, `(10,200,10)` y `(100,100,100)` caen cada uno en un tipo distinto; si cambias el orden de las comprobaciones de `clasificar()` (por ejemplo `urbano` antes que `tierra`) un gris claro podría clasificarse mal. Pon siempre primero las reglas más restrictivas.
@resultado
@out code/out/junio23_ej1.cpp.txt
@fin

@ejercicio ex-junio23-2 | Junio 2023 · Ejercicio 2: productor–intermedio–consumidor (monitor con optional) | tema=monitor | tipo=final | exam=junio23 | n=2 | curso=2022-23
@enunciado
@stmt junio23 2
@antes
**Qué piden.** Un monitor muy simple (un `mutex` y un `vector<int>`) cuyo `obtener()` **no espera**: devuelve `optional<int>` y quien lo llama decide dormir 50 ms y reintentar. Tres hilos en cadena: productor → monitor 1 → intermedio → monitor 2 → consumidor.

**Teoría que usas.** `lock_guard`, `optional` y `nullopt`, `sleep_for`, pasar referencias a hilos con `ref()`, consola como recurso compartido (un `mutex` propio).
@paso 1. El monitor
Dos métodos, los dos con el `mutex` tomado. `obtener()` devuelve `nullopt` si está vacío; si no, saca el **primer** elemento (`front` + `erase`) para no devolverlo dos veces.

@include cpp code/exams2/junio23_ej2.cpp 10-26
@paso 2. Los tres hilos
Las tres funciones usan un contador de **éxitos** (`hechos`), no de intentos: cuando `obtener()` devuelve vacío se duerme 50 ms y se hace `continue` **sin** sumar. El consumidor acumula la suma y al final imprime la media entera.

@include cpp code/exams2/junio23_ej2.cpp 28-58
@paso 3. `main`
Dos monitores y tres hilos; los monitores se pasan con `ref()` (si no, se copiarían y `mutex` no se puede copiar).

@include cpp code/exams2/junio23_ej2.cpp 60-64
@paso 4. Comprobación
- ¿Hay carrera en el vector? No: las dos operaciones toman el `mutex` del monitor.
- ¿Se mezclan las líneas de la consola? No: `escribir()` toma `m_cout`.
- ¿Termina siempre? Sí: cada hilo acaba cuando consigue sus 10 valores; si el productor es más lento que el intermedio, este solo duerme y reintenta.
@ojo El enunciado muestra «la media es 20» con 3 valores (10+20+30)/3. Con los 10 valores del ejercicio la media es (10+20+…+100)/10 = **55**, que es lo que imprime la solución de referencia.
@resultado
Primeras líneas de una ejecución (el orden exacto entre hilos puede cambiar; al final el consumidor imprime «la media es 55 y termina»):

@out code/out/junio23_ej2.cpp.txt 12
@fin

@ejercicio ex-mayo24-1 | Mayo 2024 · Ejercicio 1: clasificador de posts (set y map) | tema=stl | tipo=final | exam=mayo24 | n=1 | curso=2023-24
@enunciado
@stmt mayo24 1
@antes
**Qué piden.** Una clase `C_Post` con el `operator<` que se da en el enunciado y un clasificador `C_Procesador_Posts` con un `map<string, set<C_Post>>`.

**Teoría que usas.** `set` y `map`, constructor delegado, bucle con **estructuras de enlace** (`const auto& [t, s]`), `find` en vez de `[]` en métodos `const`, `string::find` para buscar palabras.
@paso 1. `C_Post`
Cuatro atributos, constructor con `move`, `encontrar()` con `find(...) != string::npos` y el `operator<` que dan: **compara solo el nombre de usuario**. Fíjate en que eso condiciona todo lo demás.

@include cpp code/exams2/mayo24_ej1.cpp 7-20
@paso 2. Constructor y `add_post`
El constructor inicializa el mapa con una entrada vacía por temática y otra para «otras» (`posts_[t];` crea la entrada). `add_post()` recorre las temáticas: si el texto contiene la palabra, inserta el post en esa entrada (puede entrar en varias); si no entró en ninguna, va a «otras». El constructor delegado solo fija `"otras"`.

@include cpp code/exams2/mayo24_ej1.cpp 22-34
@paso 3. Consultas `const`
En métodos `const` no se puede usar `posts_[t]` (inserta); se usa `find`. `num_posts_tematicas()` devuelve un `map<string,int>`; `total_posts()` suma los tamaños.

@include cpp code/exams2/mayo24_ej1.cpp 35-48
@paso 4. Usuario con más posts
Se cuenta con un `map<string,int>` auxiliar y se queda el usuario con mayor cuenta (en empate, el primero por orden alfabético). Si la temática no existe o está vacía, `""`.

@include cpp code/exams2/mayo24_ej1.cpp 49-58
@paso 5. `main`
@include cpp code/exams2/mayo24_ej1.cpp 72-85
@paso 6. Comprobación
- Se añaden 5 posts, pero `total=5` **no** es «5 posts distintos»: el de `luis` contiene `futbol` y `cine` y cuenta en las dos entradas, y el tercer post de `ana` (05/05, futbol) **no entra** porque `ana` ya estaba en `futbol`. Resultado: cine 2 + futbol 2 + otras 1.
- «Otras» recibe el post sin ninguna palabra clave (`eva`).
- Temática inexistente → conjunto vacío / `""`.
@ojo Como `operator<` compara solo por usuario, un `set<C_Post>` **no admite dos posts del mismo usuario** (para el `set` son «iguales»). Por eso `ana` aparece una sola vez en `futbol` y el recuento por usuario siempre sale 1. Es una consecuencia de la comparación que da el enunciado; la solución de referencia lo respeta y, si fuera necesario contar varios posts por usuario, habría que usar `multiset` o `vector`.
@resultado
@out code/out/mayo24_ej1.cpp.txt
@fin

@ejercicio ex-mayo24-2 | Mayo 2024 · Ejercicio 2: dos repositorios con espera absoluta | tema=monitor | tipo=final | exam=mayo24 | n=2 | curso=2023-24
@enunciado
@stmt mayo24 2
@antes
**Qué piden.** Dos clases monitor (`Repositorio1`, `Repositorio2`) y dos hilos periódicos: uno inserta un 7 cada 50 ms y otro, cada segundo, calcula la media, la guarda en el segundo repositorio y vacía el primero. Se pide **espera absoluta**.

**Teoría que usas.** Monitor con `mutex`, `optional<double>`, `this_thread::sleep_until` con un instante que se **incrementa** (no acumula deriva), `chrono_literals`.
@paso 1. Los dos monitores
`Repositorio1` inserta y calcula media + vaciado **en una sola operación atómica** (si fueran dos métodos separados, entre uno y otro podría colarse un valor). `Repositorio2` recuerda cuántos valores se han leído (`leidos_`) y devuelve el siguiente o `nullopt`.

@include cpp code/exams2/mayo24_ej2.cpp 11-38
@paso 2. Hilos con espera absoluta
Cada hilo parte de `t0` y suma su periodo en cada vuelta: `t += 50ms; sleep_until(t)`. Así, aunque una vuelta tarde un poco más, la siguiente espera menos y el periodo medio se mantiene exacto. Con `sleep_for(50ms)` el error se **acumularía**.

@include cpp code/exams2/mayo24_ej2.cpp 40-58
@paso 3. Comprobación
- ¿Tres medias en 3 s? Sí: el procesador despierta en 1 s, 2 s y 3 s.
- ¿Todas valen 7? Sí, porque solo se inserta el 7 (la media de sietes es 7).
- ¿Hay carreras? No: cada repositorio protege su vector con su `mutex`; el `main` solo lee tras los `join`.
@ojo Si el procesador despierta justo cuando el insertor está a medias, la media usa los valores que haya en ese instante; no importa cuántos sean, porque todos valen 7. Con valores distintos habría que decidir si el resultado depende de ese instante (en un examen, basta con que la operación sea atómica).
@resultado
@out code/out/mayo24_ej2.cpp.txt
@fin

@ejercicio ex-abril24-2 | Abril 2024 · Ejercicio 2: monitor con dos vectores y dos mutex | tema=monitor | tipo=parcial | exam=abril24 | n=2 | curso=2023-24
@enunciado
@stmt abril24 2
@antes
**Qué piden.** Un monitor con **dos recursos** (dos vectores) y **un `mutex` por cada uno**. Dos métodos necesitan los dos a la vez (`leer_v1y2`, `escribir_v1y2`): ahí aparece el riesgo de **interbloqueo**.

**Teoría que usas.** Granularidad del bloqueo, orden de adquisición, `scoped_lock` (toma varios `mutex` sin interbloqueo), rango válido con `-1`/`false`, `pair`, hilos con paso de parámetros por valor y por `ref()`.
@paso 1. El monitor
Los métodos de un solo vector toman **solo** su `mutex` (así un lector del vector 1 no bloquea al vector 2). Los métodos «y» toman los dos con `scoped_lock lk{m1_, m2_}`, que usa un algoritmo que evita el interbloqueo aunque otro hilo los pida en orden contrario.

@include cpp code/exams2/abril24_ej2.cpp 11-34
@paso 2. Funciones de hilo
Reciben identificador, milisegundos, posición y el monitor (por referencia). Repiten 10 veces: escribir/leer, mostrar por consola (con su propio `mutex`) y dormir.

@include cpp code/exams2/abril24_ej2.cpp 36-50
@paso 3. `main`
Cinco hilos de cada tipo, cada uno con su posición (0 a 4), y un `join` de los diez. Después se prueban las operaciones con posiciones fuera de rango.

@include cpp code/exams2/abril24_ej2.cpp 52-62
@paso 4. Comprobación
- ¿Puede haber interbloqueo? Si escribiera `lock(m1_); lock(m2_);` en un método y `lock(m2_); lock(m1_);` en otro, sí. Con `scoped_lock` no.
- ¿Posición fuera de rango? `leer_*` devuelve `-1`; `escribir_*` devuelve `false`.
@ojo En la salida cada productor/consumidor trabaja sobre su propia posición, así que no hay competencia real entre ellos; lo que se evalúa es que las operaciones estén protegidas y que los métodos dobles tomen ambos `mutex` correctamente.
@resultado
Primeras líneas de una ejecución (el orden entre hilos cambia cada vez; al final se imprimen las pruebas de rango, p. ej. `leer_v1y2(2,99) = (10, -1)`):

@out code/out/abril24_ej2.cpp.txt 12
@fin
