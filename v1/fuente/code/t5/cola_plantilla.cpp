#include <chrono>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <queue>
#include <thread>
#include <vector>
using namespace std;
using namespace chrono_literals;

// PLANTILLA DE MONITOR: copia este esqueleto y cambia solo el estado y los predicados.
template <typename T>
class Cola {
public:
    explicit Cola(size_t capacidad) : cap_{capacidad} {}
    bool poner(T x) {                                          // false si se cerró
        unique_lock<mutex> lk{m_};                             // 1) tomar el mutex
        hay_hueco_.wait(lk, [this] { return q_.size() < cap_ || cerrada_; });   // 2) esperar con PREDICADO (incluye el cierre)
        if (cerrada_) return false;
        q_.push(move(x));                                      // 3) cambiar el estado
        hay_dato_.notify_one();                                // 4) avisar a quien espera lo contrario
        return true;
    }
    bool sacar(T& x) {                                         // false si cerrada y vacía
        unique_lock<mutex> lk{m_};
        hay_dato_.wait(lk, [this] { return !q_.empty() || cerrada_; });
        if (q_.empty()) return false;
        x = move(q_.front()); q_.pop();
        hay_hueco_.notify_one();
        return true;
    }
    void cerrar() {
        { lock_guard<mutex> lk{m_}; cerrada_ = true; }
        hay_hueco_.notify_all();                               // el cierre interesa a TODOS
        hay_dato_.notify_all();
    }
    bool sacar_con_limite(T& x, chrono::milliseconds t) {      // espera como mucho t
        unique_lock<mutex> lk{m_};
        if (!hay_dato_.wait_for(lk, t, [this] { return !q_.empty(); })) return false;
        x = move(q_.front()); q_.pop();
        hay_hueco_.notify_one();
        return true;
    }
private:
    mutex m_;
    condition_variable hay_hueco_, hay_dato_;
    queue<T> q_;
    size_t cap_;
    bool cerrada_ = false;
};

int main() {
    Cola<int> cola{3};
    vector<thread> prod, cons;
    vector<long> suma(2, 0);
    for (int p = 0; p < 2; ++p)
        prod.emplace_back([&, p] { for (int i = 1; i <= 50; ++i) cola.poner(p * 100 + i); });
    for (int c = 0; c < 2; ++c)
        cons.emplace_back([&, c] { int x; while (cola.sacar(x)) suma[c] += x; });
    for (auto& t : prod) t.join();
    cola.cerrar();                                             // los consumidores terminan al vaciar
    for (auto& t : cons) t.join();
    cout << "suma total = " << suma[0] + suma[1] << " (esperado " << 2 * 1275 + 50 * 100 << ")\n";
    int x;
    Cola<int> vacia{1};
    cout << boolalpha << "sacar_con_limite en cola vacia: " << vacia.sacar_con_limite(x, 50ms) << '\n';
}
