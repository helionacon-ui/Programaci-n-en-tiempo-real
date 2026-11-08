## El problema: esperar a que se cumpla una condición {#t5-problema}

El `mutex` resuelve «solo uno a la vez». No resuelve «espera hasta que haya algo». Ejemplos típicos:

- Un consumidor debe esperar a que el productor haya puesto un dato.
- Un productor no puede escribir si el almacén está lleno.
- Varios hilos deben esperar en una barrera hasta que otro la abra.

Esperar dando vueltas en un `while` (espera activa) gasta CPU y es incorrecto. Lo correcto es **dormir** hasta que alguien avise: una **variable condición** (`condition_variable`).

## `condition_variable`: cómo se usa siempre {#t5-cv}

Se usa **siempre junto con un `mutex` y un predicado**. Hay un patrón fijo:

```cpp
// Hilo que espera
unique_lock<mutex> lk{m};
cv.wait(lk, [&]{ return condicion; });   // 1) suelta el mutex y duerme  2) al despertar lo recupera  3) vuelve a comprobar el predicado
// aquí la condición es cierta y tienes el mutex

// Hilo que avisa
{ lock_guard<mutex> lk{m}; condicion = true; }   // cambia el estado protegido por el mutex
cv.notify_one();                                   // o notify_all()
```

Por qué **con predicado**:

- Puede haber **despertares espurios**: `wait` se despierta sin que nadie avise.
- Puede que otro hilo se haya adelantado y haya consumido el dato: al despertar hay que **volver a comprobar**.
- Si avisas **antes** de que el otro empiece a esperar, el aviso se pierde; con predicado no importa, porque la condición ya es cierta y `wait` ni se duerme.

| Método | Qué hace |
|---|---|
| `wait(lk, pred)` | Duerme hasta que `pred()` sea cierto (equivale a `while(!pred()) wait(lk);`) |
| `notify_one()` | Despierta a **un** hilo que espera |
| `notify_all()` | Despierta a **todos**; cada uno recomprueba su predicado |
| `wait_for / wait_until` | Con plazo máximo (útil en tiempo real) |

:::warn Qué suele fallar
- Usar `wait` **sin predicado** y con un `if`: despertar espurio y se rompe.
- Cambiar la variable de la condición **sin** tener el `mutex`: carrera con el predicado.
- `notify_one` cuando hay varias condiciones distintas esperando en la misma variable: puede despertar al hilo equivocado. Usa `notify_all` o una variable por condición.
- Usar `lock_guard` con `wait`: necesitas `unique_lock` (porque `wait` lo desbloquea y bloquea).
- Olvidar la condición de **cierre**: los hilos quedan dormidos para siempre y el `join` no termina.
:::

[[fig:prodcons]]

**Vídeo recomendado** (en inglés, 16 min): el problema del productor y el consumidor con `condition_variable`.

[[yt:rKGq9AlfPR4|Producer Consumer Problem|CppNuts|15:42]]

## Monitor {#t5-monitor}

Un **monitor** es una clase que **encapsula**: los datos compartidos, el `mutex` que los protege y las variables condición. Los hilos solo usan los métodos públicos y cada uno hace internamente su `lock`. Es la forma de dar la respuesta de «la clase `Almacén`/`Puente`/`Barrera`» del examen.

[[fig:monitor]]

Un buffer acotado completo (productor–consumidor), compilado y probado con varios consumidores:

@include cpp code/t5/buffer.cpp runout

Observa:

- Dos variables condición (`no_lleno_` y `no_vacio_`), una para cada condición de espera distinta.
- `sacar` devuelve `false` cuando el buffer está **cerrado y vacío**; así los consumidores acaban sin esperar para siempre.
- El estado del cierre se cambia **con el `mutex`** y se avisa con `notify_all`.

**Vídeo recomendado** (en inglés, 6 min): por qué la espera usa `unique_lock` y no `lock_guard`.

[[yt:uxMRTDxO1bQ|Why C++ Producer-Consumer Pattern Requires std::unique_lock|Suboptimal Engineer|6:25]]

## Cómo resolver un ejercicio de monitor en el examen {#t5-receta}

1. **Lista los atributos** que describen el estado (contadores, banderas, colas) y escribe qué `mutex` los protege (normalmente **uno**).
2. **Para cada operación bloqueante**, escribe en una frase la condición para poder seguir: «puedo entrar si…». Eso es el predicado.
3. **Escribe la operación**: `unique_lock` → `wait(lk, predicado)` → actualiza el estado → `notify_*`.
4. **Pregúntate quién despierta a quién**: cada cambio de estado que pueda hacer cierto un predicado debe terminar en un `notify`.
5. **Añade una forma de terminar** (`bool terminar_` + `notify_all`) si el enunciado lo pide.
6. **Comprueba el interbloqueo**: ¿puede haber dos hilos esperando que el otro avance? Si hay prioridades o turnos, define una regla **asimétrica** (un desempate fijo).

:::deep Más a fondo
**Por qué no alcanza con un `mutex`.** Un `mutex` garantiza exclusión, pero no ordena eventos. La variable condición es el mecanismo que expresa **precedencia** («esto solo ocurre después de aquello»). En teoría de la concurrencia, los monitores de Hoare/Mesa implementan exactamente este esquema; `std::condition_variable` es de estilo **Mesa**: al despertar no hay garantía de que la condición siga siendo cierta, de ahí el `while`/predicado. Referencia: A. Silberschatz et al., *Operating System Concepts*.
:::

:::formula Plantilla de monitor
```cpp
class Monitor {
public:
    void operacion() {
        unique_lock<mutex> lk{m_};
        cv_.wait(lk, [this]{ return puedo_; });
        /* actualizar estado */
        cv_.notify_all();
    }
private:
    mutex m_;
    condition_variable cv_;
    /* estado protegido por m_ */
};
```
:::

@gl Variable condición | Primitiva que permite a un hilo dormir hasta que otro avise de que cambió una condición.
@gl Monitor | Clase que encapsula datos compartidos, su mutex y sus variables condición.
@gl Despertar espurio | `wait` que se despierta sin que haya `notify`; por eso se usa predicado.
@gl Espera activa | Comprobar una condición en bucle consumiendo CPU, en lugar de dormir.
@gl Productor–consumidor | Patrón en el que unos hilos generan datos y otros los consumen a través de un buffer.
@gl Barrera | Punto en el que varios hilos esperan hasta que se cumple una condición común.
@quiz ¿Por qué se usa un predicado en `cv.wait(lk, pred)`? | Es más rápido | Para tolerar despertares espurios y avisos adelantados | Para evitar el mutex | Es obligatorio por sintaxis | 2 | `wait` recomprueba la condición al despertar, así que no dependes de que el aviso llegue justo a tiempo ni de que sea cierto.
@quiz ¿Qué tipo de bloqueo exige `condition_variable::wait`? | `lock_guard` | `unique_lock` | `scoped_lock` de dos mutex | Ninguno | 2 | `wait` debe poder desbloquear y volver a bloquear el mutex.
@quiz Un hilo cambia `terminar_ = true` sin el mutex y llama a `notify_all`. ¿Qué riesgo hay? | Ninguno | Carrera con el predicado y aviso perdido | Interbloqueo seguro | El hilo se destruye | 2 | La modificación debe hacerse con el mutex para que el predicado vea el valor y no se pierda el aviso.
@quiz ¿Qué hace `wait` mientras el hilo duerme? | Mantiene el mutex bloqueado | Libera el mutex | Hace espera activa | Cierra la variable | 2 | Libera el mutex al dormir y lo vuelve a tomar al despertar.
@card Patrón de espera | `unique_lock lk{m}; cv.wait(lk, [&]{ return cond; });`
@card Patrón de aviso | Cambiar el estado con el mutex, soltar y `cv.notify_one()` / `notify_all()`.
@card ¿Cuándo `notify_all` en lugar de `notify_one`? | Cuando varios hilos con predicados distintos comparten la variable o puede quedar más de uno listo.

## Plantilla de monitor genérica {#t5-plantilla}

Esta cola acotada sirve de **esqueleto** para casi cualquier ejercicio de monitor. Fíjate en los cuatro pasos comentados en `poner`: son siempre los mismos.

@include cpp code/t5/cola_plantilla.cpp runout

:::tip Receta de monitor en 5 pasos
1. Decide el **estado compartido** (aquí `q_`, `cap_`, `cerrada_`) y ponlo `private`, junto a **un** `mutex`.
2. Escribe las **condiciones de espera** como frases: «puedo poner si hay hueco **o** se cerró», «puedo sacar si hay dato **o** se cerró».
3. Cada método público hace: `unique_lock` → `wait(lk, predicado)` → comprobar cierre → **cambiar estado** → `notify`.
4. Avisa a **quien espera lo contrario**: tras `poner` avisas a los que sacan; tras `sacar`, a los que ponen.
5. El **cierre** pone la bandera con el mutex tomado y hace `notify_all` a todas las variables de condición.
:::

:::warn Los cuatro errores clásicos
- **`if` en lugar de `while` / predicado.** Otro hilo puede haber cambiado el estado entre el aviso y tu despertar (y existen despertares espurios). El `wait` con predicado ya contiene el bucle.
- **Cambiar el estado fuera del mutex.** Toda lectura y escritura del estado, también la de la bandera de cierre, va con el mutex tomado.
- **Olvidar la condición de cierre en el predicado.** Sin `|| cerrada_`, los hilos dormidos nunca despiertan al terminar.
- **`notify_one` donde hace falta `notify_all`.** Si varios hilos esperan condiciones **distintas** sobre la misma variable de condición, un solo aviso puede despertar al que no toca y quedarse todos dormidos. Ante la duda: `notify_all`.
:::

:::tip Truco: esperar con tiempo límite
`wait_for(lk, 50ms, predicado)` devuelve `false` si pasó el tiempo y el predicado sigue sin cumplirse. Útil cuando el enunciado pide «espera como mucho X ms».
:::
