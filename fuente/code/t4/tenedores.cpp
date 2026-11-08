#include <iostream>
#include <mutex>
#include <thread>
using namespace std;

mutex m1, m2, consola;
void ab() { for (int i = 0; i < 1000; ++i) { scoped_lock lk{m1, m2}; } }   // los dos a la vez
void ba() { for (int i = 0; i < 1000; ++i) { scoped_lock lk{m2, m1}; } }   // orden distinto: da igual
int main() {
    thread a{ab}, b{ba};
    a.join(); b.join();
    cout << "termina sin interbloqueo\n";
}
