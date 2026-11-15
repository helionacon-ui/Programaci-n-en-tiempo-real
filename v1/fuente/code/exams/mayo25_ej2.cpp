#include <chrono>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <string>
#include <thread>
#include <vector>
using namespace std;

enum class Sentido { Ninguno, NS, SN };

// Monitor del puente: pasa UN tren cada vez; si el sentido contrario tiene MÁS de 3 esperando
// y una cola mayor que la nuestra, cedemos. (La regla literal "ceder si el otro tiene >3"
// interbloquea cuando AMBOS sentidos superan 3 a la vez; por eso se compara también el tamaño de las colas.)
class C_Puente {
    mutex m_;
    condition_variable cv_;
    int esperando_[2] = {0, 0};     // 0: norte->sur, 1: sur->norte
    bool ocupado_ = false;
    mutex consola_;

    void cruzar(int sentido, const string& id, int ms) {
        const char* nombre = sentido == 0 ? "NS" : "SN";
        const int otro = 1 - sentido;
        unique_lock<mutex> lk{m_};
        ++esperando_[sentido];
        { lock_guard<mutex> c{consola_}; cout << "Tren [" << nombre << id << "] para cruzar: º\n"; }
        // Espera mientras haya un tren cruzando O el sentido opuesto tenga prioridad
        auto otro_tiene_prioridad = [&] {
            if (esperando_[otro] <= 3) return false;
            if (esperando_[otro] != esperando_[sentido]) return esperando_[otro] > esperando_[sentido];
            return sentido == 1;                         // empate: gana siempre norte->sur
        };
        cv_.wait(lk, [&] { return !ocupado_ && !otro_tiene_prioridad(); });
        --esperando_[sentido];
        ocupado_ = true;
        { lock_guard<mutex> c{consola_}; cout << "Tren [" << nombre << id << "] cruzando: |\n"; }
        lk.unlock();                                    // cruzar NO debe hacerse con el mutex cogido
        this_thread::sleep_for(chrono::milliseconds(ms));
        lk.lock();
        ocupado_ = false;
        { lock_guard<mutex> c{consola_}; cout << "Tren [" << nombre << id << "] ha cruzado: x\n"; }
        cv_.notify_all();
    }
public:
    void norte_a_sur(const string& id, int ms) { cruzar(0, id, ms); }
    void sur_a_norte(const string& id, int ms) { cruzar(1, id, ms); }
};

int main() {
    C_Puente puente;
    vector<thread> trenes;
    for (int i = 1; i <= 10; ++i) {
        trenes.emplace_back([&puente, i] { puente.norte_a_sur(to_string(i), 10); });
        trenes.emplace_back([&puente, i] { puente.sur_a_norte(to_string(i), 10); });
    }
    for (auto& t : trenes) t.join();
}
