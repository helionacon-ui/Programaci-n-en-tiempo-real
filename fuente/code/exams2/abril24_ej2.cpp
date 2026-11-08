#include <chrono>
#include <iostream>
#include <mutex>
#include <string>
#include <thread>
#include <utility>
#include <vector>
using namespace std;
using namespace chrono_literals;

class C_Monitor {
public:
    explicit C_Monitor(size_t max) : v1_(max, 0), v2_(max, 0), max_{max} {}
    size_t tam_v1() const { return v1_.size(); }
    size_t tam_v2() const { return v2_.size(); }
    int leer_v1(size_t pos) { lock_guard<mutex> lk{m1_}; return pos < v1_.size() ? v1_[pos] : -1; }
    int leer_v2(size_t pos) { lock_guard<mutex> lk{m2_}; return pos < v2_.size() ? v2_[pos] : -1; }
    pair<int, int> leer_v1y2(size_t p1, size_t p2) {
        scoped_lock lk{m1_, m2_};                              // los dos a la vez: sin interbloqueo
        return {p1 < v1_.size() ? v1_[p1] : -1, p2 < v2_.size() ? v2_[p2] : -1};
    }
    bool escribir_v1(size_t pos, int val) { lock_guard<mutex> lk{m1_}; if (pos >= v1_.size()) return false; v1_[pos] = val; return true; }
    bool escribir_v2(size_t pos, int val) { lock_guard<mutex> lk{m2_}; if (pos >= v2_.size()) return false; v2_[pos] = val; return true; }
    bool escribir_v1y2(size_t p1, int a, size_t p2, int b) {
        scoped_lock lk{m1_, m2_};
        if (p1 >= v1_.size() || p2 >= v2_.size()) return false;
        v1_[p1] = a; v2_[p2] = b;
        return true;
    }
private:
    vector<int> v1_, v2_;
    mutex m1_, m2_;
    size_t max_;
};

mutex m_cout;
void productor(string id, int ms, size_t pos, C_Monitor& m) {
    for (int i = 1; i <= 10; ++i) {
        m.escribir_v1(pos, i);
        { lock_guard<mutex> lk{m_cout}; cout << id << " escribe " << i << " en v1[" << pos << "]\n"; }
        this_thread::sleep_for(chrono::milliseconds(ms));
    }
}
void consumidor(string id, int ms, size_t pos, C_Monitor& m, int& ultimo) {
    for (int i = 1; i <= 10; ++i) {
        ultimo = m.leer_v1(pos);
        { lock_guard<mutex> lk{m_cout}; cout << id << " lee " << ultimo << " de v1[" << pos << "]\n"; }
        this_thread::sleep_for(chrono::milliseconds(ms));
    }
}

int main() {
    C_Monitor m{5};
    vector<thread> hilos;
    vector<int> ultimos(5, 0);
    for (size_t p = 0; p < 5; ++p) hilos.emplace_back(productor, "P" + to_string(p), 5, p, ref(m));
    for (size_t p = 0; p < 5; ++p) hilos.emplace_back(consumidor, "C" + to_string(p), 5, p, ref(m), ref(ultimos[p]));
    for (auto& h : hilos) h.join();
    auto par = m.leer_v1y2(2, 99);
    cout << "leer_v1y2(2,99) = (" << par.first << ", " << par.second << ")  <- -1 si la posicion no existe\n";
    cout << boolalpha << "escribir_v1(7,1) = " << m.escribir_v1(7, 1) << ", escribir_v1y2(1,5,2,6) = " << m.escribir_v1y2(1, 5, 2, 6) << '\n';
}
