// Prácticas 2.2 y 2.3: Mensaje_Secreto y Registro_Mensajes
#include <iostream>
#include <map>
#include <string>
#include <vector>
using namespace std;

class Mensaje_Secreto {
public:
    Mensaje_Secreto(string texto, int clave, string pista = "") : texto_{std::move(texto)}, clave_{clave}, pista_{std::move(pista)} {}
    void bloquear() { bloqueado_ = true; }
    bool bloquear(int clave_nueva) { if (bloqueado_) return false; clave_ = clave_nueva; bloqueado_ = true; return true; }
    bool desbloquear(int clave) { if (clave == clave_) bloqueado_ = false; return !bloqueado_; }
    bool esta_bloqueado() const { return bloqueado_; }
    void borrar() { texto_.clear(); }
    const string& pista() const { return pista_; }
    friend ostream& operator<<(ostream& os, const Mensaje_Secreto& m) {
        return os << (m.bloqueado_ ? "[bloqueado] pista: " + m.pista_ : m.texto_);
    }
private:
    string texto_; int clave_; string pista_; bool bloqueado_ = true;
};

class Registro_Mensajes {
public:
    void nuevo_mensaje(const Mensaje_Secreto& m, const string& persona) { reg_[persona].push_back(m); }
    bool existe_persona(const string& p) const { return reg_.find(p) != reg_.end(); }
    int total_mensajes_persona(const string& p) const { auto it = reg_.find(p); return it == reg_.end() ? 0 : static_cast<int>(it->second.size()); }
    vector<string> lista_personas() const { vector<string> v; for (const auto& [p, _] : reg_) v.push_back(p); return v; }
    bool primer_mensaje(const string& p, int clave) { return leer(p, clave, true); }
    bool ultimo_mensaje(const string& p, int clave) { return leer(p, clave, false); }
    int borrar_todos(const string& p, const vector<int>& claves) {      // claves probadas una por mensaje
        auto it = reg_.find(p); if (it == reg_.end()) return 0;
        int borrados = 0; size_t k = 0;
        for (auto m = it->second.begin(); m != it->second.end(); ++k) {
            if (k < claves.size() && m->desbloquear(claves[k])) { m->borrar(); m = it->second.erase(m); ++borrados; }
            else ++m;                                                    // clave incorrecta: se queda
        }
        return borrados;
    }
private:
    bool leer(const string& p, int clave, bool primero) {                // método privado común
        auto it = reg_.find(p);
        if (it == reg_.end() || it->second.empty()) { cout << "sin mensajes para " << p << '\n'; return false; }
        auto m = primero ? it->second.begin() : prev(it->second.end());
        cout << "pista: " << m->pista() << '\n';
        if (!m->desbloquear(clave)) { cout << "clave incorrecta\n"; return false; }
        cout << *m << '\n'; m->borrar(); it->second.erase(m);
        return true;
    }
    map<string, vector<Mensaje_Secreto>> reg_;
};

int main() {
    Registro_Mensajes r;
    r.nuevo_mensaje({"hola Ana", 1234, "mi PIN"}, "Ana");
    r.nuevo_mensaje({"adios Ana", 99, "dos cifras"}, "Ana");
    cout << "mensajes de Ana: " << r.total_mensajes_persona("Ana") << ", de Luis: " << r.total_mensajes_persona("Luis") << '\n';
    r.primer_mensaje("Ana", 1);        // clave incorrecta
    r.primer_mensaje("Ana", 1234);     // lo muestra y lo borra
    r.ultimo_mensaje("Ana", 99);
    r.primer_mensaje("Luis", 0);
    cout << "quedan " << r.total_mensajes_persona("Ana") << " mensajes\n";
}
