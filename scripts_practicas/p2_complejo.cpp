// Práctica 2.1: número complejo
#include <cmath>
#include <iostream>
#include <utility>
using namespace std;

class C_Complejo {
public:
    C_Complejo(double re, double im) : re_{re}, im_{im} {}
    C_Complejo() : C_Complejo(0, 0) {}                     // constructor delegado: 0 + 0i
    double real() const { return re_; }
    double imag() const { return im_; }
private:
    double re_, im_;
};

// Fuera de la clase: solo necesita los get. Reduce lo que la clase tiene que mantener.
pair<double, double> modulo_argumento(const C_Complejo& c) { return {hypot(c.real(), c.imag()), atan2(c.imag(), c.real())}; }

C_Complejo operator+(const C_Complejo& l, const C_Complejo& r) { return {l.real() + r.real(), l.imag() + r.imag()}; }
C_Complejo operator-(const C_Complejo& l, const C_Complejo& r) { return {l.real() - r.real(), l.imag() - r.imag()}; }
ostream& operator<<(ostream& os, const C_Complejo& c) { return os << c.real() << (c.imag() < 0 ? "-" : "+") << fabs(c.imag()) << "i"; }
istream& operator>>(istream& is, C_Complejo& c) {            // formato: re im
    double re, im;
    if (is >> re >> im) { C_Complejo tmp{re, im}; swap(c, tmp); }   // construir temporal y swap
    return is;
}

int main() {
    C_Complejo a{3, 4}, b{1, -2}, z;
    cout << "a=" << a << " b=" << b << " z=" << z << '\n';
    cout << "a+b=" << a + b << "  a-b=" << a - b << '\n';
    auto [m, arg] = modulo_argumento(a);
    cout << "|a|=" << m << " arg(a)=" << arg << " rad\n";
}
