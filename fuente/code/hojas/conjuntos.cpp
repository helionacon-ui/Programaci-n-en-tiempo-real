#include <algorithm>
#include <iostream>
#include <iterator>
#include <set>
#include <string>
using namespace std;

set<int> unir(const set<int>& a, const set<int>& b) { set<int> r{a}; r.insert(b.begin(), b.end()); return r; }
set<int> interseccion(const set<int>& a, const set<int>& b) {
    set<int> r; for (int x : a) if (b.count(x)) r.insert(x); return r;
}
set<int> diferencia(const set<int>& a, const set<int>& b) {
    set<int> r; for (int x : a) if (!b.count(x)) r.insert(x); return r;
}
bool es_subconjunto(const set<int>& a, const set<int>& b) {     // ¿a está contenido en b?
    return includes(b.begin(), b.end(), a.begin(), a.end());
}
ostream& operator<<(ostream& os, const set<int>& s) {
    os << '{'; bool primero = true;
    for (int x : s) { os << (primero ? "" : ", ") << x; primero = false; }
    return os << '}';
}
bool repetidos_set(const string& s) {              // con set: insert devuelve .second == false si ya estaba
    set<char> vistos;
    for (char c : s) if (!vistos.insert(c).second) return true;
    return false;
}
bool repetidos_sin_colecciones(const string& s) {  // sin colecciones: dos bucles anidados
    for (size_t i = 0; i < s.size(); ++i)
        for (size_t j = i + 1; j < s.size(); ++j) if (s[i] == s[j]) return true;
    return false;
}

int main() {
    set<int> a{1, 2, 3, 4}, b{3, 4, 5};
    cout << "a=" << a << " b=" << b << '\n';
    cout << "union: " << unir(a, b) << "  interseccion: " << interseccion(a, b) << "  a-b: " << diferencia(a, b) << '\n';
    cout << boolalpha << "{3,4} en a: " << es_subconjunto({3, 4}, a) << ", b en a: " << es_subconjunto(b, a) << '\n';
    for (string s : {"", "hola", "hello"})
        cout << "\"" << s << "\": set=" << repetidos_set(s) << " sin colecciones=" << repetidos_sin_colecciones(s) << '\n';
}
