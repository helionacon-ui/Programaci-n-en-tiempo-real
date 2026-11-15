"""Simulador de planificación expulsiva a tiempo discreto (paso = 1 unidad). Mayor prioridad = menor número de 'prio'."""
from math import gcd
from functools import reduce

def simulate(tasks, policy='RM', horizon=None):
    """tasks: lista de dict(name,C,T,D). policy: RM | DM | EDF. Devuelve (timeline, misses, resp)."""
    names = [t['name'] for t in tasks]
    H = reduce(lambda a, b: a * b // gcd(a, b), [t['T'] for t in tasks])
    horizon = horizon or H
    if policy == 'RM': key = lambda t: (t['T'],)
    elif policy == 'DM': key = lambda t: (t['D'], t['T'])
    else: key = None
    rem, rel, dl, timeline, misses, resp = {}, {}, {}, [], [], {n: 0 for n in names}
    for t in range(horizon):
        for tk in tasks:
            if t % tk['T'] == 0:
                nm = tk['name']
                if rem.get(nm, 0) > 0 and nm not in [m[0] for m in misses if m[1] == dl[nm]]:
                    misses.append((nm, dl[nm]))
                rem[nm] = tk['C']; rel[nm] = t; dl[nm] = t + tk['D']
        ready = [tk for tk in tasks if rem.get(tk['name'], 0) > 0]
        if not ready: timeline.append(None); continue
        if key: run = min(ready, key=lambda tk: (key(tk), tk['name']))
        else: run = min(ready, key=lambda tk: (dl[tk['name']], tk['name']))
        nm = run['name']; rem[nm] -= 1; timeline.append(nm)
        if rem[nm] == 0: resp[nm] = max(resp[nm], t + 1 - rel[nm])
    for tk in tasks:
        if rem.get(tk['name'], 0) > 0: misses.append((tk['name'], dl[tk['name']]))
    return timeline, misses, resp

if __name__ == '__main__':
    ts = [dict(name='t1', C=3, T=7, D=7), dict(name='t2', C=3, T=12, D=12), dict(name='t3', C=5, T=20, D=20)]
    tl, m, r = simulate(ts, 'RM', 420)
    print(m, r)
    print(''.join((x or '.')[-1] for x in tl[:60]))
