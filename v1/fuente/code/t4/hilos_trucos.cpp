#include <atomic>
#include <functional>
#include <iostream>
#include <mutex>
#include <numeric>
#include <thread>
#include <vector>
using namespace std;

void sumar_rango(const vector<int>& v, size_t a, size_t b, long& resultado) {
    resultado = accumulate(v.begin() + a, v.begin() + b, 0L);
}
void incrementar_copia(int x) { ++x; }              // recibe COPIA: el original no cambia
void incrementar_ref(int& x) { ++x; }

int main() {
    // TRUCO 1: thread copia los argumentos; para pasar una referencia hay que usar ref()
    int a = 0, b = 0;
    thread t1{incrementar_copia, a}; t1.join();
    thread t2{incrementar_ref, ref(b)}; t2.join();
    cout << "1) sin ref: a=" << a << "   con ref: b=" << b << '\n';

    // TRUCO 2: cada hilo escribe en SU hueco del vector: no hace falta mutex
    vector<int> datos(1000);
    iota(datos.begin(), datos.end(), 1);                 // 1..1000
    vector<long> parcial(4);
    vector<thread> hilos;
    for (size_t i = 0; i < 4; ++i)
        hilos.emplace_back(sumar_rango, cref(datos), i * 250, (i + 1) * 250, ref(parcial[i]));
    for (auto& h : hilos) h.join();
    cout << "2) sumas parciales:";
    for (long p : parcial) cout << ' ' << p;
    cout << "  total=" << accumulate(parcial.begin(), parcial.end(), 0L) << " (esperado 500500)\n";

    // TRUCO 3: en un bucle, la lambda captura el índice POR VALOR ([i]); por referencia ([&]) el bucle lo cambia
    vector<int> orden(4, -1);
    hilos.clear();
    for (int i = 0; i < 4; ++i)
        hilos.emplace_back([i, &orden] { orden[i] = i * i; });
    for (auto& h : hilos) h.join();
    cout << "3) cuadrados:";
    for (int x : orden) cout << ' ' << x;
    cout << '\n';

    // TRUCO 4: mutex para varias operaciones a la vez; atomic para UNA operación sobre UNA variable
    long con_mutex = 0; mutex m; atomic<int> con_atomic{0};
    hilos.clear();
    for (int i = 0; i < 4; ++i)
        hilos.emplace_back([&] {
            for (int k = 0; k < 10000; ++k) { lock_guard<mutex> lk{m}; ++con_mutex; }
            for (int k = 0; k < 10000; ++k) ++con_atomic;
        });
    for (auto& h : hilos) h.join();
    cout << "4) mutex=" << con_mutex << " atomic=" << con_atomic << " (esperado 40000 los dos)\n";

    // TRUCO 5: SIEMPRE join (o detach) antes de que el objeto thread se destruya, o el programa aborta
    thread t{[] {}};
    cout << "5) joinable antes de join: " << boolalpha << t.joinable();
    t.join();
    cout << ", despues: " << t.joinable() << '\n';
}
