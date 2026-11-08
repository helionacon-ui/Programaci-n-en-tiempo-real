## Valores, referencias y punteros {#t1-refs}

Cuando llamas a una función, ¿trabaja con tu variable o con una copia? De eso depende casi todo en C++.

| Forma | Sintaxis | ¿Modifica el original? |
|---|---|---|
| Por valor | `void f(int x)` | No: trabaja con una copia |
| Por referencia | `void f(int& x)` | Sí: `x` es otro nombre de la variable |
| Por referencia constante | `void f(const string& s)` | No, y **sin copiar** (se usa para objetos grandes) |
| Por puntero | `void f(int* p)` | Sí: `*p` es lo apuntado; `p` puede ser `nullptr` |

@include cpp code/t1/ref_punteros.cpp runout

:::tip Regla práctica
Objetos pequeños (`int`, `double`, `char`): por valor. Objetos grandes que solo lees (`string`, `vector`, tus clases): `const T&`. Si la función debe modificar el argumento: `T&`.
:::

### Pila y montón (stack y heap)

[[fig:mem]]

Las variables locales viven en la **pila** (stack): se crean al entrar en la función y desaparecen al salir. La memoria que pides con `new` vive en el **montón** (heap) hasta que haces `delete`. Si pierdes el puntero sin hacer `delete`, tienes una **fuga de memoria**. Si usas el puntero después de hacer `delete`, tienes un **puntero colgante**: comportamiento indefinido.

:::warn Qué suele fallar
- Devolver una referencia o un puntero a una variable local: la variable muere al salir de la función.
- `new` sin `delete` (fuga) o `delete` dos veces (error).
- `new[]` se libera con `delete[]`, no con `delete`.
- Un array pasado a una función pierde su tamaño: es solo un puntero.
:::

## Flujos de entrada y salida {#t1-flujos}

`cout` escribe, `cin` lee. `cin >> x` lee una palabra (se detiene en espacios). `getline(cin, s)` lee la línea entera. Un `stringstream` es un flujo que lee o escribe en un `string`: es la herramienta para trocear texto.

```cpp
istringstream in("Ana, E, 8");
string nombre, tipo; int hora; char coma;
getline(in, nombre, ',');   // "Ana"
in >> ws;                    // salta el espacio
getline(in, tipo, ',');     // "E"
in >> hora;                  // 8
```

Para volcar un objeto en un flujo se define `operator<<` (lo vemos en T2). Los ficheros usan `ifstream` y `ofstream` de `<fstream>` con la misma interfaz.

## string, vector, map y set {#t1-stl}

| Contenedor | Qué es | Coste típico |
|---|---|---|
| `string` | Texto que crece solo | Acceso `s[i]` O(1) |
| `vector<T>` | Array que crece al final | `push_back` O(1) amortizado; insertar/borrar en medio O(n) |
| `map<K,V>` | Pares clave→valor ordenados por clave | Buscar, insertar, borrar: O(log n) |
| `set<T>` | Conjunto ordenado sin repetidos | O(log n) |

### vector: size y capacity

`size()` son los elementos que hay. `capacity()` es el espacio reservado. Cuando `size` llega a `capacity`, el vector reserva un bloque mayor, **copia** todo y libera el antiguo. Por eso `reserve(n)` evita copias si sabes cuántos elementos vas a meter.

[[fig:vec]]

[[sim:vec]]

### map: ojo con `[]`

`m[clave]` **crea** la entrada con valor por defecto si no existía. Para consultar sin modificar, usa `find`. Para contar, `++m[clave]` es perfecto.

@include cpp code/t1/vector_map.cpp runout

### Iteradores y borrado

Un **iterador** es un «puntero inteligente» a un elemento de un contenedor. `begin()` apunta al primero y `end()` a **una posición después del último**. Para recorrer: `for (auto it = v.begin(); it != v.end(); ++it)`. Para borrar mientras recorres, usa el valor que devuelve `erase`:

```cpp
for (auto it = v.begin(); it != v.end();) {
    if (condicion(*it)) it = v.erase(it);   // erase devuelve el siguiente
    else ++it;
}
```

:::warn Qué suele fallar
- Después de `erase(it)`, `it` **ya no vale**. Hacer `++it` es comportamiento indefinido.
- `push_back` puede reubicar el vector: invalida iteradores y referencias a sus elementos.
- `v.size()` es **sin signo**: `v.size() - 1` con un vector vacío da un número enorme.
:::

## Lambdas y algoritmos {#t1-lambdas}

Una **lambda** es una función sin nombre que escribes en el sitio donde la usas: `[captura](parámetros){ cuerpo }`. La captura `[&]` toma las variables locales por referencia; `[=]`, por copia.

```cpp
int umbral = 3;
auto n = count_if(v.begin(), v.end(), [&](int x) { return x > umbral; });
auto it = find_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; });
sort(v.begin(), v.end(), [](int a, int b) { return a > b; });   // de mayor a menor
```

Algoritmos útiles de `<algorithm>`: `sort`, `stable_sort`, `find`, `find_if`, `count_if`, `max_element`, `min_element`, `remove_if` (con `erase`, el «borrado-eliminación»), `accumulate` (en `<numeric>`).

```cpp
v.erase(remove_if(v.begin(), v.end(), [](int x){ return x < 0; }), v.end());
```

## Plantillas y enlaces estructurados {#t1-plantillas}

Una **plantilla** es código que funciona con cualquier tipo: `template<typename T> T maximo(T a, T b) { return a > b ? a : b; }`. El compilador genera una versión por cada tipo con que la uses. `vector<T>` y `map<K,V>` son plantillas.

Los **enlaces estructurados** de C++17 desempaquetan un `pair` o una estructura: `for (const auto& [clave, valor] : mapa)`.

:::deep Más a fondo
**Por qué `vector` crece con factor multiplicativo.** Si cada realocación añadiera un número fijo de huecos, copiar $n$ elementos cada $k$ inserciones daría un coste total cuadrático. Con factor 2, las copias suman $1+2+4+\dots+n/2 < n$, es decir, el coste **amortizado** de `push_back` es constante. Puedes comprobarlo con el simulador: con factor 2 y 17 inserciones se copian $1+2+4+8+16 = 31$ elementos. Referencia: Stroustrup, *The C++ Programming Language* (4.ª ed.), capítulo sobre contenedores.
:::

:::formula Plantillas rápidas
- Contar palabras: `++hist[w];`
- ¿Existe la clave?: `if (m.find(k) != m.end())`
- Recorrer mapa: `for (const auto& [k, v] : m)`
- Borrar con condición: `it = v.erase(it);` o `v.erase(remove_if(...), v.end());`
- Ordenar por criterio: `sort(b, e, [](const T& a, const T& b){ return ...; });`
:::

@gl Referencia | Otro nombre para una variable ya existente. No se puede reasignar ni es nula.
@gl Puntero | Variable que guarda una dirección de memoria. Se desreferencia con `*`.
@gl Iterador | Objeto que apunta a un elemento de un contenedor y permite avanzar.
@gl Lambda | Función anónima escrita en el sitio de uso: `[captura](params){...}`.
@gl Plantilla (template) | Código genérico que se instancia para cada tipo concreto.
@gl size / capacity | Elementos que hay frente a espacio reservado en un vector.
@quiz ¿Qué hace `m["x"]` en un `map<string,int>` si «x» no existe? | Lanza una excepción | Devuelve un valor sin crear nada | Crea la entrada con valor 0 | Devuelve `end()` | 3 | `operator[]` inserta la clave con el valor por defecto. Para consultar sin modificar, usa `find` o `at`.
@quiz Tras `it = v.erase(it)`, ¿qué apunta `it`? | Al elemento borrado | Al siguiente elemento | A `begin()` | Es inválido | 2 | `erase` devuelve el iterador al elemento siguiente al borrado.
@quiz Un `vector` tiene size 8 y capacity 8. Haces `push_back`. Con factor 2, ¿qué capacity queda? | 9 | 16 | 10 | 8 | 2 | Se reserva el doble (16), se copian los 8 elementos y se libera el bloque antiguo.
@quiz ¿Cómo se pasa un `string` grande a una función que solo lo lee? | `string s` | `string& s` | `const string& s` | `string* s` | 3 | `const T&` evita la copia y garantiza que no se modifica.
@card ¿Qué devuelve `v.end()`? | Un iterador a una posición después del último elemento (no se puede desreferenciar).
@card Diferencia entre `find` y `[]` en un map | `find` no modifica el mapa; `[]` crea la entrada si no existe.
@card ¿Cuándo se invalidan iteradores de un vector? | Tras `push_back` con realocación y tras `erase` (el iterador borrado y los posteriores).
