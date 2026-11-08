#include <iostream>
using namespace std;

void por_valor([[maybe_unused]] int x) { x = 99; }  // modifica una copia
void por_referencia(int& x) { x = 99; }       // modifica el original
void por_puntero(int* p)   { *p = 99; }       // modifica lo apuntado

int main() {
    int a = 1, b = 1, c = 1;
    por_valor(a); por_referencia(b); por_puntero(&c);
    cout << "a=" << a << " b=" << b << " c=" << c << '\n';

    int* d = new int{7};          // memoria dinámica (heap)
    cout << "d apunta a " << *d << '\n';
    delete d;                      // hay que liberarla
    d = nullptr;

    int arr[3] = {10, 20, 30};
    int* p = arr;                  // un array decae a puntero a su primer elemento
    cout << *(p + 2) << ' ' << arr[2] << '\n';
    const int k = 5;               // no se puede modificar
    cout << "k=" << k << '\n';
}
