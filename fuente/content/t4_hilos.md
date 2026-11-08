## Crear hilos con `std::thread` {#t4-hilos}

Un `std::thread` ejecuta una función **a la vez** que el resto del programa. El hilo empieza a correr en cuanto lo construyes.

```cpp
void saluda(string quien, int veces) { for (int i = 0; i < veces; ++i) cout << quien << '\n'; }
int main() {
    thread t{saluda, "hilo", 3};     // se copian los argumentos
    saluda("main", 3);                // main sigue trabajando
    t.join();                          // main espera a que t termine
}
```

Reglas que debes saber de memoria:

- Antes de destruir un `thread` hay que hacer **`join()`** (esperar) o `detach()` (soltarlo). Si no, el programa termina con `std::terminate`.
- Los argumentos se **copian** al hilo. Para pasar por referencia, usa **`std::ref(x)`**: `thread t{f, std::ref(contador)};`.
- Para un método de objeto: `thread t{&Clase::metodo, &objeto, args...}`. Con una lambda es más cómodo.
- Compila con `-pthread` en Linux.
- Un vector de hilos: `vector<thread> v; v.emplace_back(f, i); for (auto& h : v) h.join();`.

## La condición de carrera {#t4-carrera}

Dos hilos suben un contador compartido: `++x`. Parece una sola instrucción, pero la CPU hace **tres**: leer `x` a un registro, sumar, escribir. Si los dos leen el mismo valor antes de que ninguno escriba, uno de los incrementos se **pierde**.

[[fig:race]]

[[sim:race]]

La zona de código que accede al dato compartido es la **sección crítica**. Debe ejecutarla **un solo hilo a la vez** (**exclusión mutua**).

## Mutex y bloqueos {#t4-mutex}

Un **`mutex`** es una puerta con cerrojo: un hilo hace `lock()` y entra; los demás esperan hasta el `unlock()`. No los uses a pelo: si olvidas el `unlock` (por un `return` o una excepción) el programa se queda bloqueado. Usa **bloqueos RAII**, que desbloquean solos al salir del ámbito:

| Herramienta | Cuándo |
|---|---|
| `lock_guard<mutex> lk{m};` | Un `mutex`, sección crítica simple |
| `scoped_lock lk{m1, m2};` | **Varios** `mutex` a la vez, sin interbloqueo |
| `unique_lock<mutex> lk{m};` | Cuando puedes necesitar desbloquear, o con `condition_variable` (T5) |
| `atomic<int> x;` | Un único contador o bandera: operación indivisible sin `mutex` |

@include cpp code/t4/contador.cpp runout

:::tip Cómo piensa un buen diseño
Un `mutex` **protege datos**, no código. Para cada dato compartido, deberías poder decir «lo protege el `mutex` X». Si no puedes, hay una carrera.
:::

## Interbloqueo (deadlock) {#t4-deadlock}

Hilo A tiene `m1` y espera `m2`. Hilo B tiene `m2` y espera `m1`. Ninguno avanza nunca. Hay interbloqueo cuando se dan a la vez cuatro condiciones: exclusión mutua, retener y esperar, no expulsión y **espera circular**. La forma sencilla de romperlo es **eliminar la espera circular**:

- Tomar siempre los `mutex` **en el mismo orden**, o
- Tomarlos **todos a la vez** con `scoped_lock` (o `std::lock`), que usa un algoritmo que evita el interbloqueo.

[[fig:deadlock]]

@include cpp code/t4/tenedores.cpp runout

[[sim:philo]]

## Tareas periódicas: `sleep_until` frente a `sleep_for` {#t4-periodico}

Para una tarea con periodo $T$:

- `sleep_for(T)` espera $T$ **después** de acabar el trabajo, así que el periodo real es $T + C$ y el error se **acumula** (deriva).
- `sleep_until(siguiente); siguiente += T;` espera a un **instante absoluto**: el periodo no se desvía.

@include cpp code/t4/periodico.cpp runout

:::warn Qué suele fallar
- Pasar una variable por valor al hilo esperando que se modifique: usa `std::ref`.
- Olvidar `join()`: el programa aborta.
- Un `mutex` distinto por hilo (cada uno protege lo suyo, no hay exclusión). El `mutex` debe ser **compartido**.
- Imprimir por `cout` desde varios hilos: la salida se mezcla. Protege la consola con su propio `mutex`.
- Dejar un `mutex` bloqueado al lanzar una excepción o hacer `return` (usa `lock_guard`).
- Dos `mutex` en orden distinto en dos hilos (interbloqueo).
:::

:::deep Más a fondo
**Modelo de memoria.** Una carrera de datos (acceso concurrente a un dato, uno de ellos escritura, sin sincronización) es **comportamiento indefinido** en C++: el compilador puede reordenar o eliminar accesos. `mutex` y `atomic` imponen un orden que sí es correcto. Referencia: A. Williams, *C++ Concurrency in Action* (2.ª ed.).
:::

:::formula Plantillas de concurrencia
- Lanzar y esperar: `vector<thread> v; for(...) v.emplace_back(f, args); for (auto& h : v) h.join();`
- Sección crítica: `{ lock_guard<mutex> lk{m}; /* tocar datos protegidos */ }`
- Dos recursos: `scoped_lock lk{m1, m2};`
- Periódica: `auto sig = steady_clock::now() + T; loop { trabajo(); sleep_until(sig); sig += T; }`
:::

@gl Condición de carrera | Resultado que depende del orden en que se intercalan hilos que acceden a un dato compartido.
@gl Sección crítica | Fragmento de código que accede a datos compartidos y debe ejecutarse en exclusión mutua.
@gl Mutex | Objeto de exclusión mutua: solo un hilo lo posee a la vez.
@gl Interbloqueo (deadlock) | Varios hilos esperan indefinidamente recursos que tienen los otros.
@gl RAII | Adquirir un recurso en la construcción y liberarlo en la destrucción (lock_guard).
@gl Atomic | Tipo cuyas operaciones son indivisibles.
@gl join | Bloquea al hilo llamador hasta que el otro hilo termina.
@quiz ¿Por qué `++x` desde dos hilos pierde incrementos? | Porque `++` es lento | Porque son tres pasos (leer, sumar, escribir) que se pueden intercalar | Porque `x` es `int` | Porque el compilador lo optimiza mal siempre | 2 | Si los dos leen el mismo valor antes de escribir, uno de los incrementos se pisa.
@quiz ¿Qué pasa si destruyes un `thread` sin hacer `join` ni `detach`? | Nada | Se llama a `std::terminate` | Se hace join solo | Se libera la CPU | 2 | El estándar obliga a unir o soltar antes de destruir.
@quiz ¿Qué evita el interbloqueo con dos mutex? | `lock_guard` sobre cada uno por separado | `scoped_lock lk{m1, m2};` | `sleep_for` | `detach` | 2 | Adquiere todos a la vez con un algoritmo seguro; cada `lock_guard` por separado no lo garantiza.
@quiz ¿Qué es mejor para una tarea periódica? | `sleep_for(T)` | `sleep_until(siguiente); siguiente += T;` | `while` activo | `detach` | 2 | `sleep_until` con instante absoluto evita la deriva acumulada.
@card ¿Cómo pasas una variable por referencia a `thread`? | Con `std::ref(var)`; si no, se copia.
@card Cuatro condiciones del interbloqueo | Exclusión mutua, retener y esperar, no expulsión, espera circular.
@card ¿`lock_guard` o `scoped_lock`? | `lock_guard` para un mutex; `scoped_lock` para varios a la vez.
