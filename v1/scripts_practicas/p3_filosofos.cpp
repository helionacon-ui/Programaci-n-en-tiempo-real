// Práctica 3.2: cena de los filósofos con 3 cubiertos por filósofo (n filósofos, n+1 cubiertos)
#include <chrono>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>
using namespace std;
using namespace std::chrono_literals;

mutex consola;
void imprimir(const string& s) { lock_guard<mutex> lk{consola}; cout << s << '\n'; }

void filosofo(int id, mutex& c1, mutex& c2, mutex& c3, int ciclos) {
    for (int i = 0; i < ciclos; ++i) {
#ifdef INTERBLOQUEO
        c1.lock(); this_thread::sleep_for(1ms); c2.lock(); c3.lock();     // uno a uno: cada hilo retiene y espera
#else
        scoped_lock lk{c1, c2, c3};                                       // los tres a la vez, sin interbloqueo
#endif
        imprimir("F" + to_string(id) + " come");
        this_thread::sleep_for(10ms);
#ifdef INTERBLOQUEO
        c3.unlock(); c2.unlock(); c1.unlock();
#endif
        imprimir("F" + to_string(id) + " piensa");
        this_thread::sleep_for(10ms);
    }
}

int main(int argc, char* argv[]) {
    int n = argc > 1 ? stoi(argv[1]) : 3, ciclos = argc > 2 ? stoi(argv[2]) : 2;
    vector<mutex> cubiertos(n + 1);                      // un mutex por cubierto
    vector<thread> hilos;
    for (int i = 0; i < n; ++i)                           // F_i usa los cubiertos i, i+1, i+2 (módulo n+1)
        hilos.emplace_back(filosofo, i + 1, ref(cubiertos[i]), ref(cubiertos[(i + 1) % (n + 1)]), ref(cubiertos[(i + 2) % (n + 1)]), ciclos);
    for (auto& h : hilos) h.join();
    imprimir("todos han terminado");
}
