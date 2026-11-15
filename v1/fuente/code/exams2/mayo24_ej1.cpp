#include <iostream>
#include <map>
#include <set>
#include <string>
using namespace std;

class C_Post {
public:
    C_Post(string fecha, string usuario, string texto, int likes) : fecha_{move(fecha)}, nombre_usuario{move(usuario)}, texto_{move(texto)}, likes_{likes} {}
    const string& usuario() const { return nombre_usuario; }
    const string& texto() const { return texto_; }
    bool encontrar(const string& clave) const { return texto_.find(clave) != string::npos; }
    friend ostream& operator<<(ostream& os, const C_Post& p) {
        return os << p.fecha_ << " @" << p.nombre_usuario << ": " << p.texto_ << " (" << p.likes_ << " likes)";
    }
    friend bool operator<(const C_Post& r, const C_Post& l) { return r.nombre_usuario < l.nombre_usuario; }
private:
    string fecha_, nombre_usuario, texto_;
    int likes_;
};

class C_Procesador_Posts {
public:
    C_Procesador_Posts(const set<string>& tematicas, string otras) : tematicas_{tematicas}, otras_{move(otras)} {
        for (const auto& t : tematicas_) posts_[t];
        posts_[otras_];
    }
    C_Procesador_Posts(const set<string>& tematicas) : C_Procesador_Posts(tematicas, "otras") {}
    void add_post(const C_Post& p) {
        bool alguna = false;
        for (const auto& t : tematicas_)
            if (p.encontrar(t)) { posts_[t].insert(p); alguna = true; }
        if (!alguna) posts_[otras_].insert(p);
    }
    map<string, int> num_posts_tematicas() const {
        map<string, int> r;
        for (const auto& [t, s] : posts_) r[t] = static_cast<int>(s.size());
        return r;
    }
    int total_posts() const {
        int n = 0;
        for (const auto& [t, s] : posts_) n += static_cast<int>(s.size());
        return n;
    }
    set<C_Post> posts_usuario_tematica(const string& t) const {
        auto it = posts_.find(t);
        return it == posts_.end() ? set<C_Post>{} : it->second;
    }
    string usuario_mas_posts_tematica(const string& t) const {
        auto it = posts_.find(t);
        if (it == posts_.end() || it->second.empty()) return "";
        map<string, int> cuenta;
        for (const auto& p : it->second) ++cuenta[p.usuario()];
        string mejor; int n = 0;
        for (const auto& [u, c] : cuenta)
            if (c > n) { n = c; mejor = u; }
        return mejor;
    }
    friend ostream& operator<<(ostream& os, const C_Procesador_Posts& p) {
        for (const auto& [t, s] : p.posts_) {
            os << t << ":\n";
            for (const auto& post : s) os << "  " << post << '\n';
        }
        return os;
    }
private:
    set<string> tematicas_;
    string otras_;
    map<string, set<C_Post>> posts_;
};

int main() {
    C_Procesador_Posts pp{{"futbol", "cine"}};
    pp.add_post({"01/05/2024", "ana", "gran partido de futbol", 10});
    pp.add_post({"02/05/2024", "luis", "futbol y cine el mismo dia", 3});
    pp.add_post({"03/05/2024", "eva", "hoy llueve", 1});
    pp.add_post({"04/05/2024", "ana", "mi pelicula favorita de cine", 7});
    pp.add_post({"05/05/2024", "ana", "otro dia de futbol", 4});
    cout << pp;
    for (const auto& [t, n] : pp.num_posts_tematicas()) cout << t << "=" << n << ' ';
    cout << "\ntotal=" << pp.total_posts() << " (un post puede contar en varias tematicas)\n";
    cout << "futbol: " << pp.posts_usuario_tematica("futbol").size() << " posts (set<C_Post> compara solo por usuario)\n";
    cout << "usuario con mas posts en futbol: " << pp.usuario_mas_posts_tematica("futbol") << '\n';
    cout << "tematica que no existe: [" << pp.usuario_mas_posts_tematica("tenis") << "]\n";
}
