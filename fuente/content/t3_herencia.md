## Herencia: la relación «es un» {#t3-herencia}

Una **clase derivada** reutiliza y amplía una **clase base**. Un `C_Circulo` **es una** `C_Figura`: tiene todo lo de una figura (un `id`, un área, un perímetro) y añade lo suyo (un radio).

[[fig:herencia]]

```cpp
class C_Circulo : public C_Figura {      // herencia pública: «es un»
public:
    C_Circulo(string id, double r) : C_Figura{std::move(id)}, r_{r} {}   // construye primero la base
    ...
};
```

- El constructor de la base se llama **primero**; se invoca en la lista de inicialización.
- La destrucción va en orden inverso: primero la derivada, después la base.
- Con `protected`, los miembros son visibles para las derivadas pero no para el exterior.

## Polimorfismo: un puntero a la base, muchos comportamientos {#t3-poli}

Imagina un vector de figuras. Quieres recorrerlo y llamar a `area()` sin preguntar de qué tipo es cada una. Eso es el **polimorfismo**: la misma llamada ejecuta código distinto según el **tipo real** del objeto.

Para que funcione necesitas **dos** cosas:

1. Que el método sea `virtual` en la base.
2. Que lo llames a través de un **puntero o una referencia** a la base (`C_Figura*`, `C_Figura&`).

[[fig:vtable]]

Cada objeto con métodos virtuales lleva oculto un puntero a una **tabla de métodos virtuales (vtable)**. Al llamar a `p->area()`, el programa mira la tabla del objeto real y salta a la versión correcta. Es el **enlace dinámico**. Sin `virtual`, el compilador decide por el tipo declarado: **enlace estático**.

[[sim:bind]]

:::warn Qué suele fallar
- **Slicing**: `vector<C_Figura>` o `C_Figura f = circulo;` copia solo la parte base y pierde el polimorfismo. Usa punteros (`vector<C_Figura*>`, `vector<unique_ptr<C_Figura>>`).
- Olvidar `virtual` en el método de la base: la derivada lo «oculta» en lugar de redefinirlo.
- Firma ligeramente distinta (`const` o tipo del parámetro): no es una redefinición. **`override`** hace que el compilador te avise.
- Llamar a un método virtual desde el constructor: aún no es el tipo derivado.
:::

## Clases abstractas y destructor virtual {#t3-abstractas}

Un método **virtual puro** (`virtual double area() const = 0;`) no tiene implementación en la base. Una clase con al menos uno es **abstracta**: no se puede instanciar, solo sirve como contrato. Las derivadas están obligadas a implementarlo (si no, también son abstractas).

La clase base de una jerarquía polimórfica debe tener **destructor virtual**: `virtual ~C_Figura() = default;`. Si no, `delete p` con `p` de tipo `C_Figura*` solo ejecuta el destructor de la base y la parte derivada **no se destruye** (fuga o comportamiento indefinido).

## Ejemplo completo {#t3-ejemplo}

Esta es la jerarquía de figuras (con contenedor recursivo), compilada y ejecutada:

@include cpp code/t3/figuras.cpp runout

Puntos finos de este ejemplo:

- `operator<<` **no es virtual**: es una función libre. Delega en un método virtual `to_string()` (patrón *non-virtual interface*). Así `cout << *p` se comporta de forma polimórfica.
- `to_string` es `protected`. Una derivada la puede redefinir y llamar a la de su base (`C_Figura::to_string()`), pero **no** puedes llamar a `f->to_string()` a través de un `C_Figura*` desde otra clase: el compilador lo rechaza (accederías al miembro protegido de **otro** objeto de la base). Usa el `operator<<` público.
- `C_Agrupacion` guarda `set<C_Figura*>`: punteros para que haya polimorfismo, y comprueba `f == this` para no contenerse a sí misma.

### Tipo en tiempo de ejecución y punteros inteligentes

`typeid(*p)` devuelve el tipo **real** del objeto si la clase es polimórfica (`typeid(*p) == typeid(C_Circulo)` sirve para contar objetos de cada tipo). El **nombre** que imprime depende del compilador. `dynamic_cast<C_Circulo*>(p)` devuelve `nullptr` si no lo es.

`unique_ptr<T>` es un puntero con **un solo dueño** que hace `delete` solo al salir. `shared_ptr<T>` cuenta propietarios. Con ellos no escribes `delete` a mano.

:::deep Más a fondo
**Principio de sustitución de Liskov (SOLID).** Si `B` hereda de `A`, debes poder usar un `B` en cualquier sitio donde se espera un `A` sin que el programa deje de ser correcto. Un `Cuadrado` que hereda de `Rectangulo` y hace que `setAncho` cambie también el alto rompe el principio: quien espera un rectángulo cualquiera se sorprende. Si no puedes decir «un B **es un** A» en todos los sentidos del contrato, usa composición.
:::

:::formula Plantilla de jerarquía
```cpp
class Base {
public:
    virtual ~Base() = default;
    virtual double f() const = 0;                       // pura
    friend ostream& operator<<(ostream& o, const Base& b) { return o << b.to_string(); }
protected:
    virtual string to_string() const { return "base"; }
};
class Der : public Base {
public:
    double f() const override { return 1; }
protected:
    string to_string() const override { return "der " + Base::to_string(); }
};
// uso: vector<Base*> v; for (auto* p : v) cout << *p;
```
:::

@gl Polimorfismo | Misma llamada, distinto código según el tipo real del objeto.
@gl Enlace dinámico | Elección de método en tiempo de ejecución con la vtable (método virtual vía puntero/referencia).
@gl Clase abstracta | Clase con algún método virtual puro; no se puede instanciar.
@gl Destructor virtual | Obligatorio en la base de una jerarquía polimórfica para destruir bien con `delete` a través de la base.
@gl Slicing | Pérdida de la parte derivada al copiar un objeto derivado a uno base por valor.
@gl override | Palabra clave que obliga al compilador a comprobar que se redefine un método virtual.
@gl unique_ptr | Puntero inteligente con un único dueño; libera al destruirse.
@quiz ¿Qué hace falta para que `p->area()` ejecute la versión de la clase derivada? | Solo herencia | Método `virtual` y llamada vía puntero o referencia a la base | Que la clase sea `final` | Que `area` sea `static` | 2 | Sin `virtual`, o con copia por valor, el enlace es estático.
@quiz ¿Por qué la base de una jerarquía necesita destructor virtual? | Para compilar | Para destruir correctamente un objeto derivado a través de un puntero a la base | Para evitar el slicing | Para que sea abstracta | 2 | Sin él, `delete p` solo llama al destructor de la base.
@quiz `vector<C_Figura> v; v.push_back(C_Circulo{"c",1});` | Mantiene el círculo completo | Provoca slicing: solo queda la parte C_Figura (y no compila si es abstracta) | Es la forma recomendada | Llama a `to_string` del círculo | 2 | Un contenedor de objetos base copia por valor y recorta. Usa punteros.
@quiz ¿Cuál de estas clases es abstracta? | `class A { virtual void f() = 0; };` | `class A { virtual void f() {} };` | `class A { void f() {} };` | `class A {};` | 1 | `= 0` en un método virtual lo hace puro y la clase abstracta.
@card ¿Qué es la vtable? | Tabla de punteros a métodos virtuales por clase; cada objeto polimórfico apunta a la de su clase real.
@card ¿Qué es slicing? | Copiar un objeto derivado a una variable base por valor: se pierde la parte derivada y el polimorfismo.
@card ¿Para qué sirve `override`? | Para que el compilador verifique que realmente redefines un virtual de la base.
