#include <chrono>
#include <iostream>
#include <thread>
using namespace std;
using namespace std::chrono;

int main() {
    const auto periodo = 20ms;
    const auto inicio = steady_clock::now();
    auto siguiente = inicio + periodo;                  // instante absoluto
    for (int i = 1; i <= 5; ++i) {
        this_thread::sleep_for(3ms);                    // «trabajo» de la tarea
        cout << "tarea " << i << '\n';
        this_thread::sleep_until(siguiente);            // espera hasta el instante absoluto
        siguiente += periodo;                           // sin deriva acumulada
    }
    auto total = duration_cast<milliseconds>(steady_clock::now() - inicio).count();
    cout << "duracion ~ 100 ms: " << boolalpha << (total >= 100 && total < 115) << '\n';
}
