"""Análisis de planificabilidad: DM/RM, techo de prioridad inmediato, tiempo de respuesta."""
from math import ceil, gcd
from functools import reduce

def assign_dm(tasks):
    """tasks: dict name -> dict(T,C,D,cs={res:dur}). Devuelve prioridades (mayor número = mayor prioridad)."""
    order = sorted(tasks, key=lambda n: (tasks[n]['D'], tasks[n]['T']), reverse=True)
    return {n: i+1 for i, n in enumerate(order)}

def ceilings(tasks, prio):
    res = {}
    for n, t in tasks.items():
        for r in t.get('cs', {}):
            res[r] = max(res.get(r, 0), prio[n])
    return res

def blocking_icpp(tasks, prio):
    ceil_ = ceilings(tasks, prio)
    B = {}
    for n in tasks:
        b = 0
        for m, tm in tasks.items():
            if prio[m] < prio[n]:
                for r, d in tm.get('cs', {}).items():
                    if ceil_[r] >= prio[n]:
                        b = max(b, d)
        B[n] = b
    return B

def response_times(tasks, prio, B):
    R = {}
    for n in sorted(tasks, key=lambda x: -prio[x]):
        t = tasks[n]
        hp = [m for m in tasks if prio[m] > prio[n]]
        r = t['C'] + B[n]
        hist = [r]
        while True:
            nr = t['C'] + B[n] + sum(ceil(r / tasks[j]['T']) * tasks[j]['C'] for j in hp)
            hist.append(nr)
            if nr == r or nr > t['D']:
                r = nr
                break
            r = nr
        R[n] = (r, hist)
    return R

def utilization(tasks):
    return sum(t['C'] / t['T'] for t in tasks.values())

def ll_bound(n):
    return n * (2 ** (1 / n) - 1)

def lcm(a, b): return a * b // gcd(a, b)
def hyper(tasks): return reduce(lcm, [t['T'] for t in tasks.values()])

def report(title, tasks, prio=None):
    prio = prio or assign_dm(tasks)
    B = blocking_icpp(tasks, prio)
    R = response_times(tasks, prio, B)
    print('==', title)
    print('prioridades', prio, 'techos', ceilings(tasks, prio))
    print('B', B)
    for n in sorted(tasks, key=lambda x: -prio[x]):
        r, h = R[n]
        print(f"  {n}: R={r} (D={tasks[n]['D']}) {'OK' if r <= tasks[n]['D'] else 'FALLA'}  iter={h}")
    print('U=%.4f' % utilization(tasks))
    return prio, B, R

if __name__ == '__main__':
    report('feb2017', {
        'A': dict(T=60, C=4, D=20, cs={'N': 2}),
        'B': dict(T=10, C=4, D=10, cs={'M': 2}),
        'C': dict(T=50, C=8, D=50, cs={'M': 1, 'N': 2})})
    report('jun2016', {
        'A': dict(T=100, C=4, D=15, cs={'M': 1}),
        'B': dict(T=10, C=4, D=10, cs={'M': 2, 'N': 1}),
        'C': dict(T=50, C=8, D=50, cs={'N': 2}),
        'D': dict(T=40, C=6, D=25)})
    report('sep2016', {
        'TC': dict(T=120, C=12, D=120, cs={'O1': 2, 'O2': 3}),
        'TB': dict(T=500, C=8, D=25, cs={'O1': 3, 'O2': 1}),
        'TA': dict(T=20, C=10, D=20, cs={'O1': 4})})
