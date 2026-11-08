## Clase, objeto y encapsulación {#t2-clase}

Una **clase** agrupa **datos** (atributos) y **operaciones** (métodos) que van juntos. La parte `private` esconde los datos; la parte `public` es la «interfaz»: lo único que el resto del programa puede usar. Así puedes cambiar el interior sin romper a nadie y garantizar que el objeto siempre está en un estado válido.

Un ejemplo completo y verificado, el del gestor de cuentas bancarias:

@include cpp code/t2/cuenta.cpp runout

Fíjate en cuatro cosas, todas habituales en los exámenes:

1. Los métodos que **no modifican** el objeto llevan `const` (`saldo() const`). Solo con `const` se pueden llamar sobre un objeto `const` o a través de `const&`.
2. El atributo `saldo_` tiene un **inicializador en la clase** (`= 0`).
3. El `operator<<` es un `friend` que recibe `ostream&` y **devuelve** el mismo flujo (para encadenar `cout << a << b`).
4. `transferencia` recibe la cuenta destino **por referencia** (`C_Cuenta&`): si fuera por valor, ingresaría el dinero en una copia que desaparece.

:::tip Constructores
- La **lista de inicialización** (`: titular_{...}, numero_{...}`) construye los atributos directamente. Es lo normal y a veces obligatorio (atributos `const` o referencias).
- Los atributos se inicializan **en el orden en que están declarados** en la clase, no en el orden de la lista.
- Un **constructor delegado** (`C_Cuenta() : C_Cuenta("sin titular", 0) {}`) reutiliza otro constructor.
- Si marcas un constructor con `explicit`, evitas conversiones implícitas no deseadas.
:::

## Cuándo hay que escribir copia y destructor (regla de 0, 3 y 5) {#t2-regla}

Cuando copias un objeto, C++ copia sus atributos uno a uno. Si el objeto guarda un **puntero** a memoria dinámica, copia el puntero, no la memoria: los dos objetos comparten el bloque, y al destruirse **liberan el mismo bloque dos veces**.

- **Regla de 0:** si tus atributos son `string`, `vector`, `map`, `unique_ptr`…, **no escribas** destructor ni copias. El compilador hace lo correcto. Es lo que quieres casi siempre.
- **Regla de 3:** si escribes uno de estos, escribe los tres: **destructor**, **constructor de copia** y **asignación por copia**.
- **Regla de 5:** añade también **constructor de movimiento** y **asignación por movimiento**.

@include cpp code/t2/regla3.cpp runout

La asignación usa el truco **copy-and-swap**: copia a un temporal y intercambia. Así es segura aunque falle la copia y aunque hagas `a = a`.

:::warn Qué suele fallar
- `Buffer b = a;` con puntero crudo y sin constructor de copia: doble `delete`.
- Escribir la asignación sin proteger contra la autoasignación y borrar antes de copiar.
- Declarar el destructor `private` o olvidarlo `virtual` en una clase base (T3).
- Usar una variable no inicializada: los atributos `int`, `double` o punteros no tienen valor por defecto.
:::

[[fig:clase_vida]]

**Vídeo recomendado** (en inglés, 5 min): regla de tres y de cinco, es decir, cuándo escribir destructor, copia y asignación.

[[yt:RspbK8tfU0Y|Rule Of Three And Rule Of Five In C++ Programming|CppNuts|4:57|EN|Intermedio]]

**Alternativa en español** (8 min): la regla de tres explicada paso a paso.

[[yt:F-7Rpt2D-zo|Regla de tres en C++|ReelLearning|8:30|ES|Intermedio]]

## Sobrecarga de operadores {#t2-operadores}

Un operador es una función con un nombre especial. `a + b` es `operator+(a, b)`. Las reglas útiles:

| Operador | Forma habitual |
|---|---|
| `<<` (salida) | Función libre o `friend`: `ostream& operator<<(ostream&, const T&)` |
| `>>` (entrada) | `istream& operator>>(istream&, T&)` (construye un temporal y haz `swap`) |
| `+`, `-` | Función libre: `T operator+(const T&, const T&)`. Devuelve un objeto nuevo |
| `==`, `<` | Función libre o método `const`. Necesarios para `set`, `map`, `sort` |
| `=`, `[]`, `()` | Siempre métodos |

:::note Un `friend`
Un `friend` es una función **fuera** de la clase con permiso para ver sus atributos privados. Si la clase ya tiene métodos `get`, no necesitas `friend`: el operador puede usar los `get`.
:::

## Miembros estáticos y composición {#t2-static}

Un atributo `static` es **uno solo para toda la clase** (por ejemplo, un contador de objetos creados). Se declara en la clase y se define fuera (o con `inline static` en C++17).

La **composición** significa que una clase contiene objetos de otras clases: un `Plataforma` tiene un `vector<Suscripcion>`. Es la herramienta más usada; la herencia (T3) se reserva para relaciones «es un».

:::deep Más a fondo
**Acoplamiento y cohesión.** Una clase con **alta cohesión** hace una sola cosa bien; dos clases con **bajo acoplamiento** dependen poco una de otra. Declarar `private` para los atributos y exponer solo operaciones con sentido es la manera práctica de conseguir ambas. Los principios SOLID (en particular, «una clase, una responsabilidad») desarrollan esta idea; el libro de referencia es R. C. Martin, *Clean Architecture*.
:::

:::formula Plantilla de clase para el examen
```cpp
class C_X {
public:
    C_X(tipo a, tipo b) : a_{a}, b_{b} {}          // constructor
    tipo a() const { return a_; }                   // getters const
    friend ostream& operator<<(ostream& os, const C_X& x) { return os << x.a_; }
private:
    tipo a_, b_;
};   // <- el ; final
```
:::

@gl Constructor delegado | Constructor que llama a otro constructor de la misma clase.
@gl Lista de inicialización | Forma de construir atributos antes de entrar al cuerpo del constructor.
@gl Regla de 0/3/5 | Si no gestionas recursos, no escribas nada; si escribes destructor/copia/asignación, escribe los tres (o los cinco con movimiento).
@gl Copy-and-swap | Técnica para la asignación: copiar a un temporal e intercambiar.
@gl friend | Función externa con acceso a los miembros privados de una clase.
@gl const (método) | Método que promete no modificar el objeto.
@gl static (atributo) | Atributo compartido por todos los objetos de la clase.
@quiz ¿Qué devuelve un `operator<<` bien escrito? | `void` | `ostream&` | `string` | `bool` | 2 | Devolviendo el mismo flujo se pueden encadenar varias salidas: `cout << a << b`.
@quiz Una clase tiene un `int*` obtenido con `new[]`. Sin escribir copia, `Buffer b = a;`… | Copia el contenido | Comparte el bloque y lo libera dos veces | No compila | Mueve el bloque | 2 | La copia por defecto copia el puntero; ambos destructores hacen `delete[]` del mismo bloque.
@quiz ¿En qué orden se inicializan los atributos? | En el de la lista de inicialización | En el orden de declaración en la clase | Alfabético | En el que decida el compilador | 2 | Siempre en el orden de declaración, aunque la lista los escriba en otro.
@quiz ¿Qué atributos NO necesitan gestión manual de copia (regla de 0)? | `int*` con `new` | `string` y `vector` | Descriptores de fichero C | Memoria con `malloc` | 2 | `string` y `vector` ya gestionan su memoria y su copia correctamente.
@card ¿Para qué sirve `const` al final de un método? | Garantiza que no modifica el objeto y permite llamarlo sobre objetos `const`.
@card ¿Qué es copy-and-swap? | Asignar copiando a un temporal e intercambiando sus datos con los del objeto; seguro ante excepciones y autoasignación.

## Ejemplo completo y plantilla de clase {#t2-plantilla}

Una clase `Fraccion` que usa casi todo lo que se pide en un examen: constructor con valores por defecto, `const`, operadores aritméticos, comparaciones, `++` prefijo y sufijo, `operator<<` y una excepción. Está comentada con números `(1)`, `(2)`…

@include cpp code/t2/fraccion.cpp runout

:::tip Plantilla: qué escribir y en qué orden
1. **Atributos privados** con sufijo `_`.
2. **Constructor** con lista de inicialización (en el **orden en que declaraste los atributos**, no en el que los escribes).
3. **Getters `const`** (todo método que no modifica el objeto lleva `const`).
4. **Operadores** como métodos `const` que devuelven un objeto nuevo.
5. **`operator<<` como `friend`** dentro de la clase, devolviendo `os`.
6. Si usas memoria dinámica: **regla de los cinco** (destructor, copia, movimiento, asignación por valor con `swap`).
:::

:::tip Truco: qué operadores necesitas para cada contenedor
- `set`, `map` (como clave) y `sort`: solo **`operator<`**.
- `find`, `count` en vector, `==` entre objetos: **`operator==`**.
- Imprimir con `cout`: **`operator<<`**.
- `x++` y `++x`: el sufijo lleva un parámetro `int` que no se usa; devuelve una **copia del valor anterior**.
:::

:::warn Qué suele fallar
- **Olvidar `const` en un getter** y que no compile al llamarlo desde una referencia `const&`.
- **`explicit` olvidado** en un constructor de un solo parámetro: permite conversiones silenciosas (`Fraccion f = 3;`). Es práctico aquí, pero en otras clases puede dar sorpresas.
- **`operator+` que modifica `*this`:** debe devolver un objeto nuevo; modificar es trabajo de `+=`.
- **Orden de inicialización:** `Caja(int a) : area_{ancho_ * alto_}, ancho_{a}` usa `ancho_` antes de darle valor, porque se inicializa en el orden de **declaración**.
- **Normalizar al construir** (aquí en `simplificar`) evita repetir lógica en cada operador y hace que `==` solo compare campos.
:::
