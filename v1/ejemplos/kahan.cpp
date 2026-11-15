#include <cmath>
#include <iomanip>
#include <iostream>
#include <vector>
using namespace std;

bool casi_igual(double a, double b, double rel = 1e-9) {          // tolerancia RELATIVA: funciona con números grandes y pequeños
    return fabs(a - b) <= rel * max(fabs(a), fabs(b));
}

int main() {
    cout << setprecision(10);
    const int N = 10'000'000;
    float sf = 0; double sd = 0;
    for (int i = 0; i < N; ++i) { sf += 0.1f; sd += 0.1; }
    // Kahan: guarda en 'c' lo que se pierde en cada suma y lo recupera en la siguiente
    double s = 0, c = 0;
    for (int i = 0; i < N; ++i) { double y = 0.1 - c; double t = s + y; c = (t - s) - y; s = t; }
    cout << "suma de 0,1 diez millones de veces (exacto: 1000000)\n";
    cout << "  float : " << sf << "\n  double: " << sd << "\n  Kahan : " << s << '\n';

    cout << "\nUn bucle con paso 0,1 y == nunca para exactamente en 1:\n";
    int vueltas = 0;
    for (double x = 0; x < 1.0 - 1e-9 && vueltas < 20; x += 0.1) ++vueltas;
    cout << "  con tolerancia: " << vueltas << " vueltas\n";
    double x = 0; for (int i = 0; i < 10; ++i) x += 0.1;
    cout << boolalpha << "  tras 10 sumas, x == 1.0 ? " << (x == 1.0) << " ; x = " << setprecision(17) << x << '\n';
    cout << setprecision(10);

    cout << "\nComparar con tolerancia absoluta frente a relativa:\n";
    double a = 1e12, b = 1e12 + 0.0001;
    cout << "  fabs(a-b) < 1e-9 : " << (fabs(a - b) < 1e-9) << " (falla: a y b son casi iguales)\n";
    cout << "  casi_igual(a,b)  : " << casi_igual(a, b) << '\n';

    cout << "\nOrden de suma: sumar de menor a mayor pierde menos\n";
    vector<float> v;
    v.push_back(1e8f);
    for (int i = 0; i < 100; ++i) v.push_back(1.0f);
    float mayor_primero = 0, menor_primero = 0;
    for (float t : v) mayor_primero += t;
    for (auto it = v.rbegin(); it != v.rend(); ++it) menor_primero += *it;
    cout << "  1e8 + cien unos, mayor primero: " << mayor_primero << " ; menor primero: " << menor_primero << " (exacto 100000100)\n";
}
