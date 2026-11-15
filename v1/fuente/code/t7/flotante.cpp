#include <cmath>
#include <cstdio>
#include <iostream>
using namespace std;

int main() {
    cout.precision(17);
    cout << "0.1 + 0.2 == 0.3 ? " << boolalpha << (0.1 + 0.2 == 0.3) << '\n';
    cout << "0.1 + 0.2 = " << 0.1 + 0.2 << '\n';
    cout << "|0.1+0.2-0.3| < 1e-9 ? " << (fabs(0.1 + 0.2 - 0.3) < 1e-9) << '\n';
    double s = 0;
    for (int i = 0; i < 10; ++i) s += 0.1;
    cout << "suma de diez 0.1 = " << s << " (== 1 ? " << (s == 1.0) << ")\n";

    // Reloj del Patriot: décimas de segundo como entero, 0,1 truncado a 23 bits tras la coma
    const double truncado = floor(0.1 * (1 << 23)) / (1 << 23);
    const double error_tic = 0.1 - truncado;
    const long tics = 100L * 3600 * 10;                  // 100 horas
    const double deriva = tics * error_tic;
    printf("error por tic   = %.3e s\n", error_tic);
    printf("deriva en 100 h = %.4f s\n", deriva);
    printf("desplazamiento  = %.0f m (Scud a 1676 m/s)\n", deriva * 1676);
}
