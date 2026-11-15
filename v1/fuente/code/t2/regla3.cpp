#include <algorithm>
#include <iostream>
using namespace std;

// Clase que posee memoria dinámica: necesita copia profunda (regla de los 3)
class Buffer {
public:
    explicit Buffer(size_t n) : n_{n}, d_{new int[n]{}} { cout << "ctor(" << n_ << ")\n"; }
    Buffer(const Buffer& o) : n_{o.n_}, d_{new int[o.n_]} { copy(o.d_, o.d_ + n_, d_); cout << "copia\n"; }
    Buffer& operator=(const Buffer& o) {
        if (this != &o) { Buffer tmp{o}; swap(n_, tmp.n_); swap(d_, tmp.d_); }   // copy-and-swap
        cout << "asignacion\n"; return *this;
    }
    ~Buffer() { delete[] d_; cout << "dtor(" << n_ << ")\n"; }
    int& operator[](size_t i) { return d_[i]; }
private:
    size_t n_;
    int* d_;
};

int main() {
    Buffer a{3};
    a[0] = 7;
    Buffer b = a;      // copia
    b[0] = 9;
    cout << a[0] << ' ' << b[0] << '\n';   // 7 9: cada uno tiene su memoria
    Buffer c{1};
    c = a;             // asignación
}
