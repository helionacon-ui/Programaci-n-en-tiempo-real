#include <chrono>
#include <functional>
#include <iostream>
#include <mutex>
#include <string>
#include <thread>
using namespace std;

// Cada robot necesita DOS cintas (mutex m1, m2) a la vez. std::lock las coge sin interbloqueo.
void f_robot(const string& nombre, int n_piezas, mutex& m1, mutex& m2, mutex& consola, int ms) {
    const chrono::milliseconds t{ms};
    for (int i = 0; i < n_piezas; ++i) {
        {
            scoped_lock cintas{m1, m2};          // (1) acceso exclusivo a las dos cintas
            this_thread::sleep_for(t);           //     ensamblaje
            {                                    // (2) mensaje por consola (otro mutex, otro ámbito)
                lock_guard<mutex> c{consola};
                cout << nombre << " ha procesado pieza " << i << '\n';
            }
        }                                        // (3) se liberan las cintas al salir del ámbito
        this_thread::sleep_for(t);               // (4) preparación de la siguiente pieza
    }
    lock_guard<mutex> c{consola};
    cout << nombre << " ha terminado\n";
}

int main() {
    mutex ct1, ct2, ct3, consola;
    thread r1{f_robot, "[Robot 1]", 3, ref(ct1), ref(ct3), ref(consola), 20};
    thread r2{f_robot, "[Robot 2]", 3, ref(ct1), ref(ct2), ref(consola), 20};
    thread r3{f_robot, "[Robot 3]", 3, ref(ct2), ref(ct3), ref(consola), 20};
    r1.join(); r2.join(); r3.join();
}
