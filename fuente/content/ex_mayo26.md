@ejercicio ex-mayo26-1 | Mayo 2026 · Ejercicio 1: suscripciones de una plataforma (POO) | tema=herencia | tipo=final | exam=mayo26 | n=1 | curso=2025-26
@enunciado
@stmt mayo26 1
@antes
**Qué piden.** Tres clases: una base (`C_Suscripcion`), una derivada (`C_Suscripcion_Premium`) y una que contiene punteros a la base (`C_Plataforma`). Es el patrón de examen de los últimos años.

**Teoría que usas.**
- Constructor delegado y lista de inicialización (T2).
- `operator<<` que delega en un `to_string()` virtual y protegido (T3).
- Método virtual `factura_total()` y redefinición con `override`.
- `vector<Base*>`, `typeid(*p)` para distinguir el tipo real, `find` en `string`.
- Borrar de un `vector` con iterador (T1).
@paso 1. Clase base: atributos, constructores y `to_string` virtual
Atributos `protected` (la derivada los necesita en `factura_total`) y un constructor delegado que reutiliza el completo con precio 0. El destructor es **virtual** porque la clase va a ser base de una jerarquía con punteros.

El `operator<<` es `friend` y **no** es virtual: llama a `to_string()`, que sí lo es. Así, `cout << *p` con `p` de tipo `C_Suscripcion*` imprime según el tipo real.

@include cpp code/exams/mayo26_ej1.cpp 8-37

*Por qué así:* si pusieras el `operator<<` directamente en cada clase no sería polimórfico, porque los operadores libres no son virtuales.
@paso 2. Clase derivada: constructores, redefinición de `factura_total` y de `to_string`
Tres constructores: el completo, el delegado (ID, titular, soporte → precios a 0) y el que copia una suscripción (`C_Suscripcion{base}` usa el constructor de copia de la base). La redefinición de `to_string` reutiliza el de la base con **llamada calificada** (`C_Suscripcion::to_string()`), que no es polimórfica y por eso no entra en bucle.

@include cpp code/exams/mayo26_ej1.cpp 39-62

*Por qué `override`:* si te equivocas en la firma (por ejemplo, olvidas `const`), el compilador avisa en lugar de crear un método nuevo que nadie llama.
@paso 3. `C_Plataforma`: vector de punteros, añadir y cancelar
El vector es de `C_Suscripcion*`: sin punteros habría **slicing** y el premium se convertiría en estándar. `add_suscripcion` recorre buscando el ID y solo añade si no existe. `cancelar_suscripcion` necesita un **iterador** para poder usar `erase`; tras `erase` se devuelve enseguida, así que no hace falta actualizar el iterador.

@include cpp code/exams/mayo26_ej1.cpp 64-82

:::note Memoria
El enunciado dice «libera la memoria». Eso solo tiene sentido si la plataforma es **propietaria** de objetos creados con `new`. Aquí `main` crea las suscripciones en la pila, así que un `delete` sería un error grave. Si prefieres que la plataforma sea dueña, `add_suscripcion` debería recibir un puntero (o un `unique_ptr`) y `cancelar_suscripcion` haría `delete *it;` antes del `erase`.
:::
@paso 4. Contar tipos con `typeid`, buscar por nombre e imprimir
`typeid(*s) == typeid(C_Suscripcion)` compara el **tipo real** (la clase es polimórfica, tiene `virtual`). Hay que desreferenciar: `typeid(s)` sería el tipo del puntero. `buscar_por_nombre` cuenta con `buscar_titular`, que usa `find` y `npos`.

@include cpp code/exams/mayo26_ej1.cpp 83-103
@paso 5. `main` de prueba y salida
Se prueba cada requisito: ID duplicado (devuelve `false`), conteo por tipos, búsqueda parcial, `factura_total` a través de una referencia a la base (polimorfismo), el constructor desde una base y cancelar un ID que existe y otro que no.

@include cpp code/exams/mayo26_ej1.cpp 105-124
@paso 6. Comprobación mental antes de entregar
- ¿`;` tras cada `}` de clase?
- ¿`#include <typeinfo>` (para `typeid`), `<sstream>` y `<vector>`?
- ¿Los métodos que no modifican llevan `const`?
- ¿`factura_total` es `virtual` en la base y `override` en la derivada?
- ¿Se imprime exactamente el formato del enunciado (`#101 (15.5€)`)?
@resultado
Salida del programa (compilado con `-Wall -Wextra`, sin avisos):

@out code/out/mayo26_ej1.cpp.txt
@ojo
La solución de referencia **no compila** tal como está: en `C_SUSCRIPCION_PREMIUM::to_string` llama a `C_SUSCRIPCION::imprimir(os)`, un método que no existe (debería ser `C_SUSCRIPCION::to_string(os)`). Con la regla de 2026 («si no compila, la puntuación se divide por 2») esto cuesta la mitad de la nota. Además:
- usa `typeid` sin `#include <typeinfo>`;
- nombra los métodos `total_estandar`/`total_premium`, mientras que el enunciado pide `contar_estandar`/`contar_premium`;
- `cancelar_suscripcion` no libera nada (aquí es correcto porque los objetos viven en `main`, pero hay que decirlo).
@fin

@ejercicio ex-mayo26-2 | Mayo 2026 · Ejercicio 2: robots y cintas transportadoras (concurrencia) | tema=hilos | tipo=final | exam=mayo26 | n=2 | curso=2025-26
@enunciado
@stmt mayo26 2
@antes
**Qué piden.** Tres hilos (robots), cada uno necesita **dos** recursos (cintas) a la vez, que se modelan con `mutex`. Después de conseguirlos: duerme, imprime, libera y duerme otra vez.

**Teoría que usas.**
- `std::thread` con argumentos por referencia (`std::ref`).
- Exclusión mutua con `mutex` y varios recursos a la vez: `scoped_lock` / `std::lock` (T4).
- Un `mutex` separado para la consola.
- `join` de todos los hilos.
@paso 1. Identifica los recursos y qué robot usa cuál
Cuatro `mutex`: tres cintas (`ct1`, `ct2`, `ct3`) y la consola. Según la figura: robot 1 usa CT1 y CT3, robot 2 usa CT1 y CT2, robot 3 usa CT2 y CT3. Se pasan **por referencia** a la función del hilo.
@paso 2. ¿Por qué hay riesgo de interbloqueo?
Los tres robots comparten cintas por parejas: R1-R2 comparten CT1, R2-R3 comparten CT2 y R1-R3 comparten CT3. Si cada robot cogiera primero «su primera cinta» con `lock()` y después la segunda, podría darse la espera circular R1→R2→R3→R1. Hay que tomar las **dos a la vez**.
@paso 3. La función del hilo
`scoped_lock cintas{m1, m2}` toma los dos `mutex` con el algoritmo de `std::lock` (sin interbloqueo, da igual el orden) y los libera al salir del bloque. El mensaje se imprime dentro de un ámbito interior con otro `mutex` (la consola), porque dos hilos con **cintas distintas** también pueden imprimir a la vez.

@include cpp code/exams/mayo26_ej2.cpp 9-25
@paso 4. `main`: crear los hilos y esperar
Los argumentos que son referencias se envuelven en `ref(...)`; si no, `thread` los **copiaría** y los `mutex` no se pueden copiar (no compila).

@include cpp code/exams/mayo26_ej2.cpp 27-33
@paso 5. Comprobación
- ¿Se pone la liberación (`}` del ámbito) **antes** del segundo `sleep`? Sí: mientras prepara la siguiente pieza el robot no retiene las cintas.
- ¿El `mutex` de la consola se toma solo durante el `cout`? Sí.
- ¿Hay `join` para cada hilo? Sí; sin él el programa aborta.
@resultado
Una ejecución (el orden entre robots puede variar; lo que no varía es que cada uno procesa sus 3 piezas y termina):

@out code/out/mayo26_ej2.cpp.txt
@fin
