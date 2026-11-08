## Formato del examen {#examen-formato}

Lo que dicen los exámenes más recientes del material (cursos 2023-24 a 2025-26):

| Dato | Valor |
|---|---|
| Duración | 2 h 30 min |
| Ejercicio 1 | Programación orientada a objetos (**70 %**) |
| Ejercicio 2 | Concurrencia (**30 %**) |
| Compilación | En 2026: «si el programa no compila, la puntuación se divide por 2» |
| Ayuda | Hoja con referencia de clases de la biblioteca estándar (string, pair, vector, map, set…) |

Antes (cursos 2015-16 a 2016-17) el examen duraba 3 h y tenía además un ejercicio de **planificación** (prioridades, techos, bloqueos y tiempos de respuesta), una pregunta de desarrollo y un ejercicio de prácticas.

### Evaluación del curso 2025-26

| Parte | Peso | Condición |
|---|---|---|
| Examen de programación | 70 % | Nota mínima 4 sobre 10 |
| Seguimiento de prácticas (3 cuestionarios) | 20 % | Sin nota mínima |
| Trabajo de planificación | 10 % | Sin nota mínima |

Se aprueba si la nota del examen supera el mínimo y la suma de las partes es al menos 5. Hay dos convocatorias de recuperación: el 8 de junio (tarde) y el 20 de julio (mañana). Se mantienen las notas de las actividades con nota superior a la mínima.

:::note Compruébalo
Esas fechas y pesos son las del curso 2025-26. Si cursas otro año, confirma en la información oficial de la asignatura.
:::

## Qué cae más {#examen-estadistica}

Contamos cuántos ejercicios de cada tema aparecen en los 26 exámenes del material.

[[fig:stats]]

Lectura rápida:

- **C++ con la biblioteca estándar, clases y herencia** suman la mayor parte. Son el 70 % del examen reciente.
- En los últimos años la concurrencia es **siempre** un monitor con `mutex` y `condition_variable` (o una variante con varios `mutex` y `scoped_lock`).
- La **planificación** solo aparece en los exámenes antiguos, pero sigue siendo materia del curso (trabajo de planificación).

## Estrategia para el examen {#examen-estrategia}

1. **Lee los dos ejercicios enteros** (5 minutos). Decide el orden: empieza por el que tengas más claro.
2. **Reparte el tiempo** según el peso: unos 105 min para POO y 45 min para concurrencia, más 10-15 min de revisión.
3. **Escribe el esqueleto primero**: `#include`, clases con atributos y firmas de métodos. Rellena después.
4. **Compila mentalmente** al final: `;` tras las llaves de clase, `const` donde corresponda, `#include` de todo lo que uses, `override` y `virtual`.
5. **Haz el `main`** que pide el enunciado, aunque sea corto. Suele puntuar.
6. En concurrencia, **dibuja** los estados compartidos: qué variable protege cada `mutex` y qué condición espera cada `condition_variable`.

:::warn Qué suele fallar en el examen
- Olvidar el `;` al final de una clase.
- Usar `map[clave]` para **consultar** (crea la entrada). Usa `find` o `at`.
- Borrar de un `vector` dentro de un `for` sin actualizar el iterador.
- Esperar en una `condition_variable` sin predicado (se despierta en falso o se pierde el aviso).
- Dos `mutex` bloqueados en orden distinto: interbloqueo.
:::

@card ¿Cuánto vale el ejercicio de concurrencia en los exámenes recientes? | El 30 % de la nota del examen (POO el 70 %).
@card ¿Qué pasa si el programa no compila (examen 2026)? | La puntuación se divide por 2.
@card ¿Cuánto dura el examen reciente? | 2 h 30 min.
