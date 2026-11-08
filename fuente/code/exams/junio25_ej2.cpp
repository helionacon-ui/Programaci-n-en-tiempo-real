#include <atomic>
#include <chrono>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <string>
#include <thread>
#include <vector>
using namespace std;
using namespace chrono_literals;

mutex consola;
template <class... A> void imprimir(A&&... a) {
    lock_guard<mutex> lk{consola};
    (cout << ... << a) << '\n';
}

// Monitor: dos vectores de piezas, un mutex y una variable de condición para el ensamblador.
class C_Almacen {
    mutex m_;
    condition_variable hay_piezas_;
    vector<string> cuerpos_, ruedas_;
    bool terminar_ = false;
public:
    void poner_cuerpo(const string& c) {
        { lock_guard<mutex> lk{m_}; cuerpos_.push_back(c); }
        hay_piezas_.notify_all();
    }
    void poner_rueda(const string& r) {
        { lock_guard<mutex> lk{m_}; ruedas_.push_back(r); }
        hay_piezas_.notify_all();
    }
    // Espera 1 cuerpo + 2 ruedas. Devuelve false si se ha pedido terminar (y no se saca nada).
    bool sacar_piezas(string& cuerpo, string& r1, string& r2) {
        unique_lock<mutex> lk{m_};
        hay_piezas_.wait(lk, [this] { return terminar_ || (!cuerpos_.empty() && ruedas_.size() >= 2); });
        if (terminar_) return false;
        cuerpo = cuerpos_.back(); cuerpos_.pop_back();
        r1 = ruedas_.back(); ruedas_.pop_back();
        r2 = ruedas_.back(); ruedas_.pop_back();
        return true;
    }
    void terminar() {
        { lock_guard<mutex> lk{m_}; terminar_ = true; }
        hay_piezas_.notify_all();
    }
    bool debe_terminar() { lock_guard<mutex> lk{m_}; return terminar_; }
};

void f_cuerpos(C_Almacen& a, const string& id) {
    for (int n = 1; !a.debe_terminar(); ++n) {
        this_thread::sleep_for(500ms);
        a.poner_cuerpo("[" + id + "] cuerpo " + to_string(n));
        imprimir("[", id, "] cuerpo ", n);
    }
    imprimir("[", id, "] cuerpos termina");
}
void f_ruedas(C_Almacen& a, const string& id) {
    for (int n = 1; !a.debe_terminar(); ++n) {
        this_thread::sleep_for(200ms);
        a.poner_rueda("[" + id + "] rueda " + to_string(n));
        imprimir("[", id, "] rueda ", n);
    }
    imprimir("[", id, "] ruedas termina");
}
void f_ensamblar(C_Almacen& a, const string& id) {
    string c, r1, r2;
    for (int n = 1; a.sacar_piezas(c, r1, r2); ++n) {
        this_thread::sleep_for(300ms);
        imprimir("[", id, "] ensambla patinete ", n, " usando ", c, ", ", r1, ", ", r2);
    }
    imprimir("[", id, "] termina");
}

int main() {
    C_Almacen almacen;
    vector<thread> hs;
    for (int i = 1; i <= 2; ++i) {
        hs.emplace_back(f_cuerpos, ref(almacen), "P" + to_string(i));
        hs.emplace_back(f_ruedas, ref(almacen), "P" + to_string(i));
        hs.emplace_back(f_ensamblar, ref(almacen), "E" + to_string(i));
    }
    this_thread::sleep_for(2s);
    almacen.terminar();
    for (auto& h : hs) h.join();
    imprimir("Simulación terminada.");
}
