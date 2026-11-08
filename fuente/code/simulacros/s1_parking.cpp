#include <algorithm>
#include <atomic>
#include <chrono>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>
using namespace std;
using namespace chrono_literals;

class Parking {
public:
    explicit Parking(int plazas) : libres_{plazas} {}
    bool entrar() {                                       // false si el parking cerró mientras esperaba
        unique_lock<mutex> lk{m_};
        hay_hueco_.wait(lk, [this] { return libres_ > 0 || cerrado_; });
        if (cerrado_) return false;
        --libres_;
        ocupadas_max_ = max(ocupadas_max_, total_ - libres_);
        return true;
    }
    void salir() {
        { lock_guard<mutex> lk{m_}; ++libres_; }
        hay_hueco_.notify_one();                          // un hueco: despierta a uno
    }
    void cerrar() {
        { lock_guard<mutex> lk{m_}; cerrado_ = true; }
        hay_hueco_.notify_all();                          // el cierre interesa a todos
    }
    int max_ocupadas() { lock_guard<mutex> lk{m_}; return ocupadas_max_; }
private:
    mutex m_;
    condition_variable hay_hueco_;
    int libres_;
    const int total_ = libres_;
    int ocupadas_max_ = 0;
    bool cerrado_ = false;
};

int main() {
    Parking p{2};
    atomic<int> entradas{0};
    vector<thread> coches;
    for (int i = 0; i < 6; ++i)
        coches.emplace_back([&] {
            if (p.entrar()) { ++entradas; this_thread::sleep_for(50ms); p.salir(); }
        });
    for (auto& c : coches) c.join();
    p.cerrar();
    cout << "entradas = " << entradas << '\n';
    cout << boolalpha << "max ocupadas <= 2: " << (p.max_ocupadas() <= 2) << '\n';
    cout << "entrada tras cierre: " << p.entrar() << '\n';
}
