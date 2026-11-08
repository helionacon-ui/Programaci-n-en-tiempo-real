#include <algorithm>
#include <iostream>
#include <map>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

int main() {
    // TRUCO 1: partir una línea en palabras (cin >> corta por espacios)
    istringstream linea{"hola mundo hola tiempo real mundo hola"};
    vector<string> palabras;
    for (string p; linea >> p;) palabras.push_back(p);
    cout << "1) " << palabras.size() << " palabras\n";

    // TRUCO 2: contar con map: ++m[clave] crea la entrada con 0 si no existía
    map<string, int> cuenta;
    for (const auto& p : palabras) ++cuenta[p];
    cout << "2) ";
    for (const auto& [palabra, n] : cuenta) cout << palabra << '=' << n << ' ';
    cout << '\n';

    // TRUCO 3: un map se ordena por CLAVE; para ordenar por VALOR, copia a vector<pair> y sort con lambda
    vector<pair<string, int>> v(cuenta.begin(), cuenta.end());
    sort(v.begin(), v.end(), [](const auto& a, const auto& b) { return a.second != b.second ? a.second > b.second : a.first < b.first; });
    cout << "3) mas frecuente: " << v[0].first << " (" << v[0].second << ")\n";

    // TRUCO 4: borrar por condición = erase(remove_if(...), end)
    vector<int> n{5, 12, 7, 20, 3, 15};
    n.erase(remove_if(n.begin(), n.end(), [](int x) { return x > 10; }), n.end());
    cout << "4) tras borrar los > 10:";
    for (int x : n) cout << ' ' << x;
    cout << '\n';

    // TRUCO 5: borrar dentro de un bucle: el iterador que devuelve erase ya apunta al siguiente
    vector<int> m{1, 2, 3, 4, 5, 6};
    for (auto it = m.begin(); it != m.end();) {
        if (*it % 2 == 0) it = m.erase(it);   // NO avanzar: erase ya lo hizo
        else ++it;
    }
    cout << "5) impares:";
    for (int x : m) cout << ' ' << x;
    cout << '\n';

    // TRUCO 6: `for (auto x : v)` COPIA cada elemento; `auto&` modifica el original
    vector<int> w{1, 2, 3};
    for (auto x : w) x *= 10;          // no cambia w
    cout << "6a) copia: " << w[0] << ' ' << w[1] << ' ' << w[2] << '\n';
    for (auto& x : w) x *= 10;         // cambia w
    cout << "6b) referencia: " << w[0] << ' ' << w[1] << ' ' << w[2] << '\n';

    // TRUCO 7: mezclar >> y getline: >> deja el '\n' en el flujo, getline lo lee y devuelve una línea vacía
    istringstream in{"42\nHola Mundo\n"};
    int edad; string nombre;
    in >> edad;
    getline(in, nombre);
    cout << "7a) sin ignore: [" << nombre << "]\n";
    istringstream in2{"42\nHola Mundo\n"};
    in2 >> edad; in2.ignore(1000, '\n'); getline(in2, nombre);
    cout << "7b) con ignore: [" << nombre << "]\n";

    // TRUCO 8: .at() comprueba límites (lanza excepción); [] no comprueba
    try { w.at(10); } catch (const out_of_range&) { cout << "8) at(10) lanza out_of_range\n"; }

    // TRUCO 9: find en un map no crea entradas; [] sí
    map<string, int> mm;
    if (mm.find("x") == mm.end()) cout << "9a) tamano tras find: " << mm.size() << '\n';
    (void)mm["x"];
    cout << "9b) tamano tras []: " << mm.size() << '\n';
}
