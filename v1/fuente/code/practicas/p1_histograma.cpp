// Práctica 1: histograma de palabras de un fichero (map<string,int>) y por longitud (vector<map>)
#include <algorithm>
#include <cctype>
#include <fstream>
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

string normalizar(string p) {
    p.erase(remove_if(p.begin(), p.end(), [](unsigned char c) { return ispunct(c); }), p.end());   // sin puntuación
    transform(p.begin(), p.end(), p.begin(), [](unsigned char c) { return tolower(c); });         // sin mayúsculas (solo ASCII)
    return p;
}

int main(int argc, char* argv[]) {
    if (argc != 2) { cerr << "uso: " << argv[0] << " fichero.txt\n"; return 1; }
    ifstream in{argv[1]};
    if (!in) { cerr << "no se puede abrir " << argv[1] << '\n'; return 1; }

    map<string, int> hist;
    vector<map<string, int>> por_longitud(16);         // índice = nº de letras (suponemos <= 15)
    long total = 0;
    string palabra;
    while (in >> palabra) {                            // >> separa por espacios
        palabra = normalizar(palabra);
        if (palabra.empty()) continue;
        ++hist[palabra]; ++total;
        if (palabra.size() < por_longitud.size()) ++por_longitud[palabra.size()][palabra];
    }
    // ordenar por frecuencia: un map está ordenado por clave, así que pasamos a un vector de pares
    vector<pair<string, int>> v(hist.begin(), hist.end());
    sort(v.begin(), v.end(), [](const auto& a, const auto& b) { return a.second > b.second || (a.second == b.second && a.first < b.first); });

    cout << "palabras: " << total << ", distintas: " << hist.size() << '\n';
    cout << "las dos mas repetidas:\n";
    for (size_t i = 0; i < 2 && i < v.size(); ++i) cout << "  " << v[i].first << ": " << v[i].second << '\n';
    long acum = 0; cout << "palabras que acumulan el 20% de las apariciones:";
    for (auto& [p, n] : v) { cout << ' ' << p << '(' << n << ')'; acum += n; if (acum * 5 >= total) break; }
    cout << "\nla mas repetida de cada longitud (1-6 letras):\n";
    for (size_t l = 1; l <= 6; ++l) {
        if (por_longitud[l].empty()) continue;
        auto it = max_element(por_longitud[l].begin(), por_longitud[l].end(), [](auto& a, auto& b) { return a.second < b.second; });
        cout << "  " << l << " letras: " << it->first << " (" << it->second << ")\n";
    }
}
