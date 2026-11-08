#include <chrono>
#include <iostream>
#include <mutex>
#include <optional>
#include <thread>
#include <vector>
using namespace std;
using namespace chrono_literals;

mutex m_cout;
template <typename... A> void escribir(const A&... a) { lock_guard<mutex> lk{m_cout}; (cout << ... << a) << '\n'; }

class C_Monitor {
public:
    void anyadir(int v) { lock_guard<mutex> lk{m_}; datos_.push_back(v); }
    optional<int> obtener() {
        lock_guard<mutex> lk{m_};
        if (datos_.empty()) return nullopt;
        int v = datos_.front();
        datos_.erase(datos_.begin());
        return v;
    }
private:
    mutex m_;
    vector<int> datos_;
};

void productor(C_Monitor& m1, chrono::milliseconds dormir) {
    for (int i = 1; i <= 10; ++i) {
        m1.anyadir(i);
        escribir("[Productor] genera ", i);
        this_thread::sleep_for(dormir);
    }
    escribir("[Productor] ha terminado");
}
void intermedio(C_Monitor& m1, C_Monitor& m2, chrono::milliseconds dormir) {
    for (int hechos = 0; hechos < 10;) {
        auto v = m1.obtener();
        if (!v) { escribir("[Intermedio] durmiendo ..."); this_thread::sleep_for(50ms); continue; }
        m2.anyadir(*v * 10);
        escribir("[Intermedio] obtiene ", *v, " y produce ", *v * 10);
        ++hechos;
        this_thread::sleep_for(dormir);
    }
    escribir("[Intermedio] ha terminado");
}
void consumidor(C_Monitor& m2, chrono::milliseconds dormir) {
    int suma = 0;
    for (int hechos = 0; hechos < 10;) {
        auto v = m2.obtener();
        if (!v) { this_thread::sleep_for(50ms); continue; }
        suma += *v;
        escribir("[Consumidor] obtiene ", *v);
        ++hechos;
        this_thread::sleep_for(dormir);
    }
    escribir("[Consumidor] la media es ", suma / 10, " y termina");
}

int main() {
    C_Monitor m1, m2;
    thread p{productor, ref(m1), 20ms}, i{intermedio, ref(m1), ref(m2), 20ms}, c{consumidor, ref(m2), 20ms};
    p.join(); i.join(); c.join();
}
