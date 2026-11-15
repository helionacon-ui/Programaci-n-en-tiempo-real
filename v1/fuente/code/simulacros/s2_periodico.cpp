#include <atomic>
#include <chrono>
#include <iostream>
#include <thread>
#include <vector>
using namespace std;
using namespace chrono;

int main() {
    // 1) tarea periódica sin deriva: sleep_until sobre el instante anterior + periodo
    const auto periodo = 20ms;
    int ticks = 0;
    auto inicio = steady_clock::now();
    thread t{[&] {
        auto siguiente = steady_clock::now();
        for (int k = 0; k < 5; ++k) {
            ++ticks;                                    // «trabajo» de la tarea
            siguiente += periodo;                       // se suma al instante teórico, no a now()
            this_thread::sleep_until(siguiente);
        }
    }};
    t.join();
    auto ms = duration_cast<milliseconds>(steady_clock::now() - inicio).count();
    cout << "ticks = " << ticks << '\n';
    cout << boolalpha << "duracion >= 100 ms: " << (ms >= 100) << ", < 150 ms: " << (ms < 150) << '\n';

    // 2) cuatro hilos suman 1000 veces con atomic
    atomic<int> total{0};
    vector<thread> hilos;
    for (int i = 0; i < 4; ++i) hilos.emplace_back([&] { for (int k = 0; k < 1000; ++k) ++total; });
    for (auto& h : hilos) h.join();
    cout << "total = " << total << '\n';
}
