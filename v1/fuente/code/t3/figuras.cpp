#include <cmath>
#include <iostream>
#include <memory>
#include <set>
#include <sstream>
#include <string>
#include <typeinfo>
using namespace std;

class C_Figura {                                  // clase abstracta
public:
    explicit C_Figura(string id) : id_{std::move(id)} {}
    virtual ~C_Figura() = default;                // destructor virtual
    virtual double area() const = 0;              // puras virtuales
    virtual double perimetro() const = 0;
    friend ostream& operator<<(ostream& os, const C_Figura& f) { return os << f.to_string(); }  // polimórfico
protected:
    virtual string to_string() const {
        ostringstream o; o << id_ << ": area=" << area() << " perimetro=" << perimetro(); return o.str();
    }
    string id_;
};

class C_Circulo : public C_Figura {
public:
    C_Circulo(string id, double r) : C_Figura{std::move(id)}, r_{r} {}
    double area() const override { return M_PI * r_ * r_; }
    double perimetro() const override { return 2 * M_PI * r_; }
protected:
    string to_string() const override { return "Circulo " + C_Figura::to_string(); }
private:
    double r_;
};

class C_Rectangulo : public C_Figura {
public:
    C_Rectangulo(string id, double b, double h) : C_Figura{std::move(id)}, b_{b}, h_{h} {}
    double area() const override { return b_ * h_; }
    double perimetro() const override { return 2 * (b_ + h_); }
protected:
    string to_string() const override { return "Rectangulo " + C_Figura::to_string(); }
private:
    double b_, h_;
};

class C_Agrupacion : public C_Figura {            // contenedor recursivo
public:
    explicit C_Agrupacion(string id) : C_Figura{std::move(id)} {}
    bool anyadir(C_Figura* f) { if (f == this) return false; return fs_.insert(f).second; }
    double area() const override { double s = 0; for (auto* f : fs_) s += f->area(); return s; }
    double perimetro() const override { double s = 0; for (auto* f : fs_) s += f->perimetro(); return s; }
protected:
    string to_string() const override {
        ostringstream o; o << "Agrupacion " << id_ << " {";
        for (auto* f : fs_) o << " [" << *f << "]";     // operator<< es público; f->to_string() no compilaría
        o << " }"; return o.str();
    }
private:
    set<C_Figura*> fs_;                           // punteros: sin ellos no hay polimorfismo
};

int main() {
    C_Circulo c{"c1", 1};
    C_Rectangulo r{"r1", 2, 3};
    C_Agrupacion g{"g1"};
    g.anyadir(&c); g.anyadir(&r);
    cout << "se anyade a si misma: " << boolalpha << g.anyadir(&g) << '\n';
    C_Figura* p = &r;                              // puntero a la base, objeto derivado
    cout << *p << '\n';
    cout << "area total g1 = " << g.area() << '\n';
    cout << "tipo de *p: " << typeid(*p).name() << " (nombre interno)\n";
    unique_ptr<C_Figura> u = make_unique<C_Circulo>("c2", 2);   // liberado automáticamente
    cout << u->area() << '\n';
}
