#include <algorithm>
#include <iostream>
#include <stdexcept>
#include <utility>
using namespace std;

class Matriz {
public:
    Matriz(int filas, int cols) : f_{filas}, c_{cols}, d_{new double[filas * cols]{}} {}
    Matriz(const Matriz& o) : f_{o.f_}, c_{o.c_}, d_{new double[o.f_ * o.c_]} { copy(o.d_, o.d_ + f_ * c_, d_); }
    Matriz(Matriz&& o) noexcept : f_{o.f_}, c_{o.c_}, d_{o.d_} { o.d_ = nullptr; o.f_ = o.c_ = 0; }
    Matriz& operator=(Matriz o) noexcept { swap(*this, o); return *this; }       // copy-and-swap
    ~Matriz() { delete[] d_; }
    friend void swap(Matriz& a, Matriz& b) noexcept { swap(a.f_, b.f_); swap(a.c_, b.c_); swap(a.d_, b.d_); }

    double& operator()(int i, int j) { return d_[i * c_ + j]; }
    double operator()(int i, int j) const { return d_[i * c_ + j]; }
    int filas() const { return f_; }
    int cols() const { return c_; }

    Matriz operator+(const Matriz& o) const {
        if (f_ != o.f_ || c_ != o.c_) throw invalid_argument{"dimensiones distintas"};
        Matriz r{f_, c_};
        for (int k = 0; k < f_ * c_; ++k) r.d_[k] = d_[k] + o.d_[k];
        return r;
    }
    Matriz operator*(const Matriz& o) const {
        if (c_ != o.f_) throw invalid_argument{"no se pueden multiplicar"};
        Matriz r{f_, o.c_};
        for (int i = 0; i < f_; ++i) for (int j = 0; j < o.c_; ++j) for (int k = 0; k < c_; ++k) r(i, j) += (*this)(i, k) * o(k, j);
        return r;
    }
    Matriz traspuesta() const {
        Matriz r{c_, f_};
        for (int i = 0; i < f_; ++i) for (int j = 0; j < c_; ++j) r(j, i) = (*this)(i, j);
        return r;
    }
    friend ostream& operator<<(ostream& os, const Matriz& m) {
        for (int i = 0; i < m.f_; ++i) { for (int j = 0; j < m.c_; ++j) os << m(i, j) << (j + 1 < m.c_ ? " " : ""); os << '\n'; }
        return os;
    }
private:
    int f_, c_;
    double* d_;
};

int main() {
    Matriz a{2, 3};
    int v = 1;
    for (int i = 0; i < 2; ++i) for (int j = 0; j < 3; ++j) a(i, j) = v++;
    Matriz b = a.traspuesta();                  // 3x2
    cout << "A:\n" << a << "A^T:\n" << b << "A*A^T:\n" << a * b;
    Matriz c = a;                               // copia profunda
    c(0, 0) = 99;
    cout << "A(0,0) tras modificar la copia: " << a(0, 0) << '\n';
    c = b.traspuesta() + a;                     // asignación (copy-and-swap)
    cout << "A+A:\n" << c;
    try { a * a; } catch (const exception& e) { cout << "error: " << e.what() << '\n'; }
}
