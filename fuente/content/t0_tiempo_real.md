## Qué es un sistema de tiempo real {#t0-que-es}

Un **sistema de tiempo real** es un sistema cuya corrección depende de dos cosas: que el resultado sea correcto **y** que llegue **a tiempo**. El tiempo no es un adorno: forma parte de la especificación.

Piensa en tres ejemplos:

- El **airbag** de un coche. Si se infla 50 ms tarde, ya no sirve.
- Un **reproductor de vídeo**. Si un fotograma llega tarde, se nota un salto, pero la película sigue.
- Un **cajero** que responde en 2 s en lugar de 1 s. Molesta, nada más.

Los tres son «tiempo real», pero fallar tiene consecuencias muy distintas. De ahí la clasificación.

### Tiempo real duro, firme y blando

| Tipo | Si pierde el plazo… | Ejemplo |
|---|---|---|
| **Duro** (*hard*) | Fallo catastrófico. Nunca debe pasar. | Airbag, control de vuelo |
| **Firme** (*firm*) | El resultado tardío no sirve y se descarta, pero el sistema sigue. Se toleran pocos fallos. | Fotograma de una cadena de producción que ya pasó |
| **Blando** (*soft*) | El resultado tardío sirve, pero con menos valor. | Vídeo en streaming, interfaz de usuario |

:::tip Intuición
Pregúntate: «¿qué pasa si esta tarea acaba tarde?». Si la respuesta es «alguien puede morir o se rompe una máquina», es duro. Si es «el resultado ya no vale», es firme. Si es «vale menos», es blando.
:::

**Vídeo para entrar en materia** (4 min, en inglés): qué significa «tiempo real» y por qué no es «ir rápido».

[[yt:ocHjg6bVZX0|What is a Real-Time System?|JLabs|4:45]]

## Plazos, periodos y jitter {#t0-plazos}

Una **tarea** es una unidad de trabajo del sistema. Tres números la describen:

- **C**: tiempo de cómputo en el peor caso.
- **T**: periodo (cada cuánto se activa, si es periódica) o separación mínima entre activaciones (si es esporádica).
- **D**: plazo relativo (cuánto tiempo tiene desde que se activa hasta que debe acabar).

Normalmente $D \le T$. Si $D = T$, el plazo de una activación termina justo cuando llega la siguiente.

El **jitter** es la variación del instante real en que una tarea periódica arranca o termina respecto al instante ideal. En el código, `sleep_until` produce periodos estables, mientras que `sleep_for` acumula deriva (lo vemos en T4).

[[fig:cyc]]

## Dos filosofías de diseño {#t0-diseno}

- **Dirigido por tiempo** (*time-triggered*): todo ocurre en instantes fijados de antemano (un reloj manda). Es predecible y fácil de analizar. Se implementa con un **ejecutivo cíclico** (T6).
- **Dirigido por eventos** (*event-triggered*): las tareas se activan cuando ocurre algo (una interrupción, un mensaje). Es flexible y responde rápido, pero analizarlo es más difícil. Se implementa con **prioridades** y un planificador expulsivo (T6).

## Ciclo de vida de un sistema de tiempo real {#t0-ciclo}

[[fig:vida]]

Se parte de los **requisitos** (incluidos los temporales), se hace el **diseño** y la **implementación**, y se **verifica** que se cumplen los plazos. Esa verificación no se hace «probando a ver si va»: se hace con **análisis** (T6), porque un fallo de plazo puede aparecer una vez cada millón de ejecuciones.

## Qué necesita un sistema operativo de tiempo real {#t0-so}

- **Determinismo**: tiempos de respuesta acotados y conocidos para sus servicios.
- **Planificación por prioridades con expulsión**: la tarea más urgente interrumpe a una menos urgente.
- **Temporizadores precisos** y mecanismos para tareas periódicas.
- **Sincronización** sin inversión de prioridad no acotada (T6).
- **Gestión de memoria** predecible: evitar la reserva dinámica impredecible durante la parte crítica.

:::warn Qué suele fallar
- Confundir «rápido» con «tiempo real». Un sistema lento pero predecible puede ser de tiempo real; uno rápido en media pero con picos no.
- Diseñar con el tiempo **medio** en lugar del **peor caso** (C es siempre el peor caso).
:::

:::formula Definiciones clave
- Tarea periódica: $(C, T, D)$ con $D \le T$ habitual.
- Utilización de una tarea: $U_i = C_i / T_i$.
- Utilización del sistema: $U = \sum_i C_i/T_i$.
:::

@gl Tiempo real duro | Sistema donde perder un plazo es un fallo catastrófico.
@gl Tiempo real firme | Un resultado fuera de plazo no vale y se descarta; el sistema puede seguir.
@gl Tiempo real blando | Un resultado fuera de plazo vale, pero menos.
@gl Jitter | Variación del instante real de activación o finalización respecto al ideal.
@gl Plazo (D) | Tiempo máximo desde la activación de una tarea hasta que debe terminar.
@gl Periodo (T) | Tiempo entre dos activaciones consecutivas de una tarea periódica.
@gl Tiempo de cómputo (C) | Tiempo máximo de ejecución de una tarea (peor caso).
@gl Ejecutivo cíclico | Planificación estática: un plan fijo se repite cada ciclo principal.
@quiz ¿Qué es un sistema de tiempo real firme? | El resultado tardío vale poco, pero se acepta | El resultado tardío no sirve y se descarta, pero el sistema continúa | Perder un plazo es catastrófico | Ningún plazo es importante | 2 | En el tiempo real firme un resultado fuera de plazo se descarta pero no hay catástrofe; en el duro sí la hay, y en el blando sirve con menos valor.
@quiz ¿Qué mide el jitter? | La utilización de la CPU | La variación del instante de activación respecto al ideal | El tiempo de cómputo medio | El número de hilos | 2 | Es la variabilidad temporal de una tarea periódica.
@quiz Para verificar los plazos de un sistema de tiempo real duro hay que usar… | El tiempo de cómputo medio | El tiempo de cómputo del peor caso | Un solo intento de prueba | El tiempo de compilación | 2 | Los plazos duros se garantizan con el peor caso (C), no con la media.
@card Tiempo real duro vs firme vs blando | Duro: fallo catastrófico. Firme: resultado tardío inútil. Blando: resultado tardío con menos valor.
@card ¿Qué es C, T y D? | C = cómputo en peor caso, T = periodo, D = plazo relativo.
