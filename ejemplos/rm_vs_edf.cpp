#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

struct Tarea { int C, T; };

// Simulación por unidades de tiempo. politica: 0 = RM (menor periodo primero), 1 = EDF (plazo más cercano primero)
int simular(const vector<Tarea>& ts, int politica, int horizonte, vector<string>& log) {
    int n = ts.size(), fallos = 0;
    vector<int> resta(n, 0), plazo(n, 0);
    for (int t = 0; t < horizonte; ++t) {
        for (int i = 0; i < n; ++i) {
            if (t % ts[i].T == 0) {                       // nueva liberación
                if (resta[i] > 0) { ++fallos; log.push_back("t=" + to_string(t) + ": tau" + to_string(i + 1) + " NO terminó antes de su nuevo periodo"); }
                resta[i] = ts[i].C; plazo[i] = t + ts[i].T;
            }
        }
        int mejor = -1;
        for (int i = 0; i < n; ++i) {
            if (resta[i] == 0) continue;
            if (mejor < 0 || (politica == 0 ? ts[i].T < ts[mejor].T : plazo[i] < plazo[mejor])) mejor = i;
        }
        if (mejor >= 0) --resta[mejor];
    }
    return fallos;
}

int main() {
    vector<Tarea> ts{{2, 5}, {4, 7}};
    double U = 0;
    for (auto& t : ts) U += double(t.C) / t.T;
    int H = lcm(5, 7);
    cout << "U = " << U << " (<= 1: EDF puede) ; cota RM n=2 = 0.828 (U la supera: RM no es seguro)\n";
    // Tiempo de respuesta de tau2 con RM: R = 4 + ceil(R/5)*2
    int R = 4;
    cout << "R2 (RM):";
    for (;;) { cout << ' ' << R; int nuevo = 4 + ((R + 4) / 5) * 2; if (nuevo == R || nuevo > 7) { if (nuevo != R) cout << ' ' << nuevo << " > D=7 -> NO planificable con RM"; break; } R = nuevo; }
    cout << '\n';
    vector<string> log;
    cout << "Simulación de " << H << " unidades:\n";
    cout << " RM : fallos = " << simular(ts, 0, H, log) << '\n';
    for (auto& l : log) cout << "      " << l << '\n';
    log.clear();
    cout << " EDF: fallos = " << simular(ts, 1, H, log) << '\n';
}
