#include <atomic>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>
using namespace std;

int main() {
    const int N = 100000;
    int sin_proteger = 0;            // carrera de datos: resultado impredecible
    int con_mutex = 0;
    atomic<int> atomico{0};
    mutex m;
    auto trabajo = [&] {
        for (int i = 0; i < N; ++i) {
            ++sin_proteger;                              // LOAD, ADD, STORE: otro hilo puede colarse
            { lock_guard<mutex> lk{m}; ++con_mutex; }    // sección crítica
            ++atomico;                                   // operación indivisible
        }
    };
    vector<thread> hilos;
    for (int i = 0; i < 4; ++i) hilos.emplace_back(trabajo);   // los hilos arrancan ya
    for (auto& h : hilos) h.join();                           // esperar a que acaben
    cout << "esperado:  " << 4 * N << '\n';
    cout << "con mutex: " << con_mutex << '\n';
    cout << "atomico:   " << atomico << '\n';
    cout << "sin proteger acierta: " << boolalpha << (sin_proteger == 4 * N) << " (casi nunca)\n";
}
