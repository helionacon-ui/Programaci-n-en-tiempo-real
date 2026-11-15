#include <algorithm>
#include <iostream>
#include <memory>
#include <string>
#include <typeinfo>
#include <vector>
using namespace std;

class Item {
public:
    Item(string titulo, int anio) : titulo_{move(titulo)}, anio_{anio} {}
    virtual ~Item() = default;                          // destructor virtual: se borra a través de la base
    virtual double multa_por_dia() const = 0;           // virtual puro: Item es abstracta
    virtual int dias_prestamo() const = 0;
    const string& titulo() const { return titulo_; }
    friend ostream& operator<<(ostream& os, const Item& i) { i.imprimir(os); return os; }
protected:
    virtual void imprimir(ostream& os) const {          // gancho reutilizable por las hijas
        os << '"' << titulo_ << "\" (" << anio_ << "), " << dias_prestamo() << " dias";
    }
private:
    string titulo_;
    int anio_;
};

class Libro : public Item {
public:
    Libro(string t, int a, int paginas) : Item{move(t), a}, paginas_{paginas} {}
    double multa_por_dia() const override { return 0.5; }
    int dias_prestamo() const override { return 14; }
protected:
    void imprimir(ostream& os) const override { Item::imprimir(os); os << ", " << paginas_ << " pags"; }
private:
    int paginas_;
};

class Dvd : public Item {
public:
    Dvd(string t, int a, int minutos) : Item{move(t), a}, minutos_{minutos} {}
    double multa_por_dia() const override { return 1.0; }
    int dias_prestamo() const override { return 7; }
protected:
    void imprimir(ostream& os) const override { Item::imprimir(os); os << ", " << minutos_ << " min"; }
private:
    int minutos_;
};

class Biblioteca {
public:
    void anadir(unique_ptr<Item> i) { items_.push_back(move(i)); }
    double multa(const string& titulo, int dias_tarde) const {
        auto it = find_if(items_.begin(), items_.end(), [&](const auto& p) { return p->titulo() == titulo; });
        if (it == items_.end() || dias_tarde <= 0) return 0;
        return (*it)->multa_por_dia() * dias_tarde;
    }
    const Item* mayor_multa() const {
        auto it = max_element(items_.begin(), items_.end(),
                              [](const auto& a, const auto& b) { return a->multa_por_dia() < b->multa_por_dia(); });
        return it == items_.end() ? nullptr : it->get();
    }
    int contar(const type_info& t) const {
        return count_if(items_.begin(), items_.end(), [&](const auto& p) { return typeid(*p) == t; });
    }
    bool eliminar(const string& titulo) {
        auto it = remove_if(items_.begin(), items_.end(), [&](const auto& p) { return p->titulo() == titulo; });
        bool borrado = it != items_.end();
        items_.erase(it, items_.end());                 // unique_ptr libera la memoria solo
        return borrado;
    }
    friend ostream& operator<<(ostream& os, const Biblioteca& b) {
        for (const auto& p : b.items_) os << "  - " << *p << '\n';
        return os;
    }
private:
    vector<unique_ptr<Item>> items_;
};

int main() {
    Biblioteca b;
    b.anadir(make_unique<Libro>("Quijote", 1605, 1100));
    b.anadir(make_unique<Dvd>("Matrix", 1999, 136));
    b.anadir(make_unique<Libro>("Ulises", 1922, 730));
    cout << b;
    cout << "multa Quijote 4 dias: " << b.multa("Quijote", 4) << " EUR\n";
    cout << "multa Matrix 3 dias: " << b.multa("Matrix", 3) << " EUR\n";
    cout << "mayor multa/dia: " << *b.mayor_multa() << '\n';
    cout << "libros: " << b.contar(typeid(Libro)) << ", dvd: " << b.contar(typeid(Dvd)) << '\n';
    cout << boolalpha << "eliminar Ulises: " << b.eliminar("Ulises") << ", eliminar X: " << b.eliminar("X") << '\n';
    cout << b;
}
