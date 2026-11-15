#include <chrono>
#include <iostream>
#include <thread>
using namespace std;
using namespace std::chrono_literals;

void f_a() { cout << 'A'; }          // 10 ms de trabajo (aquí solo se imprime)
void f_b() { cout << 'B'; }          //  8 ms
void f_c() { cout << 'C'; }          // 12 ms

int main() {
    const auto ts = 40ms;                                   // ciclo secundario
    auto siguiente = chrono::steady_clock::now() + ts;      // instante absoluto del siguiente ciclo
    for (int vuelta = 0; vuelta < 12; ++vuelta) {           // 2 ciclos principales de 240 ms (en un sistema real: while(true))
        switch (vuelta % 6) {                                // plan del ciclo principal (6 ciclos secundarios)
            case 0: f_a(); f_b(); f_c(); break;
            case 1: f_a(); break;
            case 2: f_a(); f_b(); break;
            case 3: f_a(); f_c(); break;
            case 4: f_a(); f_b(); break;
            case 5: f_a(); break;
        }
        cout << ' ';
        this_thread::sleep_until(siguiente);                // espera hasta el instante absoluto: sin deriva
        siguiente += ts;
    }
    cout << '\n';
}
