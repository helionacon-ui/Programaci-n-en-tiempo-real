#include <cmath>
#include <iostream>
#include <limits>
#include <sstream>
using namespace std;

class Point_3D {
public:
    Point_3D(double x = 0, double y = 0, double z = 0) : x_{x}, y_{y}, z_{z} {}
    double distancia(const Point_3D& o) const { return sqrt(pow(x_ - o.x_, 2) + pow(y_ - o.y_, 2) + pow(z_ - o.z_, 2)); }
    friend ostream& operator<<(ostream& os, const Point_3D& p) { return os << '(' << p.x_ << ", " << p.y_ << ", " << p.z_ << ')'; }
private:
    double x_, y_, z_;
};

class Sphere {
public:
    explicit Sphere(double diametro, Point_3D centro = {}) : d_{diametro}, c_{centro} {}
    double diametro() const { return d_; }
    void set_diametro(double d) { d_ = d; }
    double area() const { double r = d_ / 2; return 4 * M_PI * r * r; }
    double volumen() const { double r = d_ / 2; return 4.0 / 3 * M_PI * r * r * r; }
    // dentro: distancia < r; sobre la superficie: |distancia - r| < eps (nunca ==, son reales)
    bool contiene(const Point_3D& p) const { return c_.distancia(p) < d_ / 2; }
    bool en_superficie(const Point_3D& p, double eps = 1e-9) const { return fabs(c_.distancia(p) - d_ / 2) < eps; }
    friend ostream& operator<<(ostream& os, const Sphere& s) {
        return os << "Esfera d=" << s.d_ << " centro " << s.c_ << " area=" << s.area() << " volumen=" << s.volumen();
    }
private:
    double d_;
    Point_3D c_;
};

class Box {
public:
    Box(double alto, double ancho, double prof) : a_{alto}, w_{ancho}, p_{prof}, libre_{alto * ancho * prof} {}
    bool insertar_objeto(double volumen) {
        if (volumen <= 0 || volumen > libre_) return false;
        libre_ -= volumen; llena_ = libre_ <= 0; return true;
    }
    void vaciar() { libre_ = a_ * w_ * p_; llena_ = false; }
    double libre() const { return libre_; }
    bool llena() const { return llena_; }
    friend ostream& operator<<(ostream& os, const Box& b) { return os << "Caja " << b.a_ << 'x' << b.w_ << 'x' << b.p_ << " libre=" << b.libre_ << (b.llena_ ? " (llena)" : ""); }
private:
    double a_, w_, p_, libre_;
    bool llena_ = false;
};

double leer_positivo(istream& in, const string& pregunta) {       // robusto frente a «abc»
    double v;
    while (true) {
        cout << pregunta;
        if (in >> v && v > 0) return v;
        in.clear();                                                   // limpia el estado de error
        in.ignore(numeric_limits<streamsize>::max(), '\n');           // descarta la línea mala
        cout << "valor no valido\n";
    }
}

int main() {
    Sphere s{2, Point_3D{0, 0, 0}};
    cout << s << '\n';
    cout << boolalpha << "(0.5,0,0) dentro: " << s.contiene({0.5, 0, 0}) << ", (1,0,0) en superficie: " << s.en_superficie({1, 0, 0}) << '\n';
    Box b{1, 1, 1};
    cout << b.insertar_objeto(0.6) << ' ' << b.insertar_objeto(0.6) << ' ' << b.insertar_objeto(0.4) << '\n' << b << '\n';
    b.vaciar(); cout << b << '\n';
    istringstream simulado{"abc\n-3\n4.5\n"};                          // en el examen sería cin
    cout << "diametro leido: " << leer_positivo(simulado, "diametro? ") << '\n';
}
