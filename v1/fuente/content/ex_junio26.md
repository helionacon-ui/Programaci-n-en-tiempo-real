@ejercicio ex-junio26-1 | Junio 2026 · Ejercicio 1: central de eventos (POO) | tema=herencia | tipo=final | exam=junio26 | n=1 | curso=2025-26
@enunciado
@stmt junio26 1
@antes
**Qué piden.** Una interfaz (`C_Recibidor`), dos implementaciones (`C_Pantalla`, `C_Alarma`) y una **central** que guarda, para cada tema, los receptores suscritos. Es el patrón *publicación-suscripción* en versión mínima.

**Teoría que usas.**
- Clase **abstracta** con métodos virtuales puros y destructor virtual (T3).
- Constructor delegado, `override`.
- `map<string, vector<C_Recibidor*>>`: `find` frente a `operator[]` (T1).
- `substr` para trocear una línea; `isdigit` de `<cctype>`.
@paso 1. La interfaz
Solo métodos virtuales puros y un **destructor virtual** (aunque aquí no se haga `delete`, es la costumbre correcta en una base polimórfica). `get_nombre` es `const` porque no modifica el objeto.

@include cpp code/exams/junio26_ej1.cpp 8-14
@paso 2. `C_Pantalla`: ajustar el texto al ancho
Un bucle que avanza `ancho_` caracteres cada vuelta y usa `substr(i, ancho_)`. Cuando queda menos texto del ancho, `substr` devuelve solo lo que hay. El constructor delegado fija el ancho a 80.

@include cpp code/exams/junio26_ej1.cpp 16-28

*Por qué `i < msg.size()` y no `<=`:* con `<=`, si el texto mide justo un múltiplo del ancho, se imprimiría una línea vacía de más.
@paso 3. `C_Alarma`: ¿contiene algún dígito?
Se recorre el mensaje y se imprime si algún carácter es dígito. El bucle usa `unsigned char`: `isdigit` está definido para valores entre 0 y 255 (o `EOF`); con un `char` negativo (por ejemplo, la `ñ` en UTF-8) el comportamiento es indefinido.

@include cpp code/exams/junio26_ej1.cpp 30-39
@paso 4. `C_Central`: registrar temas y suscribirse
`add_tema` usa `suscritos_[t];` a propósito: `operator[]` **crea** el vector vacío si no existía y no hace nada si ya estaba (justo lo que pide el enunciado). `suscribirse`, en cambio, **no puede** usar `[]`: crearía el tema que se quería comprobar que ya existía. Usa `find`.

@include cpp code/exams/junio26_ej1.cpp 41-57
@paso 5. Enviar valores e imprimir
`enviar_valor` busca el tema y llama a `recibir_valor` de cada receptor: **polimorfismo**; la central no sabe si habla con una pantalla o con una alarma. `operator<<` escribe en el flujo `os` que recibe (no en `cout`).

@include cpp code/exams/junio26_ej1.cpp 58-73
@paso 6. `main` y salida
@include cpp code/exams/junio26_ej1.cpp 75-90
@resultado
La pantalla de 15 caracteres parte «Temperatura actual: 25 grados» en dos líneas, la alarma lo imprime entero (tiene dígitos) y «humedad sin dato» no se imprime en la alarma (no tiene números):

@out code/out/junio26_ej1.cpp.txt
@ojo
En la solución de referencia:
- `operator<<` escribe con `cout << ...` en lugar de `os << ...`: si alguien imprime la central en un `ostringstream` o en un fichero, el texto sale por la consola.
- `C_Recibidor` (declarado como `struct`) **no tiene destructor virtual**: borrar un receptor a través de un puntero a la base sería comportamiento indefinido.
- `isdigit(c)` se llama con `char` con signo; con acentos o `ñ` es comportamiento indefinido.
- `for (int i=0; i<=val.size()/ancho; ++i)` imprime una línea vacía de más cuando la longitud es múltiplo exacto del ancho, y compara `int` con `size_t`.
@fin

@ejercicio ex-junio26-2 | Junio 2026 · Ejercicio 2: barreras (monitores) | tema=monitor | tipo=final | exam=junio26 | n=2 | curso=2025-26
@enunciado
@stmt junio26 2
@antes
**Qué piden.** Dos monitores: `Barrera` (todos esperan hasta que alguien llama a `abrir`) y `Barrera_Num` (se abre sola cuando han llegado `max_hilos`). En ambas, una vez abierta, **nadie** vuelve a bloquearse.

**Teoría que usas.**
- Monitor = datos + `mutex` + `condition_variable` (T5).
- Espera con **predicado** y `notify_all`.
- Salida por consola protegida con su propio `mutex`.
@paso 1. El estado y la condición
En `Barrera`, el estado es una sola bandera `abierta_`. La condición para seguir es «`abierta_` es `true`». Protegida por un `mutex`. Una vez a `true`, nunca vuelve a `false`: por eso los hilos que llegan tarde pasan sin esperar (el predicado ya es cierto y `wait` ni se duerme).
@paso 2. `Barrera`
`entrar` hace `wait` con predicado. `abrir` cambia la bandera **con el mutex** y despierta a **todos** con `notify_all` (si usaras `notify_one`, solo saldría un hilo).

@include cpp code/exams/junio26_ej2.cpp 13-27
@paso 3. `Barrera_Num`
El estado ahora es un contador `llegados_` y la bandera. Cada hilo que entra cuenta; si es el último (`>= max_`), abre y avisa a todos; si no, espera el predicado. El hilo que abre **no espera** (ya sabe que está abierta).

@include cpp code/exams/junio26_ej2.cpp 29-43
@paso 4. `main`
Un `mutex` global `consola` y una función `imprimir` que lo toma para cada línea. En el primer ejemplo, cinco hilos entran y se bloquean; el `main` espera 100 ms, abre y todos salen. En el segundo, los hilos llegan escalonados cada 30 ms y la barrera se abre al llegar el tercero: los dos últimos pasan directamente.

@include cpp code/exams/junio26_ej2.cpp 45-69
@paso 5. Comprobación
- ¿Todos los cambios de `abierta_` y `llegados_` se hacen con el `mutex` tomado? Sí.
- ¿Hay `notify_all` tras cambiar la bandera? Sí.
- ¿Puede quedar algún hilo dormido para siempre? No: o la barrera la abre `main` o el hilo número `max_` la abre solo.
@resultado
Una ejecución (el orden entre hilos puede cambiar, el patrón no): primero los cinco entran, luego `--- abriendo Barrera ---`, luego todos salen; en `Barrera_Num` los dos primeros esperan al tercero.

@out code/out/junio26_ej2.cpp.txt
@ojo
La solución de referencia bloquea el `mutex` en el **constructor** y lo desbloquea desde **otro hilo** (`abrir`). En C++, un `std::mutex` solo puede liberarlo el hilo que lo bloqueó: hacerlo desde otro es comportamiento **indefinido**. Además, lee la bandera `abierta` sin protección (carrera de datos). Funciona «por casualidad» con ciertas implementaciones, pero no es correcto. La forma correcta es la de esta solución: `condition_variable` con predicado.
@fin
