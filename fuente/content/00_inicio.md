## De qué va esta asignatura {#inicio-que-es}

**Programación de Sistemas en Tiempo Real** te enseña dos cosas a la vez:

1. **Programar bien en C++**: clases, herencia, polimorfismo y la biblioteca estándar (strings, vectores, mapas).
2. **Programar cosas que van a la vez y con plazos**: varios hilos que comparten datos, esperan unos a otros y tienen que acabar a tiempo.

Un sistema de tiempo real no es «un sistema muy rápido». Es un sistema que tiene que **responder dentro de un plazo**. Un airbag que se infla un segundo tarde es un airbag que no funciona.

:::tip Idea clave
En tiempo real importa **cuándo** se obtiene un resultado, no solo **cuál** es. Un resultado correcto fuera de plazo es un resultado incorrecto.
:::

El examen mezcla las dos mitades: un ejercicio grande de **programación orientada a objetos** (el 70 %) y uno de **concurrencia** (el 30 %). En convocatorias antiguas también caía **planificación** con cálculo de tiempos de respuesta. La guía cubre todo.

## Qué necesitas saber antes de empezar {#inicio-previos}

Si partes de cero, estos cinco conceptos son suficientes para entrar en el tema T1. Los repasamos aquí en pocas líneas.

### Variable, tipo y memoria

Una **variable** es un trozo de memoria con nombre y con un **tipo** que dice cuántos bytes ocupa y cómo se interpretan. `int n = 5;` reserva 4 bytes (normalmente) y guarda el número 5.

[[fig:mem]]

### Función

Una **función** recibe valores, hace algo y puede devolver un valor. En C++ los parámetros se **copian** por defecto. Para no copiar (o para modificar el original) se pasa una **referencia**: `void f(int& x)`.

### Compilar y ejecutar

El **compilador** (`g++`) traduce el texto `.cpp` a un programa ejecutable. Si hay un error de sintaxis, no hay programa. En los exámenes recientes, **si el programa no compila, la nota se divide por 2**. Compilar tu código a menudo es la mejor costumbre que puedes tener.

```
g++ -std=c++17 -Wall -Wextra -pthread programa.cpp -o programa
./programa
```

### Objeto y clase

Una **clase** es un molde: dice qué datos (atributos) y qué operaciones (métodos) tiene algo. Un **objeto** es una pieza concreta hecha con ese molde. `std::string` es una clase; `std::string s{"hola"};` es un objeto.

### Hilo

Un **hilo** es una secuencia de instrucciones que el sistema operativo puede ejecutar a la vez que otras. Dos hilos que tocan la misma variable sin cuidado producen resultados impredecibles. Todo el bloque de concurrencia va de evitar eso.

## Cómo usar la guía {#inicio-como}

- **Orden recomendado:** T0 → T1 → T2 → T3 (programación, 70 % del examen), después T4 → T5 (concurrencia) y, si tu convocatoria lo pide, T6 (planificación).
- Cada tema tiene teoría con intuición, ejemplos, un simulador, un recuadro **«Qué suele fallar»** y las fórmulas o plantillas clave.
- En **Exámenes resueltos**, abre cada paso solo después de intentarlo tú. Los pasos están plegados a propósito.
- Marca tu progreso abajo. Se guarda en tu navegador.
- Pulsa `/` para buscar en cualquier momento.

:::warn Qué suele fallar al estudiar esta asignatura
Leer soluciones no es lo mismo que saber escribirlas. El examen es **escribir código a mano** (o en un editor sin ayuda) con una hoja de referencia de la biblioteca estándar. Practica escribiendo, no leyendo.
:::

@check c-t0 | He entendido qué es tiempo real duro, firme y blando (T0)
@check c-t1 | Sé usar string, vector, map, set e iteradores sin mirar la guía (T1)
@check c-t2 | Sé escribir una clase con constructor, `operator<<` y regla de 0/3/5 (T2)
@check c-t3 | Sé escribir una jerarquía con clase abstracta, `virtual`, destructor virtual y contenedor de punteros (T3)
@check c-t4 | Sé crear hilos, usar `mutex`, `lock_guard` y `scoped_lock` (T4)
@check c-t5 | Sé escribir un monitor con `condition_variable` y predicado (T5)
@check c-t6 | Sé calcular prioridades, bloqueos y tiempos de respuesta (T6)
@check c-t7 | Sé explicar el error del Patriot y por qué 0,1 no es exacto en binario (T7)
@check c-pr | He escrito y ejecutado las tres prácticas
@check c-ex1 | He resuelto sin ayuda los cuatro exámenes recientes de «Empieza por aquí»
@check c-sim | He hecho al menos dos simulacros completos con cronómetro
