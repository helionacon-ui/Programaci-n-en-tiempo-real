#include <algorithm>
#include <iostream>
#include <string>
#include <typeinfo>
#include <vector>
using namespace std;

class C_Empleado {
    string nombre_, direccion_;
protected:
    virtual void imprimir(ostream& os) const {      // gancho virtual para el operator<< (friend)
        os << "Nombre: " << nombre_ << " (" << direccion_ << "), Sueldo: " << get_sueldo() << "€";
    }
public:
    C_Empleado(const string& nombre, const string& dir) : nombre_{nombre}, direccion_{dir} {}
    explicit C_Empleado(const string& nombre) : C_Empleado{nombre, ""} {}
    virtual ~C_Empleado() = default;
    const string& get_nombre() const { return nombre_; }
    const string& get_direccion() const { return direccion_; }
    void set_direccion(const string& d) { direccion_ = d; }
    virtual double get_sueldo() const = 0;          // pura virtual => clase abstracta
    friend ostream& operator<<(ostream& os, const C_Empleado& e) { e.imprimir(os); return os; }
};

class C_Empleado_Sueldo_Fijo : public C_Empleado {
    double sueldo_fijo_;
public:
    C_Empleado_Sueldo_Fijo(const string& n, const string& d, double s)
        : C_Empleado{n, d}, sueldo_fijo_{s} {}
    explicit C_Empleado_Sueldo_Fijo(const string& n) : C_Empleado_Sueldo_Fijo{n, "", 0.0} {}
    void set_sueldo_fijo(double s) { sueldo_fijo_ = s; }
    double get_sueldo() const override { return sueldo_fijo_; }
};

class C_Empleado_Sueldo_Variable : public C_Empleado {
    double base_, complemento_;
public:
    C_Empleado_Sueldo_Variable(const string& n, const string& d, double b, double c)
        : C_Empleado{n, d}, base_{b}, complemento_{c} {}
    explicit C_Empleado_Sueldo_Variable(const string& n) : C_Empleado_Sueldo_Variable{n, "", 0.0, 0.0} {}
    void set_base(double b) { base_ = b; }
    void set_complemento(double c) { complemento_ = c; }
    double get_sueldo() const override { return base_ + complemento_; }
};

class C_Empresa {
    string nombre_;
    vector<C_Empleado*> empleados_;
public:
    explicit C_Empresa(const string& n) : nombre_{n} {}
    void add_empleado(C_Empleado& e) { empleados_.push_back(&e); }
    int total_fijos() const {
        return count_if(begin(empleados_), end(empleados_),
                        [](const C_Empleado* e) { return typeid(*e) == typeid(C_Empleado_Sueldo_Fijo); });
    }
    int total_variables() const {
        return count_if(begin(empleados_), end(empleados_),
                        [](const C_Empleado* e) { return typeid(*e) == typeid(C_Empleado_Sueldo_Variable); });
    }
    // Puntero al de mayor sueldo (nullptr si no hay empleados)
    const C_Empleado* mayor_sueldo() const {
        if (empleados_.empty()) return nullptr;
        return *max_element(begin(empleados_), end(empleados_),
                            [](const C_Empleado* a, const C_Empleado* b) { return a->get_sueldo() < b->get_sueldo(); });
    }
    bool borrar_empleado(const string& nombre) {
        auto it = find_if(begin(empleados_), end(empleados_),
                          [&nombre](const C_Empleado* e) { return e->get_nombre() == nombre; });
        if (it == end(empleados_)) return false;
        empleados_.erase(it);
        return true;
    }
    friend ostream& operator<<(ostream& os, const C_Empresa& e) {
        os << "Empresa: " << e.nombre_ << ", lista de empleados:\n";
        for (const auto* x : e.empleados_) os << *x << '\n';
        return os;
    }
};

int main() {
    C_Empresa upct{"UPCT"};
    C_Empleado_Sueldo_Fijo juan{"Juan", "Calle calle", 2500};
    C_Empleado_Sueldo_Fijo antonio{"Antonio", "Plaza plaza", 2500};
    C_Empleado_Sueldo_Variable maria{"Maria", "Avenida avda", 2000, 1000};
    upct.add_empleado(juan); upct.add_empleado(antonio); upct.add_empleado(maria);
    cout << upct;
    cout << upct.total_fijos() << ' ' << upct.total_variables() << '\n';
    cout << "Mayor sueldo: " << *upct.mayor_sueldo() << '\n';
    cout << boolalpha << upct.borrar_empleado("Antonio") << ' ' << upct.borrar_empleado("Nadie") << '\n';
    cout << upct;
}
