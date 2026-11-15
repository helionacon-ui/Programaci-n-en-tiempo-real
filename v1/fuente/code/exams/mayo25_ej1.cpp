#include <algorithm>
#include <iostream>
#include <sstream>
#include <string>
#include <typeinfo>
#include <vector>
using namespace std;

class C_Envio {
    int codigo_;
    double precio_;
    string destinatario_;
protected:
    virtual string to_string() const {
        ostringstream os;
        os << "Envio #" << codigo_ << " (" << precio_ << "€), destinatario: " << destinatario_;
        return os.str();
    }
public:
    C_Envio(int codigo, double precio, const string& dest)
        : codigo_{codigo}, precio_{precio}, destinatario_{dest} {}
    C_Envio(int codigo, const string& dest) : C_Envio{codigo, 0.0, dest} {}
    virtual ~C_Envio() = default;

    int get_codigo() const { return codigo_; }
    double get_precio() const { return precio_; }
    void set_precio(double p) { precio_ = p; }
    bool buscar_destinatario(const string& parte) const {
        return destinatario_.find(parte) != string::npos;
    }
    virtual double coste_total() const { return precio_; }
    friend ostream& operator<<(ostream& os, const C_Envio& e) { return os << e.to_string(); }
};

class C_Envio_Internacional : public C_Envio {
    string pais_;
    double aduana_;
protected:
    string to_string() const override {
        ostringstream os;
        os << C_Envio::to_string() << " (" << pais_ << " + " << aduana_ << "€)";
        return os.str();
    }
public:
    C_Envio_Internacional(int codigo, double precio, const string& dest, const string& pais, double aduana)
        : C_Envio{codigo, precio, dest}, pais_{pais}, aduana_{aduana} {}
    C_Envio_Internacional(int codigo, const string& dest, const string& pais)
        : C_Envio_Internacional{codigo, 0.0, dest, pais, 0.0} {}
    C_Envio_Internacional(const C_Envio& e, const string& pais)
        : C_Envio{e}, pais_{pais}, aduana_{0.0} {}
    double get_aduana() const { return aduana_; }
    void set_aduana(double a) { aduana_ = a; }
    double coste_total() const override { return C_Envio::coste_total() + aduana_; }
};

class C_Centro_Logistico {
    string ciudad_;
    vector<C_Envio*> envios_;
public:
    explicit C_Centro_Logistico(const string& ciudad) : ciudad_{ciudad} {}

    int contar_nacionales() const {
        return count_if(begin(envios_), end(envios_),
                        [](const C_Envio* e) { return typeid(*e) == typeid(C_Envio); });
    }
    int contar_internacionales() const {
        return count_if(begin(envios_), end(envios_),
                        [](const C_Envio* e) { return typeid(*e) == typeid(C_Envio_Internacional); });
    }
    int contar_destinatario(const string& texto) const {
        return count_if(begin(envios_), end(envios_),
                        [&texto](const C_Envio* e) { return e->buscar_destinatario(texto); });
    }
    bool add_envio(C_Envio& e) {
        auto it = find_if(begin(envios_), end(envios_),
                          [&e](const C_Envio* x) { return x->get_codigo() == e.get_codigo(); });
        if (it != end(envios_)) return false;
        envios_.push_back(&e);
        return true;
    }
    bool borrar_envio(int codigo) {
        auto it = find_if(begin(envios_), end(envios_),
                          [codigo](const C_Envio* x) { return x->get_codigo() == codigo; });
        if (it == end(envios_)) return false;
        envios_.erase(it);
        return true;
    }
    friend ostream& operator<<(ostream& os, const C_Centro_Logistico& c) {
        os << c.ciudad_ << ": " << c.envios_.size() << " envios\n";
        for (const auto* e : c.envios_) os << *e << '\n';
        return os;
    }
};

int main() {
    C_Centro_Logistico madrid{"Madrid"};
    C_Envio a{12345, 90, "Mario, UPCT, 30202, Cartagena"};
    C_Envio b{12346, 70, "Maria, UPCT, 30202, Cartagena"};
    C_Envio_Internacional c{54321, 50, "Xi Ling, Gran Muralla", "China", 15};
    cout << boolalpha << madrid.add_envio(a) << madrid.add_envio(b) << madrid.add_envio(c)
         << madrid.add_envio(a) << '\n';
    cout << madrid;
    cout << madrid.contar_nacionales() << ' ' << madrid.contar_internacionales() << ' '
         << madrid.contar_destinatario("UPCT") << '\n';
    const C_Envio& r = c;
    cout << "coste (polimorfismo): " << r.coste_total() << '\n';
    cout << madrid.borrar_envio(12346) << madrid.borrar_envio(1) << '\n' << madrid;
}
