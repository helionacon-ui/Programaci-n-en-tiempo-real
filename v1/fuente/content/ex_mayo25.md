@ejercicio ex-mayo25-1 | Mayo 2025 · Ejercicio 1: paquetería (POO) | tema=herencia | tipo=final | exam=mayo25 | n=1 | curso=2024-25
@enunciado
@stmt mayo25 1
@antes
**Qué piden.** Tres clases: `C_Envio` (base), `C_Envio_Internacional` (derivada) y `C_Centro_Logistico`, que guarda un `vector<C_Envio*>` mezclado.

**Teoría que usas.** Constructor delegado, `to_string()` virtual protegido con `operator<<` friend, método virtual `coste_total`, contar por tipo real con `typeid`, `find` en `string`, borrar con iterador (T1-T3).

La diferencia con el ejercicio de suscripciones es mínima: es **el mismo patrón**. Por eso conviene practicarlo hasta escribirlo sin pensar.
@paso 1. Clase base `C_Envio`
Atributos privados (la derivada los usa con los `get`), `to_string()` virtual protegido, destructor virtual, `coste_total()` virtual que devuelve el precio.

@include cpp code/exams/mayo25_ej1.cpp 9-33
@paso 2. Clase derivada `C_Envio_Internacional`
Reutiliza el texto de la base con llamada calificada. `coste_total()` suma la aduana usando `C_Envio::coste_total()`: si cambia la regla en la base, la derivada sigue bien. El tercer constructor copia un `C_Envio` (`C_Envio{e}`).

@include cpp code/exams/mayo25_ej1.cpp 35-54
@paso 3. El centro logístico: contar por tipo y buscar
Para contar, `count_if` con lambda (T1) o un bucle. El tipo real se pregunta con `typeid(*p)`. Para contar destinatarios que contienen un texto, se delega en `buscar_destinatario`.

@include cpp code/exams/mayo25_ej1.cpp 56-72
@paso 4. Añadir sin duplicar y borrar
`add_envio` busca con `find_if` si ya existe el código; `borrar_envio` localiza el elemento y hace `erase` con el iterador.

@include cpp code/exams/mayo25_ej1.cpp 74-93
@paso 5. `main`
@include cpp code/exams/mayo25_ej1.cpp 95-108
@resultado
@out code/out/mayo25_ej1.cpp.txt
@fin

@ejercicio ex-mayo25-2 | Mayo 2025 · Ejercicio 2: puente de vía única (monitor) | tema=monitor | tipo=final | exam=mayo25 | n=2 | curso=2024-25
@enunciado
@stmt mayo25 2
@antes
**Qué piden.** Un monitor `C_Puente`: un solo tren a la vez y, si en el sentido opuesto esperan **más de 3** trenes, se les da prioridad.

**Teoría que usas.** Monitor con un `mutex`, una `condition_variable` y **predicado compuesto** (T5); contadores de espera por sentido; `unique_lock` para poder soltar el `mutex` mientras el tren cruza.
@paso 1. Estado compartido
- `esperando_[2]`: trenes en espera en cada sentido.
- `ocupado_`: ¿hay un tren cruzando?
- Un `mutex` para todo ese estado y otro para la consola.
@paso 2. La condición para cruzar
Un tren puede cruzar si **no hay otro cruzando** y **no tiene que ceder**. Con la regla literal («cedo si el otro sentido tiene más de 3 esperando») hay un problema que se ve al ejecutar el `main` pedido, con 10 trenes en cada sentido: ambos sentidos superan 3 a la vez, **ambos ceden** y nadie cruza nunca (**interbloqueo**).

La solución es un **desempate asimétrico**: cede el sentido que tiene **menos** trenes esperando, y si empatan, cede siempre el mismo (sur→norte).
@paso 3. El método que cruza
El tren se suma a la cola, espera con predicado, se quita de la cola, marca `ocupado_`, **suelta el `mutex` mientras cruza** (si lo mantuviera, nadie más podría ni registrarse como esperando) y al terminar lo vuelve a tomar, libera el puente y avisa a todos.

@include cpp code/exams/mayo25_ej2.cpp 11-48
@paso 4. `main`: 10 trenes por sentido
@include cpp code/exams/mayo25_ej2.cpp 50-58
@paso 5. Comprobación
- ¿Todos los hilos terminan? Con la regla asimétrica, sí (el programa se ejecuta en pocos centenares de milisegundos).
- ¿Se cruza de uno en uno? `ocupado_` lo garantiza: la condición `!ocupado_` y el cambio de `ocupado_` se hacen con el mismo `mutex`.
- ¿Puede haber inanición (un tren que no cruza nunca)? En esta regla la prioridad cambia al vaciarse las colas; en el ejemplo, todos cruzan.
@resultado
Los 20 trenes cruzan, de uno en uno. Ejemplo de las primeras líneas de una ejecución:

@out code/out/mayo25_ej2.cpp.txt 14
@ojo
La regla literal del enunciado («cruza solo si el otro sentido tiene ≤ 3 esperando»), implementada tal cual, **interbloquea** con el `main` que pide el propio enunciado: con 10 trenes por lado, ambos sentidos tienen más de 3 esperando al principio y cada uno cede al otro. Hay que añadir un criterio de desempate (aquí, comparar colas y, si empatan, un sentido fijo).
@fin
