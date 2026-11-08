// Práctica 3.4: Almacen (monitor). Un generador y varios lectores: cada lector lee cada valor UNA vez,
// y el generador no escribe el siguiente hasta que todos los lectores han leído el actual.
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <iostream>
#include <map>
#include <mutex>
#include <thread>
#include <vector>
using namespace std;
using namespace std::chrono_literals;

class Almacen {
public:
    void anyadir_lector(thread::id id) { lock_guard<mutex> lk{m_}; leido_[id] = true; }     // empieza «sin pendiente»
    void anyadir(int v) {
        unique_lock<mutex> lk{m_};
        cv_.wait(lk, [&] { return todos_han_leido() || cerrado_; });                         // espera si alguien no ha leído
        if (cerrado_) return;
        valor_ = v;
        for (auto& [id, ok] : leido_) ok = false;                                            // ahora todos tienen pendiente
        cv_.notify_all();
    }
    bool leer(int& v) {                                                                      // false = almacén cerrado
        unique_lock<mutex> lk{m_};
        auto yo = this_thread::get_id();
        cv_.wait(lk, [&] { return !leido_[yo] || cerrado_; });                               // espera un valor nuevo
        if (leido_[yo]) return false;                                                        // cerrado y sin pendiente
        v = valor_; leido_[yo] = true;
        cv_.notify_all();                                                                    // quizá era el último lector
        return true;
    }
    void cerrar() { { lock_guard<mutex> lk{m_}; cerrado_ = true; } cv_.notify_all(); }
private:
    bool todos_han_leido() const { for (const auto& [id, ok] : leido_) if (!ok) return false; return true; }
    mutex m_;
    condition_variable cv_;
    map<thread::id, bool> leido_;
    int valor_ = 0;
    bool cerrado_ = false;
};

int main() {
    Almacen a;
    atomic<bool> seguir{true};
    vector<long> suma(3, 0), cuenta(3, 0);
    vector<thread> lectores;
    for (int i = 0; i < 3; ++i)
        lectores.emplace_back([&, i] {
            a.anyadir_lector(this_thread::get_id());
            int v;
            while (seguir && a.leer(v)) { suma[i] += v; ++cuenta[i]; this_thread::sleep_for(chrono::milliseconds(2 + 3 * i)); }
        });
    this_thread::sleep_for(50ms);                                  // deja que se registren los lectores
    thread generador{[&] { for (int v = 0; v <= 6; ++v) a.anyadir(v); }};
    generador.join();
    this_thread::sleep_for(60ms);                                  // los lectores terminan de leer el último valor
    seguir = false; a.cerrar();
    for (auto& h : lectores) h.join();
    for (int i = 0; i < 3; ++i) cout << "lector " << i << ": " << cuenta[i] << " valores, suma " << suma[i] << '\n';
    cout << "(cada lector debe leer 7 valores y sumar 21)\n";
}
