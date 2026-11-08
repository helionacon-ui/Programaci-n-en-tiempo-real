#include <chrono>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <numeric>
#include <vector>
using namespace std;

int main() {
    // 1) Leibniz: pi/4 = sum_{n>=0} (-1)^n / (2n+1)
    double pi_4 = 0;
    for (int n = 0; n < 1000000; ++n) pi_4 += (n % 2 == 0 ? 1.0 : -1.0) / (2 * n + 1);
    cout << boolalpha << "pi_4 == M_PI_4 ? " << (pi_4 == M_PI_4) << '\n';
    cout << setprecision(12) << pi_4 << " vs " << M_PI_4 << '\n';
    cout << "|diferencia| < 1e-6 ? " << (fabs(pi_4 - M_PI_4) < 1e-6) << '\n';

    // 2) sumas parciales hasta el final (suma desde i hasta el último)
    vector<int> v(10);
    iota(v.begin(), v.end(), 1);
    vector<int> sumas(v.size());
    int acum = 0;
    for (int i = static_cast<int>(v.size()) - 1; i >= 0; --i) { acum += v[i]; sumas[i] = acum; }
    for (int x : sumas) cout << x << ' ';
    cout << '\n';

    // 3) criba de Eratóstenes ('d' desconocido, 'p' primo, 'c' compuesto)
    const size_t N = 1000000;
    vector<char> marca(N + 1, 'd');
    marca[0] = marca[1] = 'c';
    for (size_t i = 2; i <= N; ++i) {
        if (marca[i] != 'd') continue;
        marca[i] = 'p';
        for (size_t m = i * i; m <= N; m += i) marca[m] = 'c';     // desde i*i: los anteriores ya están marcados
    }
    long cuenta = 0;
    for (char c : marca) cuenta += (c == 'p');
    cout << "primos hasta 1000000: " << cuenta << '\n';
    cout << "ultimos 8:";
    int mostrados = 0;
    vector<size_t> ult;
    for (size_t i = N; i > 1 && mostrados < 8; --i) if (marca[i] == 'p') { ult.push_back(i); ++mostrados; }
    for (auto it = ult.rbegin(); it != ult.rend(); ++it) cout << ' ' << *it;
    cout << '\n';
}
