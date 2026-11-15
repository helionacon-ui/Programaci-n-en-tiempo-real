#include <iostream>
#include <memory>
#include <string>
#include <vector>
using namespace std;

class Animal {
public:
    Animal() { cout << "  Animal() presenta: " << nombre() << '\n'; }   // TRAMPA: en el constructor NO hay polimorfismo
    virtual ~Animal() = default;
    virtual string nombre() const { return "animal"; }
    virtual string sonido() const { return "..."; }
    string presentacion() const { return nombre() + " dice " + sonido(); }   // llama a lo virtual: usa el tipo REAL
};
class Perro : public Animal {
public:
    string nombre() const override { return "perro"; }
    string sonido() const override { return "guau"; }
};
class Gato : public Animal {
public:
    string nombre() const override { return "gato"; }
    string sonido() const override { return Animal::sonido() + "miau"; }   // llamar a la versión de la base: Base::metodo()
    void ronronear() const { cout << "  ...purrr\n"; }
};

int main() {
    cout << "1) Constructor de Perro (la base llama a nombre() antes de que exista la parte Perro):\n";
    Perro p;
    cout << "2) Slicing: guardar por VALOR corta el objeto\n";
    vector<Animal> por_valor;
    por_valor.push_back(Perro{});
    cout << "  " << por_valor[0].presentacion() << "   <- ya es un Animal, no un Perro\n";
    cout << "3) Por puntero inteligente se conserva el tipo real\n";
    vector<unique_ptr<Animal>> zoo;
    zoo.push_back(make_unique<Perro>());
    zoo.push_back(make_unique<Gato>());
    for (const auto& a : zoo) cout << "  " << a->presentacion() << '\n';
    cout << "4) dynamic_cast: pregunta '¿eres un Gato?' (devuelve nullptr si no)\n";
    for (const auto& a : zoo) {
        if (auto* g = dynamic_cast<Gato*>(a.get())) { cout << "  es un gato:"; g->ronronear(); }
        else cout << "  " << a->nombre() << " no es un gato\n";
    }
    cout << "5) Referencia a la base: tampoco hay slicing\n";
    const Animal& r = p;
    cout << "  " << r.presentacion() << '\n';
}
