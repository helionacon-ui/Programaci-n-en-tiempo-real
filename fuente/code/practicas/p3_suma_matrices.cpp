// Prácticas 3.1 y 3.3: suma de matrices por filas con n hilos y con thread pool
#include <chrono>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>
using namespace std;
using Matriz = vector<vector<int>>;

Matriz crear(int tam) {                                   // valores 0..tam-1 en cada fila
    Matriz m(tam, vector<int>(tam));
    for (auto& fila : m) for (int j = 0; j < tam; ++j) fila[j] = j;
    return m;
}
ostream& operator<<(ostream& os, const Matriz& m) {
    for (const auto& f : m) { for (int x : f) os << x << ' '; os << '\n'; }
    return os;
}
// 3.1: cada hilo suma las filas inicio, inicio+salto, inicio+2*salto... No comparten escritura: no hace falta mutex.
void suma_filas(const Matriz& a, const Matriz& b, Matriz& c, size_t inicio, size_t salto) {
    for (size_t i = inicio; i < a.size(); i += salto)
        for (size_t j = 0; j < a[i].size(); ++j) c[i][j] = a[i][j] + b[i][j];
}
Matriz suma_paralelo(const Matriz& a, const Matriz& b, int n_hilos) {
    Matriz c(a.size(), vector<int>(a.size()));
    vector<thread> hilos;
    for (int id = 0; id < n_hilos; ++id) hilos.emplace_back(suma_filas, cref(a), cref(b), ref(c), id, n_hilos);
    for (auto& h : hilos) h.join();
    return c;
}
// 3.3: el «director» reparte la siguiente fila a quien la pida. Su contador sí es compartido: mutex.
class Director {
public:
    explicit Director(size_t n_filas) : n_{n_filas} {}
    bool siguiente(size_t& fila) { lock_guard<mutex> lk{m_}; if (sig_ >= n_) return false; fila = sig_++; return true; }
private:
    mutex m_; size_t sig_ = 0, n_;
};
Matriz suma_pool(const Matriz& a, const Matriz& b, int n_hilos) {
    Matriz c(a.size(), vector<int>(a.size()));
    Director dir{a.size()};
    auto trabajador = [&] {
        size_t f;
        while (dir.siguiente(f))
            for (size_t j = 0; j < a[f].size(); ++j) c[f][j] = a[f][j] + b[f][j];
    };
    vector<thread> hilos;
    for (int i = 0; i < n_hilos; ++i) hilos.emplace_back(trabajador);
    for (auto& h : hilos) h.join();
    return c;
}

int main() {
    Matriz a = crear(4), b = crear(4);
    cout << "a + b con 3 hilos:\n" << suma_paralelo(a, b, 3);
    cout << "mismo resultado con thread pool: " << boolalpha << (suma_pool(a, b, 3) == suma_paralelo(a, b, 3)) << '\n';

    const int N = 1500;
    Matriz A = crear(N), B = crear(N);
    for (int nh : {1, 2, 4}) {
        auto t0 = chrono::steady_clock::now();
        Matriz C = suma_paralelo(A, B, nh);
        auto t1 = chrono::steady_clock::now();
        cout << nh << " hilos: " << chrono::duration_cast<chrono::microseconds>(t1 - t0).count() << " us (C[7][7]=" << C[7][7] << ")\n";
    }
}
