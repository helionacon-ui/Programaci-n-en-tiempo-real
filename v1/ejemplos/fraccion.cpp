#include <iostream>
#include <numeric>
#include <set>
#include <stdexcept>
using namespace std;

class Fraccion {
public:
    Fraccion(int num = 0, int den = 1) : n_{num}, d_{den} {      // (1) valores por defecto: sirve de constructor vacío
        if (d_ == 0) throw invalid_argument{"denominador 0"};
        simplificar();
    }
    int num() const { return n_; }
    int den() const { return d_; }
    // (2) operadores aritméticos: devuelven un objeto NUEVO y no modifican a los operandos (const)
    Fraccion operator+(const Fraccion& o) const { return {n_ * o.d_ + o.n_ * d_, d_ * o.d_}; }
    Fraccion operator-(const Fraccion& o) const { return {n_ * o.d_ - o.n_ * d_, d_ * o.d_}; }
    Fraccion operator*(const Fraccion& o) const { return {n_ * o.n_, d_ * o.d_}; }
    Fraccion operator/(const Fraccion& o) const { return {n_ * o.d_, d_ * o.n_}; }
    // (3) comparaciones: con == y < ya puedes usar la clase en set, map y sort
    bool operator==(const Fraccion& o) const { return n_ == o.n_ && d_ == o.d_; }   // están simplificadas: basta comparar campos
    bool operator<(const Fraccion& o) const { return n_ * o.d_ < o.n_ * d_; }        // den > 0 siempre
    // (4) ++ prefijo (devuelve referencia) y sufijo (parámetro int ficticio, devuelve copia del valor anterior)
    Fraccion& operator++() { n_ += d_; return *this; }
    Fraccion operator++(int) { Fraccion antes = *this; ++*this; return antes; }
    friend ostream& operator<<(ostream& os, const Fraccion& f) { return f.d_ == 1 ? os << f.n_ : os << f.n_ << '/' << f.d_; }
private:
    void simplificar() {
        if (d_ < 0) { n_ = -n_; d_ = -d_; }        // el signo siempre en el numerador
        int g = gcd(n_ < 0 ? -n_ : n_, d_);
        if (g > 1) { n_ /= g; d_ /= g; }
    }
    int n_, d_;
};

int main() {
    Fraccion a{1, 2}, b{3, -6}, c{2, 4};
    cout << "a=" << a << " b=" << b << " c=" << c << "   (b = 3/-6 se normaliza a -1/2)\n";
    cout << "a+c=" << a + c << "  a-c=" << a - c << "  a*b=" << a * b << "  a/b=" << a / b << '\n';
    cout << boolalpha << "a==c: " << (a == c) << "  b<a: " << (b < a) << '\n';
    set<Fraccion> s{{1, 2}, {2, 4}, {1, 3}, {-1, 2}};          // 1/2 y 2/4 son la misma: el set la guarda una vez
    cout << "set:";
    for (const auto& f : s) cout << ' ' << f;
    cout << '\n';
    Fraccion x{1, 2};
    Fraccion y = x++;                                            // y vale lo de antes; x ya incrementado
    cout << "x++ -> y=" << y << ", x=" << x << "   ++x -> " << ++x << '\n';
    try { Fraccion malo{1, 0}; } catch (const invalid_argument& e) { cout << "error: " << e.what() << '\n'; }
}
