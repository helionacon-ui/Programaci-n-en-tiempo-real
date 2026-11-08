/* Lógica pura de los simuladores (se prueba con Node contra los scripts de Python). */
(function (root) {
  const P = {};
  P.gcd = (a, b) => (b ? P.gcd(b, a % b) : a);
  P.lcm = (a, b) => (a / P.gcd(a, b)) * b;
  P.hyper = (ts) => ts.reduce((a, t) => P.lcm(a, t.T), 1);
  P.llBound = (n) => n * (Math.pow(2, 1 / n) - 1);
  P.util = (ts) => ts.reduce((a, t) => a + t.C / t.T, 0);

  // Orden de prioridades: devuelve índices de mayor a menor prioridad
  P.order = (ts, policy) => {
    const idx = ts.map((_, i) => i);
    const key = policy === 'RM' ? (t) => [t.T, 0] : (t) => [t.D, t.T];
    return idx.sort((a, b) => { const ka = key(ts[a]), kb = key(ts[b]); return ka[0] - kb[0] || ka[1] - kb[1] || a - b; });
  };

  // Tiempo de respuesta con bloqueo B (prioridades fijas expulsivas)
  P.rta = (ts, policy) => {
    const ord = P.order(ts, policy), res = new Array(ts.length);
    ord.forEach((i, pos) => {
      const hp = ord.slice(0, pos), t = ts[i], B = t.B || 0;
      let r = t.C + B; const hist = [r];
      for (let k = 0; k < 200; k++) {
        const nr = t.C + B + hp.reduce((s, j) => s + Math.ceil(r / ts[j].T) * ts[j].C, 0);
        hist.push(nr);
        if (nr === r || nr > t.D) { r = nr; break; }
        r = nr;
      }
      res[i] = { R: r, ok: r <= t.D, hist };
    });
    return { order: ord, res };
  };

  // Simulación expulsiva a paso 1. policy RM | DM | EDF
  P.simulate = (ts, policy, horizon) => {
    const H = horizon || P.hyper(ts);
    const rem = ts.map(() => 0), rel = ts.map(() => 0), dl = ts.map(() => 0);
    const tl = [], misses = [], resp = ts.map(() => 0);
    const ord = policy === 'EDF' ? null : P.order(ts, policy);
    const rank = ord ? ord.reduce((o, i, p) => { o[i] = p; return o; }, {}) : null;
    for (let t = 0; t < H; t++) {
      ts.forEach((tk, i) => {
        if (t % tk.T === 0) {
          if (rem[i] > 0) misses.push([i, dl[i]]);
          rem[i] = tk.C; rel[i] = t; dl[i] = t + tk.D;
        }
      });
      let run = -1;
      ts.forEach((tk, i) => {
        if (rem[i] <= 0) return;
        if (run < 0) { run = i; return; }
        const better = ord ? rank[i] < rank[run] : (dl[i] < dl[run] || (dl[i] === dl[run] && i < run));
        if (better) run = i;
      });
      tl.push(run);
      if (run >= 0) { rem[run]--; if (rem[run] === 0) resp[run] = Math.max(resp[run], t + 1 - rel[run]); }
    }
    ts.forEach((tk, i) => { if (rem[i] > 0) misses.push([i, dl[i]]); });
    return { tl, misses, resp };
  };

  // Ejecutivo cíclico: tamaños de ciclo secundario válidos
  P.frames = (ts) => {
    const Tm = P.hyper(ts), maxC = Math.max(...ts.map((t) => t.C)), out = [];
    const divs = [];
    for (let d = 1; d * d <= Tm; d++) if (Tm % d === 0) { divs.push(d); if (d * d !== Tm) divs.push(Tm / d); }
    divs.sort((a, b) => a - b);
    for (const Ts of divs) {
      if (Ts < maxC) continue;
      const checks = ts.map((t) => ({ T: t.T, v: 2 * Ts - P.gcd(Ts, t.T), D: t.D, ok: 2 * Ts - P.gcd(Ts, t.T) <= t.D }));
      out.push({ Ts, ok: checks.every((c) => c.ok), checks });
    }
    return { Tm, maxC, frames: out };
  };

  // std::vector: crecimiento por push_back
  P.vecGrow = (n, factor, reserve) => {
    let cap = reserve || 0, size = 0, copies = 0, reallocs = 0; const steps = [];
    for (let i = 1; i <= n; i++) {
      let moved = false;
      if (size === cap) {
        const ncap = cap === 0 ? 1 : Math.max(cap + 1, Math.floor(cap * factor));
        copies += size; reallocs++; cap = ncap; moved = true;
      }
      size++; steps.push({ size, cap, moved });
    }
    return { steps, copies, reallocs };
  };

  // Aritmética: error de truncar 0,1 a 23 bits y deriva del reloj (error de misil Patriot)
  P.patriot = (hours) => {
    const trunc = Math.floor(0.1 * Math.pow(2, 23)) / Math.pow(2, 23);
    const e = 0.1 - trunc, ticks = hours * 3600 * 10, drift = ticks * e;
    return { trunc, e, ticks, drift, dist: drift * 1676 };
  };
  P.bits = (x, n) => { let s = '', f = x; for (let i = 0; i < n; i++) { f *= 2; if (f >= 1) { s += '1'; f -= 1; } else s += '0'; } return s; };

  // Intercalado x += 2 con 2 hilos; mutex opcional. Devuelve resultado final de una ejecución aleatoria
  P.raceRandom = (useMutex, rnd) => {
    const th = [0, 1].map(() => ({ pc: 0, R: 0 })); let x = 0, owner = -1;
    const prog = useMutex ? ['LOCK', 'LOAD', 'ADD', 'STORE', 'UNLOCK'] : ['LOAD', 'ADD', 'STORE'];
    while (th.some((t) => t.pc < prog.length)) {
      const cand = [0, 1].filter((i) => th[i].pc < prog.length && !(prog[th[i].pc] === 'LOCK' && owner >= 0));
      const i = cand[Math.floor(rnd() * cand.length)], ins = prog[th[i].pc];
      if (ins === 'LOCK') owner = i; else if (ins === 'UNLOCK') owner = -1;
      else if (ins === 'LOAD') th[i].R = x; else if (ins === 'ADD') th[i].R += 2; else if (ins === 'STORE') x = th[i].R;
      th[i].pc++;
    }
    return x;
  };

  // Laboratorio: histograma de palabras (práctica 1)
  P.words = (txt) => {
    const w = txt.toLowerCase().split(/[^a-záéíóúüñ]+/i).filter(Boolean), m = {};
    w.forEach((x) => { m[x] = (m[x] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  };
  // Filósofos: cada filósofo i necesita los k cubiertos i, i+1,...,i+k-1 (mod n+1)
  P.philosophers = (n, mode, rounds, rnd) => {
    const forks = n + 1, k = 3, held = new Array(forks).fill(-1), log = [];
    const need = (i) => [...Array(k).keys()].map((j) => (i + j) % forks);
    const st = [...Array(n)].map(() => ({ got: 0, eaten: 0 }));
    let stuck = 0;
    for (let step = 0; step < 4000 && st.some((s) => s.eaten < rounds); step++) {
      const i = Math.floor(rnd() * n), s = st[i]; if (s.eaten >= rounds) continue;
      const f = need(i);
      if (mode === 'lock') {               // std::lock: todo o nada
        if (f.every((c) => held[c] < 0)) { f.forEach((c) => (held[c] = i)); log.push(i + ' come'); f.forEach((c) => (held[c] = -1)); s.eaten++; stuck = 0; }
      } else {                              // lock() individuales en orden, con interrupciones entre medias
        if (s.got < k) { const c = f[s.got]; if (held[c] < 0) { held[c] = i; s.got++; stuck = 0; } }
        else { log.push(i + ' come'); f.forEach((c) => (held[c] = -1)); s.got = 0; s.eaten++; stuck = 0; }
      }
      stuck++;
      if (stuck > 400) return { deadlock: true, eaten: st.map((s) => s.eaten), held: held.slice(), log };
    }
    return { deadlock: false, eaten: st.map((s) => s.eaten), held: held.slice(), log };
  };
  // Reparto de filas por hilo (suma de matrices): fila inicial = id, incremento = n hilos
  P.rows = (tam, nh) => [...Array(nh).keys()].map((id) => { const r = []; for (let f = id; f < tam; f += nh) r.push(f); return r; });


  // Inversión de prioridad: tres tareas (L baja, M media, H alta) y un mutex. proto: none | pip | icpp
  P.INV = [
    { n: 'L', prio: 1, rel: 0, steps: [['run', 1], ['lock'], ['run', 3], ['unlock'], ['run', 1]] },
    { n: 'M', prio: 2, rel: 2, steps: [['run', 4]] },
    { n: 'H', prio: 3, rel: 3, steps: [['run', 1], ['lock'], ['run', 2], ['unlock'], ['run', 1]] }];
  P.inversion = (proto, jobsIn) => {
    const J = (jobsIn || P.INV).map((j) => ({ n: j.n, prio: j.prio, rel: j.rel, st: j.steps.map((x) => x.slice()), k: 0, fin: -1 }));
    const ceil = Math.max(...J.map((j) => j.prio)); let owner = -1; const tl = [], act = [];
    const active = (i) => {
      const j = J[i]; let a = j.prio;
      if (owner === i) {
        if (proto === 'icpp') a = Math.max(a, ceil);
        if (proto === 'pip') J.forEach((b, bi) => { if (bi !== i && b.fin < 0 && b.rel <= tl.length && b.st[b.k] && b.st[b.k][0] === 'lock') a = Math.max(a, b.prio); });
      }
      return a;
    };
    const zero = (i) => {
      const j = J[i];
      while (j.k < j.st.length && j.st[j.k][0] !== 'run') {
        if (j.st[j.k][0] === 'lock') { if (owner < 0) owner = i; else if (owner !== i) return; }
        else if (owner === i) owner = -1;
        j.k++;
      }
    };
    for (let t = 0; t < 60 && J.some((j) => j.fin < 0); t++) {
      const rel = J.map((j, i) => i).filter((i) => J[i].rel <= t && J[i].fin < 0);
      rel.sort((a, b) => active(b) - active(a)); rel.forEach(zero);
      J.forEach((j, i) => { if (j.fin < 0 && j.rel <= t && j.k >= j.st.length) j.fin = t; });
      const ready = rel.filter((i) => J[i].fin < 0 && J[i].st[J[i].k][0] === 'run').sort((a, b) => active(b) - active(a));
      const run = ready.length ? ready[0] : -1;
      tl.push(run); act.push(run >= 0 ? active(run) : 0);
      if (run >= 0) { const j = J[run]; j.st[j.k][1]--; if (j.st[j.k][1] === 0) { j.k++; zero(run); if (j.k >= j.st.length) j.fin = t + 1; } }
    }
    return { tl, act, fin: J.map((j) => j.fin), names: J.map((j) => j.n), owner };
  };

  // Práctica 3.4: un generador y n lectores; nadie se adelanta (cada lector lee cada valor una vez)
  P.almacen = (nLect, nVal, seed) => {
    const r = P.mulberry(seed), trace = [], reads = Array.from({ length: nLect }, () => []);
    let valor = -1, escritos = 0; const leido = new Array(nLect).fill(true);
    for (;;) {
      const op = [];
      if (escritos < nVal && leido.every(Boolean)) op.push(-1);
      for (let i = 0; i < nLect; i++) if (valor >= 0 && !leido[i]) op.push(i);
      if (!op.length) break;
      const a = op[Math.floor(r() * op.length)];
      if (a < 0) { valor = escritos++; leido.fill(false); trace.push({ who: 'G', v: valor, text: 'Generador escribe ' + valor }); }
      else { leido[a] = true; reads[a].push(valor); trace.push({ who: a, v: valor, text: 'Lector ' + a + ' lee ' + valor }); }
    }
    return { trace, reads, ok: reads.every((l) => l.length === nVal && l.every((v, k) => v === k)) };
  };
  P.mulberry = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  root.PSTR = P;
})(typeof window !== 'undefined' ? window : module.exports);
