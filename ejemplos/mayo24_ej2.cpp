#include <chrono>
#include <iostream>
#include <mutex>
#include <numeric>
#include <optional>
#include <thread>
#include <vector>
using namespace std;
using namespace chrono_literals;

class Repositorio1 {
public:
    void insertar(int v) { lock_guard<mutex> lk{m_}; v_.push_back(v); }
    optional<double> media_y_vaciar() {
        lock_guard<mutex> lk{m_};
        if (v_.empty()) return nullopt;
        double media = accumulate(v_.begin(), v_.end(), 0.0) / v_.size();
        v_.clear();
        return media;
    }
private:
    mutex m_;
    vector<int> v_;
};

class Repositorio2 {
public:
    void anyadir(double v) { lock_guard<mutex> lk{m_}; v_.push_back(v); }
    optional<double> siguiente() {
        lock_guard<mutex> lk{m_};
        if (leidos_ >= v_.size()) return nullopt;
        return v_[leidos_++];
    }
private:
    mutex m_;
    vector<double> v_;
    size_t leidos_ = 0;
};

int main() {
    Repositorio1 r1;
    Repositorio2 r2;
    const auto t0 = chrono::steady_clock::now();
    thread insertor{[&] {
        auto t = t0;
        for (int i = 0; i < 60; ++i) { r1.insertar(7); t += 50ms; this_thread::sleep_until(t); }   // espera ABSOLUTA: no acumula deriva
    }};
    thread procesador{[&] {
        auto t = t0;
        for (int i = 0; i < 3; ++i) {
            t += 1s; this_thread::sleep_until(t);
            if (auto m = r1.media_y_vaciar()) r2.anyadir(*m);
        }
    }};
    insertor.join(); procesador.join();
    while (auto v = r2.siguiente()) cout << "media leida: " << *v << '\n';
    cout << "no quedan valores nuevos: " << boolalpha << !r2.siguiente().has_value() << '\n';
}
