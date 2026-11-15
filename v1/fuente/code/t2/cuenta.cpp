#include <iostream>
#include <string>
using namespace std;

class C_Cuenta {
public:
    C_Cuenta(string titular, int numero) : titular_{std::move(titular)}, numero_{numero} {}
    C_Cuenta() : C_Cuenta("sin titular", 0) {}                 // constructor delegado
    int numero() const { return numero_; }
    double saldo() const { return saldo_; }
    bool ingresar(double c) {
        if (c <= 0) return false;
        saldo_ += c; return true;
    }
    bool reintegrar(double c) {
        if (c <= 0 || saldo_ - c < 0) return false;
        saldo_ -= c; return true;
    }
    bool transferencia(double c, C_Cuenta& destino) {
        if (!reintegrar(c)) return false;
        destino.ingresar(c); return true;
    }
    friend ostream& operator<<(ostream& os, const C_Cuenta& c) {
        return os << c.titular_ << " (ccc " << c.numero_ << "): " << c.saldo_ << " euros";
    }
private:
    string titular_;
    int numero_;
    double saldo_ = 0;           // inicializador en la clase
};

int main() {
    C_Cuenta a{"Mario", 12345678}, b{"Lucia", 87654321};
    a.ingresar(150.5);
    cout << a << '\n' << b << '\n';
    cout << "transferencia 50: " << boolalpha << a.transferencia(50, b) << '\n';
    cout << "transferencia 500: " << a.transferencia(500, b) << '\n';
    cout << a << '\n' << b << '\n';
}
