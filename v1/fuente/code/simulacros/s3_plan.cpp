#include <cmath>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

struct Tarea { const char* nombre; int C, T, D; int B; };   // B: bloqueo (ICPP)

int respuesta(const vector<Tarea>& ts, size_t i) {          // 0 si no converge antes del plazo
    int R = ts[i].C + ts[i].B;
    while (true) {
        int nuevo = ts[i].C + ts[i].B;
        for (size_t j = 0; j < i; ++j) nuevo += ((R + ts[j].T - 1) / ts[j].T) * ts[j].C;   // techo con enteros
        if (nuevo == R) return R;
        R = nuevo;
        if (R > ts[i].D) return 0;
    }
}

int main() {
    vector<Tarea> ts{{"t1", 2, 8, 8, 0}, {"t2", 3, 12, 12, 0}, {"t3", 4, 24, 24, 0}};
    double U = 0;
    for (auto& t : ts) U += double(t.C) / t.T;
    cout << "U = " << U << ", cota n=3: " << 3 * (pow(2, 1.0 / 3) - 1) << '\n';
    cout << "Sin bloqueo: ";
    for (size_t i = 0; i < ts.size(); ++i) cout << "R" << i + 1 << "=" << respuesta(ts, i) << ' ';
    cout << '\n';
    ts[0].B = 2; ts[1].B = 2; ts[2].B = 0;                  // t3 usa r1 durante 2; techo(r1)=P1
    cout << "Con ICPP (B=2,2,0): ";
    for (size_t i = 0; i < ts.size(); ++i) cout << "R" << i + 1 << "=" << respuesta(ts, i) << ' ';
    cout << '\n';

    int H = 1;
    for (auto& t : ts) H = lcm(H, t.T);
    int Cmax = 0;
    for (auto& t : ts) Cmax = max(Cmax, t.C);
    cout << "H = " << H << ", Cmax = " << Cmax << "\nMarcos validos: ";
    for (int Ts = Cmax; Ts <= H; ++Ts) {
        if (H % Ts) continue;
        bool ok = true;
        for (auto& t : ts) if (2 * Ts - gcd(Ts, t.T) > t.D) ok = false;
        if (ok) cout << Ts << ' ';
    }
    cout << '\n';
}
