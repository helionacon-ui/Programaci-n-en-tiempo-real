#include <algorithm>
#include <cmath>
#include <iostream>
#include <utility>
#include <vector>
using namespace std;

struct RGB { int R, G, B; };
ostream& operator<<(ostream& os, const RGB& c) { return os << "(" << c.R << ", " << c.G << ", " << c.B << ")"; }
enum Tipo_Terreno { tierra, agua, vegetal, urbano, mixto };

class C_Imagen {
public:
    C_Imagen(double lat, double lon, double alt, int umbral = 20) : lat_{lat}, lon_{lon}, alt_{alt}, umbral_{umbral} {}
    pair<int, int> tam_imagen() const {
        if (m_.empty()) return {-1, -1};
        return {static_cast<int>(m_.size()), static_cast<int>(m_[0].size())};
    }
    bool nueva_fila(const vector<RGB>& fila) {
        if (!m_.empty() && fila.size() != m_[0].size()) return false;
        m_.push_back(fila);
        return true;
    }
    int n_pixels_tipo(Tipo_Terreno t) const {
        int n = 0;
        for (const auto& fila : m_)
            for (const RGB& p : fila)
                if (clasificar(p) == t) ++n;
        return n;
    }
    friend ostream& operator<<(ostream& os, const C_Imagen& im) {
        os << "Imagen en " << im.lat_ << ", " << im.lon_ << ", " << im.alt_ << "; umbral " << im.umbral_ << '\n';
        for (const auto& fila : im.m_) {
            for (const RGB& p : fila) os << p << ' ';
            os << '\n';
        }
        return os;
    }
private:
    Tipo_Terreno clasificar(const RGB& p) const {
        if (p.R > p.G + p.B) return tierra;
        if (p.B > p.R + p.G) return agua;
        if (p.G > p.R + p.B) return vegetal;
        if (abs(p.R - p.G) < umbral_ && abs(p.R - p.B) < umbral_ && abs(p.G - p.B) < umbral_) return urbano;
        return mixto;
    }
    double lat_, lon_, alt_;
    int umbral_;
    vector<vector<RGB>> m_;
};

int fotos_max_tipo(const vector<C_Imagen>& v, Tipo_Terreno t) {
    int mejor = -1, max_n = -1;
    for (size_t i = 0; i < v.size(); ++i) {
        int n = v[i].n_pixels_tipo(t);
        if (n > max_n) { max_n = n; mejor = static_cast<int>(i); }
    }
    return mejor;
}

int main() {
    C_Imagen im{2, 3, 4};
    auto t = im.tam_imagen();
    cout << "tamano: " << t.first << "x" << t.second << '\n';
    cout << boolalpha << "fila de 2: " << im.nueva_fila({{200, 10, 10}, {10, 10, 200}}) << '\n' << im;
    cout << "fila de 2: " << im.nueva_fila({{10, 200, 10}, {100, 100, 100}}) << '\n' << im;
    cout << "fila de 3: " << im.nueva_fila({{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}) << '\n' << im;
    cout << "tierra=" << im.n_pixels_tipo(tierra) << " agua=" << im.n_pixels_tipo(agua) << " vegetal=" << im.n_pixels_tipo(vegetal)
         << " urbano=" << im.n_pixels_tipo(urbano) << " mixto=" << im.n_pixels_tipo(mixto) << '\n';
    C_Imagen otra{0, 0, 0, 5};
    otra.nueva_fila({{250, 0, 0}, {240, 5, 5}});
    vector<C_Imagen> v{im, otra};
    cout << "imagen con mas tierra: " << fotos_max_tipo(v, tierra) << '\n';
}
