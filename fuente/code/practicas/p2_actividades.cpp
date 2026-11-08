// Práctica 2.5: actividades de un proyecto (contenedor recursivo con herencia)
#include <algorithm>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

class Actividad {
public:
    Actividad(string id, string desc) : id_{std::move(id)}, desc_{std::move(desc)} {}
    virtual ~Actividad() = default;
    virtual int duracion() const = 0;
    friend ostream& operator<<(ostream& os, const Actividad& a) { return os << a.to_string(); }
protected:
    virtual string to_string() const { ostringstream o; o << id_ << " (" << desc_ << ") dura " << duracion(); return o.str(); }
    string id_, desc_;
};

class Tarea : public Actividad {
public:
    Tarea(string id, string desc, int d) : Actividad{std::move(id), std::move(desc)}, d_{d} {}
    int duracion() const override { return d_; }
private:
    int d_;
};

class Tarea_Compuesta : public Actividad {        // abstracta: no implementa duracion()
public:
    Tarea_Compuesta(string id, string desc) : Actividad{std::move(id), std::move(desc)} {}
    bool anyadir(Actividad* a) { if (a == this) return false; v_.push_back(a); return true; }
protected:
    string to_string() const override {
        ostringstream o; o << Actividad::to_string() << " {";
        for (auto* a : v_) o << " [" << *a << "]";
        o << " }"; return o.str();
    }
    vector<Actividad*> v_;
};

class Tareas_Paralelas : public Tarea_Compuesta {
public:
    using Tarea_Compuesta::Tarea_Compuesta;       // hereda constructores
    int duracion() const override { int m = 0; for (auto* a : v_) m = max(m, a->duracion()); return m; }   // el máximo
};
class Tareas_Secuenciales : public Tarea_Compuesta {
public:
    using Tarea_Compuesta::Tarea_Compuesta;
    int duracion() const override { int s = 0; for (auto* a : v_) s += a->duracion(); return s; }          // la suma
};

int main() {
    Tarea t1{"T1", "cavar", 3}, t2{"T2", "cimentar", 5}, t3{"T3", "pintar", 2}, t4{"T4", "limpiar", 1};
    Tareas_Paralelas par{"P", "a la vez"};
    par.anyadir(&t1); par.anyadir(&t2);
    Tareas_Secuenciales seq{"S", "en orden"};
    seq.anyadir(&par); seq.anyadir(&t3); seq.anyadir(&t4);
    cout << seq << '\n';
    cout << "duracion total = " << seq.duracion() << " (max(3,5) + 2 + 1)\n";
}
