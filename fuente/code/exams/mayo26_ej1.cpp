#include <iostream>
#include <sstream>
#include <string>
#include <vector>
#include <typeinfo>
using namespace std;

class C_Suscripcion {
protected:
    int id_;
    double precio_base_;
    string titular_;
    // Método virtual intermedio: operator<< (friend) no es virtual, así que delega aquí.
    virtual string to_string() const {
        ostringstream os;
        os << "Suscripcion #" << id_ << " (" << precio_base_ << "€), Titular: " << titular_;
        return os.str();
    }
public:
    C_Suscripcion(int id, double precio, const string& titular)
        : id_{id}, precio_base_{precio}, titular_{titular} {}
    C_Suscripcion(int id, const string& titular) : C_Suscripcion{id, 0.0, titular} {}
    virtual ~C_Suscripcion() = default;           // destructor virtual: clase base polimórfica

    int get_id() const { return id_; }
    double get_precio() const { return precio_base_; }
    void set_precio(double p) { precio_base_ = p; }

    bool buscar_titular(const string& texto) const {
        return titular_.find(texto) != string::npos;
    }
    virtual double factura_total() const { return precio_base_; }

    friend ostream& operator<<(ostream& os, const C_Suscripcion& s) {
        return os << s.to_string();
    }
};

class C_Suscripcion_Premium : public C_Suscripcion {
    string soporte_;
    double suplemento_;
protected:
    string to_string() const override {
        ostringstream os;
        // Reutilizamos el texto de la clase base (llamada calificada, sin polimorfismo)
        os << C_Suscripcion::to_string() << " (Premium: " << soporte_ << " + " << suplemento_ << "€)";
        return os.str();
    }
public:
    C_Suscripcion_Premium(int id, double precio, const string& titular,
                          const string& soporte, double suplemento)
        : C_Suscripcion{id, precio, titular}, soporte_{soporte}, suplemento_{suplemento} {}
    C_Suscripcion_Premium(int id, const string& titular, const string& soporte)
        : C_Suscripcion_Premium{id, 0.0, titular, soporte, 0.0} {}
    // Copia los atributos de una C_Suscripcion (constructor de copia de la base)
    C_Suscripcion_Premium(const C_Suscripcion& base, const string& soporte)
        : C_Suscripcion{base}, soporte_{soporte}, suplemento_{0.0} {}

    double get_suplemento() const { return suplemento_; }
    void set_suplemento(double s) { suplemento_ = s; }
    double factura_total() const override { return precio_base_ + suplemento_; }
};

class C_Plataforma {
    string nombre_;
    vector<C_Suscripcion*> suscripciones_;   // la plataforma NO es propietaria (ver nota)
public:
    explicit C_Plataforma(const string& nombre) : nombre_{nombre} {}

    bool add_suscripcion(C_Suscripcion& nueva) {
        for (const auto* s : suscripciones_)
            if (s->get_id() == nueva.get_id()) return false;
        suscripciones_.push_back(&nueva);
        return true;
    }
    // Quita del vector (el borrado exige iterador). No hace delete: los objetos son del llamante.
    bool cancelar_suscripcion(int id) {
        for (auto it = begin(suscripciones_); it != end(suscripciones_); ++it) {
            if ((*it)->get_id() == id) { suscripciones_.erase(it); return true; }
        }
        return false;
    }
    int contar_estandar() const {
        int n = 0;
        for (const auto* s : suscripciones_) if (typeid(*s) == typeid(C_Suscripcion)) ++n;
        return n;
    }
    int contar_premium() const {
        int n = 0;
        for (const auto* s : suscripciones_) if (typeid(*s) == typeid(C_Suscripcion_Premium)) ++n;
        return n;
    }
    int buscar_por_nombre(const string& texto) const {
        int n = 0;
        for (const auto* s : suscripciones_) if (s->buscar_titular(texto)) ++n;
        return n;
    }
    friend ostream& operator<<(ostream& os, const C_Plataforma& p) {
        os << p.nombre_ << ": " << p.suscripciones_.size() << " usuarios\n";
        for (const auto* s : p.suscripciones_) os << *s << '\n';
        return os;
    }
};

int main() {
    C_Plataforma plataforma{"StreamMaster"};
    C_Suscripcion s1{101, 15.5, "Juan Perez"};
    C_Suscripcion s2{102, "Ana Garcia"};
    s2.set_precio(12.0);
    C_Suscripcion_Premium s3{202, 20.0, "Luis Lopez", "Soporte 24h - España", 5.5};
    cout << boolalpha;
    cout << plataforma.add_suscripcion(s1) << ' ' << plataforma.add_suscripcion(s2) << ' '
         << plataforma.add_suscripcion(s3) << ' ' << plataforma.add_suscripcion(s3) << '\n';
    cout << plataforma;
    cout << "Estandar: " << plataforma.contar_estandar() << ", Premium: " << plataforma.contar_premium() << '\n';
    cout << "Titulares con 'Juan': " << plataforma.buscar_por_nombre("Juan") << '\n';
    const C_Suscripcion& ref = s3;
    cout << "Factura premium (via referencia base): " << ref.factura_total() << '\n';
    C_Suscripcion_Premium s4{s1, "Soporte basico"};
    cout << s4 << '\n';
    cout << "Cancelar 102: " << plataforma.cancelar_suscripcion(102)
         << ", cancelar 999: " << plataforma.cancelar_suscripcion(999) << '\n';
    cout << plataforma;
}
