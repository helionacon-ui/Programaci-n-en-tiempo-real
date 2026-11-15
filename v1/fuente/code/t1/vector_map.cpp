#include <algorithm>
#include <iostream>
#include <map>
#include <set>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

int main() {
    // 1) vector: size frente a capacity
    vector<int> v;
    size_t cap = v.capacity();
    for (int i = 1; i <= 17; ++i) {
        v.push_back(i);
        if (v.capacity() != cap) { cap = v.capacity(); cout << "size " << v.size() << " -> capacity " << cap << '\n'; }
    }
    // 2) map: contar palabras. find no crea entradas; [] sí
    map<string, int> hist;
    istringstream in("el que lee el que sabe el");
    string w;
    while (in >> w) ++hist[w];
    for (const auto& [palabra, n] : hist) cout << palabra << ": " << n << '\n';
    cout << "tamaño antes: " << hist.size() << '\n';
    if (hist.find("zzz") == hist.end()) cout << "zzz no está\n";
    int x = hist["zzz"];   // ¡crea la entrada con valor 0!
    cout << "tamaño después de hist[\"zzz\"]: " << hist.size() << " (x=" << x << ")\n";
    // 3) borrar del vector con iteradores
    vector<int> n{1, 2, 3, 4, 5, 6};
    for (auto it = n.begin(); it != n.end();) {
        if (*it % 2 == 0) it = n.erase(it);  // erase devuelve el siguiente
        else ++it;
    }
    for (int e : n) cout << e << ' ';
    cout << '\n';
    // 4) sort con lambda y set
    vector<string> s{"pera", "Manzana", "kiwi", "uva"};
    stable_sort(s.begin(), s.end(), [](const string& a, const string& b) { return a.size() < b.size(); });
    for (auto& e : s) cout << e << ' ';
    cout << '\n';
    set<int> st{5, 1, 3, 1, 5};
    cout << "set: ";
    for (int e : st) cout << e << ' ';
    cout << '\n';
}
