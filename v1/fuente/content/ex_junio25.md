@ejercicio ex-junio25-1 | Junio 2025 · Ejercicio 1: nóminas de empleados (POO) | tema=herencia | tipo=final | exam=junio25 | n=1 | curso=2024-25
@enunciado
@stmt junio25 1
@antes
**Qué piden.** Una jerarquía con **clase base abstracta** (`C_Empleado`, con `get_sueldo()` virtual puro), dos derivadas (sueldo fijo y variable) y una empresa que guarda `vector<C_Empleado*>`.

**Teoría que usas.** Clase abstracta, método virtual puro, `operator<<` que las hijas puedan reutilizar (gancho virtual protegido), `max_element` con lambda para el mayor sueldo, `typeid` para contar tipos, borrado con iterador.
@paso 1. La base abstracta
El `operator<<` es `friend` y delega en un método virtual protegido (`imprimir`) para que las clases hijas lo **reutilicen sin reescribirlo**. `get_sueldo()` es virtual puro: la clase ya no se puede instanciar.

@include cpp code/exams/junio25_ej1.cpp 8-23
@paso 2. Las dos derivadas
Cada una implementa `get_sueldo()`: fijo → el valor; variable → base + complemento. El constructor delegado fija el resto por defecto.

@include cpp code/exams/junio25_ej1.cpp 25-44
@paso 3. `C_Empresa`
Contar tipos con `typeid`; el mayor sueldo con `max_element` y una lambda que compara `get_sueldo()` (devuelve un puntero al empleado); `borrar_empleado` con iterador.

@include cpp code/exams/junio25_ej1.cpp 46-78
@paso 4. `main`
@include cpp code/exams/junio25_ej1.cpp 80-91
@resultado
@out code/out/junio25_ej1.cpp.txt
@fin

@ejercicio ex-junio25-2 | Junio 2025 · Ejercicio 2: fábrica de patinetes (monitor) | tema=monitor | tipo=final | exam=junio25 | n=2 | curso=2024-25
@enunciado
@stmt junio25 2
@antes
**Qué piden.** Un monitor `C_Almacen` con dos vectores (cuerpos y ruedas), tres tipos de hilo (productor de cuerpos, productor de ruedas, ensamblador) y un cierre limpio a los 2 segundos mediante una bandera booleana.

**Teoría que usas.** Monitor con un `mutex` y una `condition_variable`; esperar «hay una pieza» con predicado; **condición de cierre** en el predicado para que ningún hilo se quede dormido; `join` de seis hilos.
@paso 1. Estado y condiciones
Un `mutex`, una `condition_variable`, `vector<string> cuerpos_, ruedas_` y `bool terminar_`. Condiciones: el ensamblador necesita `cuerpos_` ≥ 1 **y** `ruedas_` ≥ 2; **o** `terminar_`.
@paso 2. El monitor
Cada `poner_*` añade la pieza con el `mutex` y avisa. `sacar_piezas` espera con predicado `(hay piezas suficientes) || terminar_` y devuelve `false` si se despertó por el cierre sin piezas. `terminar()` pone la bandera con el `mutex` y despierta a **todos**.

@include cpp code/exams/junio25_ej2.cpp 12-48
@paso 3. Los tres tipos de hilo
Cada uno es un bucle `while (!a.debe_terminar())` con su `sleep_for` (500, 200 y 300 ms).

@include cpp code/exams/junio25_ej2.cpp 50-73
@paso 4. `main`
Crea dos hilos de cada tipo, duerme 2 s, llama a `terminar()` y hace `join` de los seis.

@include cpp code/exams/junio25_ej2.cpp 75-87
@paso 5. Comprobación
- ¿Puede quedarse un ensamblador dormido para siempre al terminar? No: el predicado incluye `terminar_` y `terminar()` hace `notify_all`.
- ¿Se leen/escriben los vectores siempre con el `mutex` tomado? Sí, dentro del monitor.
- ¿La salida por consola está protegida? Sí, con el `mutex` `consola`.
@resultado
Primeras líneas de una ejecución (el orden entre hilos puede cambiar):

@out code/out/junio25_ej2.cpp.txt 14
@fin
