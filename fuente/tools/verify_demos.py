import math, itertools, random
from math import gcd, ceil, floor, sqrt, log

# 1) Liu-Layland n=2: U(F,f)=(F+f^2)/(F+f), min over f for each F
for F in (1, 2, 3, 5):
    fs = [i / 100000 for i in range(100000)]
    best = min(((F + f * f) / (F + f), f) for f in fs)
    fopt = sqrt(F * F + F) - F
    print('F', F, 'min U %.5f' % best[0], 'f* %.5f' % best[1], 'formula f* %.5f 2f* %.5f' % (fopt, 2 * fopt))
print('2(sqrt2-1)=%.5f' % (2 * (sqrt(2) - 1)))
for n in (1, 2, 3, 4, 5, 10, 100, 1000):
    print('n', n, 'bound %.5f' % (n * (2 ** (1 / n) - 1)))
print('ln2 %.5f' % log(2))

# worst-case check by brute force for n=2: scan integer periods and C1, max C2 schedulable by RM (RTA), min U
def rta_ok(ts):
    ts = sorted(ts, key=lambda x: x[1])
    for i, (c, t) in enumerate(ts):
        r = c
        while True:
            n = c + sum(ceil(r / tj) * cj for cj, tj in ts[:i])
            if n == r: break
            r = n
            if r > t: return False
        if r > t: return False
    return True
minU = 9
for T1 in range(5, 41):
    for T2 in range(T1 + 1, 2 * T1 + 1):
        for C1 in range(1, T1 + 1):
            # largest C2 schedulable
            C2 = 0
            while C2 + 1 <= T2 and rta_ok([(C1, T1), (C2 + 1, T2)]): C2 += 1
            if C2 >= 1:
                U = C1 / T1 + C2 / T2
                if U < minU: minU = U; arg = (T1, T2, C1, C2)
print('brute force min U of saturated 2-task sets: %.4f' % minU, arg)

# 2) harmonic periods: schedulable iff U<=1
random.seed(1)
ok = True
for _ in range(2000):
    base = random.randint(2, 6)
    n = random.randint(2, 5)
    ts = []; T = base
    for _ in range(n):
        ts.append(T); T *= random.choice([1, 2, 3])
    cs = [random.randint(1, t) for t in ts]
    U = sum(c / t for c, t in zip(cs, ts))
    s = rta_ok(list(zip(cs, ts)))
    if (U <= 1 + 1e-12) != s: ok = False
print('harmonic U<=1 <=> RM schedulable:', ok)

# 3) frame constraint: max wait from release to next frame start = Ts - gcd(Ts,Ti)
bad = 0
for Ts in range(1, 40):
    for Ti in range(Ts, 120):
        g = gcd(Ts, Ti)
        H = Ts * Ti // g
        w = 0
        for k in range(H // Ti):
            r = k * Ti
            o = r % Ts
            if o: w = max(w, Ts - o)
        want = Ts - g if Ts != g else 0
        if w != want: bad += 1
print('frame wait formula mismatches:', bad)

# 4) lost update: min final value over all interleavings of 2 threads, n increments each (load; store)
def minfinal(n):
    best = [10**9]
    seen = set()
    def go(pc1, pc2, x, r1, r2):
        key = (pc1, pc2, x, r1, r2)
        if key in seen: return
        seen.add(key)
        if pc1 == 2 * n and pc2 == 2 * n:
            best[0] = min(best[0], x); return
        if pc1 < 2 * n:
            if pc1 % 2 == 0: go(pc1 + 1, pc2, x, x, r2)
            else: go(pc1 + 1, pc2, r1 + 1, r1, r2)
        if pc2 < 2 * n:
            if pc2 % 2 == 0: go(pc1, pc2 + 1, x, r1, x)
            else: go(pc1, pc2 + 1, r2 + 1, r1, r2)
    go(0, 0, 0, 0, 0)
    return best[0]
print('min final:', {n: minfinal(n) for n in (1, 2, 3, 4, 5)})

# 5) vector growth: copies per push_back
def copies(n, f):
    cap, size, c = 1, 0, 0
    for _ in range(n):
        if size == cap:
            c += size; cap = max(cap + 1, int(cap * f))
        size += 1
    return c
for n in (10**3, 10**4, 10**5):
    print('n', n, 'x2: copies/n=%.3f' % (copies(n, 2) / n), 'x1.5: %.3f' % (copies(n, 1.5) / n))
def copies_add(n, k):
    cap, size, c = k, 0, 0
    for _ in range(n):
        if size == cap: c += size; cap += k
        size += 1
    return c
for n in (10**3, 10**4, 10**5): print('n', n, '+10: copies/n=%.1f' % (copies_add(n, 10) / n))

# 6) Patriot
e = 0.1 - floor(0.1 * 2**23) / 2**23
print('e = %.4e' % e, '0.1*2^-20 = %.4e' % (0.1 * 2**-20), '100 h:', '%.4f' % (e * 100 * 3600 * 10), 'm at 1676 m/s: %.0f' % (e * 3.6e6 * 1676))
print(bin(int(0.1 * 2**30))[2:].zfill(30))
