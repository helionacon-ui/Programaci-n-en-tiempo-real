// Práctica 1.1-1.3: palabras de una línea, ordenar y usar ficheros
#include <algorithm>
#include <cctype>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

string sin_puntuacion(string p) {
    p.erase(remove_if(p.begin(), p.end(), [](unsigned char c) { return ispunct(c); }), p.end());
    return p;
}
vector<string> palabras(const string& linea) {            // 1.1: separa por espacios con un stringstream
    istringstream in{linea};
    vector<string> v; string p;
    while (in >> p) { p = sin_puntuacion(p); if (!p.empty()) v.push_back(p); }
    return v;
}
string minusculas(string s) { transform(s.begin(), s.end(), s.begin(), [](unsigned char c) { return tolower(c); }); return s; }

int main() {
    string linea = "Programación de Tiempo Real o programación de tiempo real, ¿vale?";
    auto v = palabras(linea);
    cout << "1.1) una por línea:\n"; for (auto& p : v) cout << p << '\n';

    sort(v.begin(), v.end());                              // 1.2: orden por código de carácter
    cout << "1.2) orden por defecto (las mayúsculas van antes que las minúsculas):\n"; for (auto& p : v) cout << p << ' '; cout << '\n';
    sort(v.begin(), v.end(), [](const string& a, const string& b) { return minusculas(a) < minusculas(b); });
    cout << "   ignorando mayúsculas:\n"; for (auto& p : v) cout << p << ' '; cout << '\n';
    sort(v.begin(), v.end(), [](const string& a, const string& b) { return minusculas(a) > minusculas(b); });
    cout << "   de mayor a menor:\n"; for (auto& p : v) cout << p << ' '; cout << '\n';

    // 1.3: ficheros (comprobando que entrada y salida son distintos)
    string entrada = "entrada.txt", salida = "salida.txt";
    if (entrada == salida) { cerr << "los ficheros deben ser distintos\n"; return 1; }
    { ofstream f{entrada}; f << linea << '\n'; }           // preparo un fichero de prueba
    ifstream in{entrada}; ofstream out{salida};
    if (!in || !out) { cerr << "no se pudo abrir\n"; return 1; }
    string l;
    while (getline(in, l)) for (auto& p : palabras(l)) out << p << '\n';
    cout << "1.3) escrito " << salida << '\n';
}
