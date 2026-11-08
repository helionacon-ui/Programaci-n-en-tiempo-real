Ejercicios de las hojas de problemas, con el mismo formato que los exámenes: enunciado, qué piden, pasos plegables y resultado final. El código completo acompaña a la guía como ficheros independientes. Todos los resultados se han comprobado compilando y ejecutando.

## Hoja 1 · Cálculo numérico y bucles {#h-num}

@ejercicio hoja-numerica | Leibniz, sumas parciales y criba de Eratóstenes | tema=stl | tipo=hoja
@enunciado
1. Calcula $\pi/4$ con la serie de Leibniz, $\sum_{n\ge 0} (-1)^n/(2n+1)$, con un millón de términos. Compara con `M_PI_4` usando `==` y usando `fabs`.
2. Dado un `vector<int>`, construye otro cuya posición `i` contenga la suma de los elementos desde `i` hasta el final.
3. Implementa la criba de Eratóstenes hasta 1 000 000 con un `vector<char>` que marque cada número como desconocido, primo o compuesto. Cuenta los primos y muestra los últimos ocho.
@antes
**Qué piden.** Tres bucles clásicos. Lo importante: entender **por qué `==` falla con reales**, recorrer un vector hacia atrás con un acumulador y hacer la criba en tiempo casi lineal.

**Teoría que usas.** Coma flotante (T7), `vector`, `iota`, bucles con `size_t` (sin signo: cuidado con `i >= 0`).
@paso 1. Serie de Leibniz y comparación
Se alterna el signo con `n % 2`. Con $N$ términos, el error de la serie alternada es del orden de $1/(4N)$: con $N = 10^6$, unos $2{,}5\cdot 10^{-7}$. Por eso `==` da `false` (el resultado **no puede** coincidir bit a bit con `M_PI_4`) pero `fabs(a-b) < 1e-6` da `true`.

@include cpp code/hojas/numerica.cpp 10-15
@paso 2. Sumas desde `i` hasta el final
Se recorre **de atrás hacia delante** con un acumulador: `sumas[i] = sumas[i+1] + v[i]`. Coste $O(n)$ (frente a $O(n^2)$ si sumas cada vez desde `i`). Se usa `int i` y no `size_t i` porque el bucle termina con `i >= 0`: con un tipo sin signo, `i >= 0` es siempre cierto y el bucle no acaba.

@include cpp code/hojas/numerica.cpp 17-24
@paso 3. Criba de Eratóstenes
Marcas iniciales: `'d'` (desconocido). Se recorre desde 2: si `i` sigue desconocido es primo y se marcan como compuestos sus múltiplos. **Se empieza en `i*i`**: los múltiplos menores, $k\cdot i$ con $k<i$, ya los marcó un primo más pequeño. Coste $O(n\log\log n)$.

@include cpp code/hojas/numerica.cpp 26-44
@paso 4. Comprobación
- Hay 78 498 primos por debajo de 1 000 000 (valor conocido) y el mayor es 999 983: coincide con la salida.
- Sumas parciales de $1..10$: $55, 54, 52, \dots, 10$ (suma total 55, último elemento 10).
@resultado
@out code/out/h_numerica.cpp.txt
**Interpretación.** `pi_4 == M_PI_4` es falso aunque la aproximación sea buena: la serie solo converge (lentamente) y además cada suma redondea. Compara siempre con tolerancia.
@fin

## Hoja 2 · Conjuntos y cadenas {#h-conj}

@ejercicio hoja-conjuntos | Operaciones con `set<int>` y caracteres repetidos | tema=stl | tipo=hoja
@enunciado
1. Escribe funciones que reciban dos `set<int>` y devuelvan su unión, su intersección y su diferencia, y otra que diga si el primero es subconjunto del segundo.
2. Escribe una función que diga si una cadena tiene caracteres repetidos, de tres maneras: con un `set`, con un `vector`/`map` y sin ninguna colección.
@antes
**Qué piden.** Usar `set` (ordenado, sin duplicados) y conocer sus operaciones: `insert`, `count`, rangos. Saber que `insert` **devuelve un `pair`** cuyo `.second` indica si se insertó.

**Teoría que usas.** `set<T>`, iteradores, `std::includes` (requiere rangos **ordenados**: un `set` lo está), `operator<<` sobrecargado.
@paso 1. Unión, intersección y diferencia
- Unión: copia de `a` y se insertan los de `b`. El `set` descarta duplicados.
- Intersección: de `a`, los que `b.count(x)` confirma.
- Diferencia: de `a`, los que **no** están en `b`.

Se pasa por `const&` para no copiar. Coste $O(n\log m)$.

@include cpp code/hojas/conjuntos.cpp 8-16
@paso 2. Subconjunto
`includes(b.begin(), b.end(), a.begin(), a.end())` devuelve `true` si todos los elementos de `a` están en `b`. Funciona porque ambos rangos están ordenados.

@include cpp code/hojas/conjuntos.cpp 15-17
@paso 3. Caracteres repetidos
- **Con `set`**: `vistos.insert(c).second == false` significa que ya estaba: repetido. $O(n\log n)$.
- **Sin colecciones**: dos bucles anidados, $O(n^2)$, sin memoria extra.

(Con `map<char,int>` o `vector<int>(256)` se cuenta cada carácter y se busca un contador ≥ 2: $O(n)$.)

@include cpp code/hojas/conjuntos.cpp 23-33
@paso 4. Prueba
@include cpp code/hojas/conjuntos.cpp 34-41
@resultado
@out code/out/h_conjuntos.cpp.txt
@fin

## Hoja 3 · Clases {#h-clases}

@ejercicio hoja-clases | Esfera, punto y caja | tema=clases | tipo=hoja
@enunciado
1. Diseña la clase `Sphere` (diámetro y centro como `Point_3D`) con área, volumen, `contiene(punto)` y `en_superficie(punto)`, y `operator<<`.
2. Diseña la clase `Box` con alto, ancho y profundidad, que permita insertar objetos por volumen mientras quepan, saber si está llena y vaciarla.
3. Lee un valor positivo de `cin` sin que el programa se rompa si el usuario escribe letras.
@antes
**Qué piden.** Clases con **invariantes** (el volumen libre nunca es negativo), métodos `const`, `friend operator<<` y entrada robusta.

**Teoría que usas.** Constructores con valores por defecto, lista de inicialización, `const` correcto, comparar reales con tolerancia, estado de error de `cin` (`clear` + `ignore`).
@paso 1. `Point_3D` y `Sphere`
La distancia entre dos puntos es $\sqrt{\Delta x^2+\Delta y^2+\Delta z^2}$. Un punto está **dentro** si la distancia al centro es menor que el radio, y **en la superficie** si difiere del radio en menos de una tolerancia (nunca `==` con reales). Área $4\pi r^2$ y volumen $\tfrac43\pi r^3$, con $r = d/2$.

@include cpp code/hojas/clases.cpp 7-32
@paso 2. `Box`
El volumen libre empieza en $a\cdot w\cdot p$. `insertar_objeto` rechaza volúmenes ≤ 0 o mayores que el libre (devuelve `false` y **no cambia el estado**). `llena_` se actualiza al llegar a 0.

@include cpp code/hojas/clases.cpp 34-48
@paso 3. Entrada robusta
Si `in >> v` falla, el flujo queda en estado de error y **todas** las lecturas siguientes fallan. Hay que `clear()` y descartar la línea con `ignore`. Se lee en un bucle hasta recibir un número válido y positivo.

@include cpp code/hojas/clases.cpp 50-59
@paso 4. `main`
@include cpp code/hojas/clases.cpp 61-70
@resultado
@out code/out/h_clases.cpp.txt
Comprobación: con $d=2$ ($r=1$), área $4\pi=12{,}566$ y volumen $\tfrac43\pi=4{,}189$. La caja de volumen 1 admite 0,6 y 0,4 pero rechaza el segundo 0,6, y queda llena (libre = 0).
@fin
