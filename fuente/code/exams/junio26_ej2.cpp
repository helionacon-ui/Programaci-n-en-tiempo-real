#include <chrono>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>
using namespace std;

mutex consola;   // la salida por consola también es un recurso compartido
void imprimir(const string& s) { lock_guard<mutex> lk{consola}; cout << s << '\n'; }

// Monitor: los hilos esperan hasta que alguien abre; después nadie espera.
class Barrera {
    mutex m_;
    condition_variable cv_;
    bool abierta_ = false;
public:
    void entrar() {
        unique_lock<mutex> lk{m_};
        cv_.wait(lk, [this] { return abierta_; });   // el predicado evita despertares espurios
    }
    void abrir() {
        { lock_guard<mutex> lk{m_}; abierta_ = true; }
        cv_.notify_all();
    }
};

// Se abre sola cuando han llegado max_hilos.
class Barrera_Num {
    mutex m_;
    condition_variable cv_;
    const int max_;
    int llegados_ = 0;
    bool abierta_ = false;
public:
    explicit Barrera_Num(int max_hilos) : max_{max_hilos} {}
    void entrar() {
        unique_lock<mutex> lk{m_};
        if (++llegados_ >= max_) { abierta_ = true; cv_.notify_all(); }
        else cv_.wait(lk, [this] { return abierta_; });
    }
};

int main() {
    Barrera b;
    vector<thread> hs;
    for (int i = 1; i <= 5; ++i)
        hs.emplace_back([&b, i] {
            imprimir("Hilo Barrera #" + to_string(i) + " entrando");
            b.entrar();
            imprimir("Hilo Barrera #" + to_string(i) + " saliendo");
        });
    this_thread::sleep_for(chrono::milliseconds(100));
    imprimir("--- abriendo Barrera ---");
    b.abrir();
    for (auto& h : hs) h.join();
    hs.clear();

    Barrera_Num bn{3};
    for (int i = 1; i <= 5; ++i)
        hs.emplace_back([&bn, i] {
            this_thread::sleep_for(chrono::milliseconds(30 * i));
            imprimir("Hilo Barrera_Num #" + to_string(i) + " entrando");
            bn.entrar();
            imprimir("Hilo Barrera_Num #" + to_string(i) + " saliendo");
        });
    for (auto& h : hs) h.join();
}
