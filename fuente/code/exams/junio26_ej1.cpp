#include <cctype>
#include <iostream>
#include <map>
#include <string>
#include <vector>
using namespace std;

// Interfaz: clase abstracta pura (solo métodos virtuales puros + destructor virtual)
class C_Recibidor {
public:
    virtual ~C_Recibidor() = default;
    virtual void recibir_valor(const string& msg) = 0;
    virtual string get_nombre() const = 0;
};

class C_Pantalla : public C_Recibidor {
    string nombre_;
    int ancho_;
public:
    C_Pantalla(const string& nombre, int ancho) : nombre_{nombre}, ancho_{ancho} {}
    explicit C_Pantalla(const string& nombre) : C_Pantalla{nombre, 80} {}
    void recibir_valor(const string& msg) override {
        // Imprime en líneas de como máximo 'ancho_' caracteres
        for (size_t i = 0; i < msg.size(); i += ancho_)
            cout << msg.substr(i, ancho_) << '\n';
    }
    string get_nombre() const override { return nombre_; }
};

class C_Alarma : public C_Recibidor {
    string nombre_;
public:
    explicit C_Alarma(const string& nombre) : nombre_{nombre} {}
    void recibir_valor(const string& msg) override {
        for (unsigned char c : msg)             // isdigit exige unsigned char (o EOF)
            if (isdigit(c)) { cout << msg << '\n'; return; }
    }
    string get_nombre() const override { return nombre_; }
};

class C_Central {
    string nombre_;
    map<string, vector<C_Recibidor*>> suscritos_;
public:
    explicit C_Central(const string& nombre) : nombre_{nombre} {}

    void add_tema(const string& t) { suscritos_[t]; }   // operator[] crea el vector vacío si no existía

    bool suscribirse(const string& tema, C_Recibidor& r) {
        auto it = suscritos_.find(tema);                // NO usar [] aquí: crearía el tema
        if (it == end(suscritos_)) return false;
        it->second.push_back(&r);
        return true;
    }
    void suscribirse_a_todos(C_Recibidor& r) {
        for (auto& [tema, vec] : suscritos_) vec.push_back(&r);
    }
    bool enviar_valor(const string& tema, const string& msg) {
        auto it = suscritos_.find(tema);
        if (it == end(suscritos_)) return false;
        for (auto* r : it->second) r->recibir_valor(msg);
        return true;
    }
    friend ostream& operator<<(ostream& os, const C_Central& c) {
        os << "Central '" << c.nombre_ << "' con " << c.suscritos_.size() << " temas:\n";
        for (const auto& [tema, vec] : c.suscritos_) {
            os << tema << ":\n";
            for (const auto* r : vec) os << r->get_nombre() << ", ";
            os << '\n';
        }
        return os;
    }
};

int main() {
    C_Pantalla pantalla{"|Pantalla| : De 15", 15};
    C_Alarma alarma{"|Alarma| : Beep"};
    C_Central central{"Central eventos"};
    central.add_tema("temperatura");
    central.add_tema("humedad");
    central.add_tema("presion");
    central.suscribirse("temperatura", pantalla);
    central.suscribirse("humedad", pantalla);
    central.suscribirse_a_todos(alarma);
    cout << boolalpha << central.suscribirse("viento", pantalla) << '\n';
    cout << central;
    central.enviar_valor("temperatura", "Temperatura actual: 25 grados");
    central.enviar_valor("humedad", "humedad sin dato");
    cout << central.enviar_valor("viento", "x") << '\n';
}
