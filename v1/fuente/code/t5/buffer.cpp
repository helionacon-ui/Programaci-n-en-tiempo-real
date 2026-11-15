#include <condition_variable>
#include <iostream>
#include <mutex>
#include <queue>
#include <thread>
#include <vector>
using namespace std;

// Monitor: datos + mutex + condiciones de sincronización, todo dentro de la clase
class Buffer {
public:
    explicit Buffer(size_t cap) : cap_{cap} {}
    void poner(int v) {
        unique_lock<mutex> lk{m_};
        no_lleno_.wait(lk, [&] { return q_.size() < cap_; });      // espera mientras esté lleno
        q_.push(v);
        no_vacio_.notify_one();
    }
    bool sacar(int& v) {                                            // false = cerrado y vacío
        unique_lock<mutex> lk{m_};
        no_vacio_.wait(lk, [&] { return !q_.empty() || cerrado_; });
        if (q_.empty()) return false;
        v = q_.front(); q_.pop();
        no_lleno_.notify_one();
        return true;
    }
    void cerrar() { { lock_guard<mutex> lk{m_}; cerrado_ = true; } no_vacio_.notify_all(); }
private:
    mutex m_;
    condition_variable no_lleno_, no_vacio_;
    queue<int> q_;
    size_t cap_;
    bool cerrado_ = false;
};

int main() {
    Buffer b{3};
    long suma[2] = {0, 0};
    auto consumidor = [&](int id) { int v; while (b.sacar(v)) suma[id] += v; };
    thread c0{consumidor, 0}, c1{consumidor, 1};
    thread p{[&] { for (int i = 1; i <= 100; ++i) b.poner(i); b.cerrar(); }};
    p.join(); c0.join(); c1.join();
    cout << "suma total consumida = " << suma[0] + suma[1] << " (esperado 5050)\n";
}
