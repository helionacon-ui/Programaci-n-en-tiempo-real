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

  // ---------- modo examen: nota estimada ----------
  // Rúbrica orientativa (la real la marca cada convocatoria): POO 70 %, concurrencia 30 %.
  P.RUBRICA = {
    poo: { peso: 70, items: [['Clases, atributos y constructores (incluido el delegado o el de valores por defecto)', 15], ['Métodos con const y tipos de retorno correctos', 15], ['operator<< (friend) y reutilización del código de la base', 10], ['Herencia, virtual y abstracta, o contenedores STL bien usados', 15], ['Funciones auxiliares pedidas', 10], ['main que prueba exactamente lo que pide el enunciado', 5]] },
    conc: { peso: 30, items: [['Monitor: un mutex y TODOS los accesos al estado protegidos', 10], ['Esperas bien hechas (predicado, sleep_until/sleep_for, sin espera activa)', 6], ['Hilos: creación, ref(), join y cierre limpio', 6], ['Consola protegida con su propio mutex', 4], ['Sin carreras ni interbloqueos', 4]] }
  };
  P.examGrade = (marks, compila) => {
    // marks = { poo: [bool...], conc: [bool...] }; compila = { poo: bool, conc: bool }
    const res = {}; let total = 0;
    for (const k of ['poo', 'conc']) {
      const r = P.RUBRICA[k]; let pts = 0;
      r.items.forEach((it, i) => { if (marks[k] && marks[k][i]) pts += it[1]; });
      const ok = !compila || compila[k] !== false;
      const fin = ok ? pts : pts / 2;
      res[k] = { bruto: pts, final: fin, max: r.peso, compila: ok };
      total += fin;
    }
    res.total = total; res.sobre10 = Math.round(total) / 10;
    return res;
  };
  P.examTimer = (startMs, nowMs, totalMs) => {
    const rest = Math.max(0, startMs + totalMs - nowMs);
    return { rest, over: rest === 0, text: [Math.floor(rest / 3600000), Math.floor(rest / 60000) % 60, Math.floor(rest / 1000) % 60].map((x) => String(x).padStart(2, '0')).join(':') };
  };

  // ---------- revisor de código: heurísticas sobre errores típicos ----------
  // Devuelve [{line, level: 'error'|'warn'|'info', id, msg}]. No sustituye al compilador.
  P.review = (code) => {
    const out = [], L = code.split('\n');
    const add = (i, level, id, msg) => out.push({ line: i + 1, level, id, msg });
    const noStr = (l) => l.replace(/"(?:\\.|[^"\\])*"/g, '""').replace(/\/\/.*$/, '');
    const clean = L.map(noStr);
    const all = clean.join('\n');
    // bloques de clase con llaves
    const classes = [];
    const re = /\b(class|struct)\s+(\w+)(?:\s*:\s*(?:public|private|protected)?\s*(\w+))?[^;{]*\{/g; let m;
    while ((m = re.exec(all))) {
      let d = 1, j = re.lastIndex; while (j < all.length && d) { if (all[j] === '{') d++; else if (all[j] === '}') d--; j++; }
      const body = all.slice(re.lastIndex, j - 1);
      const startLine = all.slice(0, m.index).split('\n').length - 1;
      const endLine = all.slice(0, j - 1).split('\n').length - 1;
      let k = j; while (k < all.length && /\s/.test(all[k])) k++;
      classes.push({ kind: m[1], name: m[2], base: m[3] || null, body, startLine, endLine, semi: all[k] === ';' || /^\w+\s*[;,=]/.test(all.slice(k, k + 40)) });
    }
    // 1. falta ; tras la clase
    classes.forEach((c) => { if (!c.semi) add(c.endLine, 'error', 'punto-coma-clase', `Falta «;» después de la llave de cierre de «${c.name}». Es error de compilación (en el examen reciente, un código que no compila divide la nota por 2).`); });
    // 2. virtuales y override
    const virt = new Set(); const rv = /\bvirtual\s+[\w:<>,\s*&]+?\b(\w+)\s*\(/g; while ((m = rv.exec(all))) virt.add(m[1]);
    classes.filter((c) => c.base).forEach((c) => {
      clean.slice(c.startLine, c.endLine + 1).forEach((l, i) => {
        const mm = l.match(/(?:^|[\s*&>])(\w+)\s*\([^)]*\)\s*(const)?\s*(noexcept)?\s*(\{|;|$)/);
        if (!mm || !virt.has(mm[1]) || /\b(override|final)\b/.test(l) || /\bvirtual\b/.test(l) || /\b(return|new|delete|else|if|for|while)\b/.test(l.split(mm[1])[0])) return;
        if (/^\s*(\w+)\s*\(/.test(l) && mm[1] === c.name) return;
        add(c.startLine + i, 'warn', 'falta-override', `«${mm[1]}» es virtual en la base: en «${c.name}» escribe «override». Si te equivocas en la firma (p. ej. olvidas const), con override el compilador te avisa; sin él creas un método nuevo y no hay polimorfismo.`);
      });
    });
    // 3. destructor no virtual en base polimórfica
    classes.filter((c) => !c.base && /\bvirtual\b/.test(c.body)).forEach((c) => {
      if (!/virtual\s*~/.test(c.body)) add(c.startLine, 'warn', 'destructor-no-virtual', `«${c.name}» tiene métodos virtuales pero su destructor no es virtual: borrar una derivada a través de un puntero a «${c.name}» es comportamiento indefinido. Añade «virtual ~${c.name}() = default;».`);
    });
    // 4. operator<< dentro de la clase sin friend
    classes.forEach((c) => clean.slice(c.startLine, c.endLine + 1).forEach((l, i) => {
      if (/operator\s*<<\s*\(/.test(l) && !/\bfriend\b/.test(l)) add(c.startLine + i, 'error', 'operator-miembro', 'operator<< dentro de la clase sin «friend» sería un método con el objeto a la izquierda (obj << cout): no compila con cout << obj. Decláralo «friend» o sácalo fuera de la clase.');
    }));
    // 5. consultas sin const
    classes.forEach((c) => clean.slice(c.startLine, c.endLine + 1).forEach((l, i) => {
      const mm = l.match(/(?:^|[\s>*&])(?!return\b)[\w:<>,*&]+\s+(get_\w+|tam_\w+|num_\w+|n_\w+|size|sueldo|total_\w+|es_\w+|horas_\w+)\s*\(\s*\)\s*(\{|;)/);
      if (mm && !/\bconst\b/.test(l.slice(0, l.indexOf(mm[0]) + mm[0].length)) && !/=\s*0\s*;/.test(l) && !/\bvirtual\b/.test(l.split(mm[1])[0] + '') ) add(c.startLine + i, 'warn', 'falta-const', `«${mm[1]}()» parece una consulta: márcala «const» para poder llamarla sobre objetos constantes y desde otras funciones const.`);
    }));
    // 6. wait sin predicado / if en vez de while
    clean.forEach((l, i) => {
      if (/\.wait\(\s*\w+\s*\)/.test(l)) add(i, 'warn', 'wait-sin-predicado', 'wait(lk) sin predicado: un despertar espurio (o un notify que llegó antes) te deja continuar sin que se cumpla la condición. Usa «cv.wait(lk, [&]{ return condicion; });» o un while.');
      if (/\bif\s*\(.*\)\s*\{?\s*(\w+\.)?wait\s*\(/.test(l) || (/\bif\s*\(/.test(l) && /\.wait\s*\(\s*\w+\s*\)/.test(clean[i + 1] || '') ) || (/\bif\s*\([^{]*\)\s*$/.test(l) && /\.wait\(/.test(clean[i + 1] || ''))) add(i, 'warn', 'if-wait', 'La condición de espera se comprueba con «if»: tras despertar hay que volver a comprobarla. Cámbialo por «while» (o usa el wait con predicado).');
    });
    // 7. wait con lock_guard (se mira la declaración más cercana por encima de cada wait)
    const decl = {};
    clean.forEach((l, i) => {
      const d = l.match(/\b(lock_guard|unique_lock|scoped_lock)\s*(?:<[^>]*>)?\s*(\w+)\s*[{(]/); if (d) decl[d[2]] = d[1];
      const mm = l.match(/\.wait(?:_for|_until)?\(\s*(\w+)/);
      if (mm && decl[mm[1]] && decl[mm[1]] !== 'unique_lock') add(i, 'error', 'wait-lock_guard', `La variable condicional necesita «unique_lock», no «${decl[mm[1]]}» (wait debe poder desbloquear y volver a bloquear). Cambia «${mm[1]}».`);
    });
    // 8. lock()/unlock() manual
    clean.forEach((l, i) => { const mm = l.match(/\b(\w+)\.lock\(\)/); if (mm && !/^(lk|lock|ul|lg|guard)\w*$/.test(mm[1]) && !/unique_lock|scoped|lg|lk/.test(mm[1])) add(i, 'info', 'lock-manual', `«${mm[1]}.lock()» manual: si hay un return o una excepción antes del unlock(), el mutex se queda bloqueado para siempre. Usa lock_guard o scoped_lock (RAII).`); });
    // 9. thread con referencias sin ref()
    const refFns = new Set(); const rf = /\b(\w+)\s*\(([^)]*&[^)]*)\)\s*\{/g; while ((m = rf.exec(all))) if (!/\b(if|for|while|switch)\b/.test(m[1])) refFns.add(m[1]);
    clean.forEach((l, i) => {
      const mm = l.match(/\bthread\s*(?:\w+\s*)?[({]\s*(\w+)\s*,([^;]*)/) || l.match(/emplace_back\(\s*(\w+)\s*,([^;]*)/);
      if (mm && refFns.has(mm[1]) && !/\bref\(/.test(mm[2]) && /\w/.test(mm[2])) add(i, 'error', 'falta-ref', `«${mm[1]}» recibe parámetros por referencia: al crear el hilo hay que pasarlos con «ref(obj)». Sin ref() se copian y no compila (el mutex no es copiable) o trabajas sobre una copia.`);
    });
    // 10. hilos sin join
    if (/\bthread\b/.test(all) && !/\bjthread\b/.test(all) && !/\.join\(\)|\.detach\(\)/.test(all)) { const i = clean.findIndex((l) => /\bthread\b/.test(l) && !/#include/.test(l)); add(Math.max(i, 0), 'error', 'sin-join', 'Hay hilos pero ningún join()/detach(): si un thread se destruye sin join, el programa termina con std::terminate. Haz join de todos antes de salir de main.'); }
    // 11. cout compartido sin mutex
    if (/\bthread\b/.test(all) && /\bcout\b/.test(all) && !/(lock_guard|scoped_lock|unique_lock)/.test(all)) { const i = clean.findIndex((l) => /\bcout\b/.test(l)); add(i, 'warn', 'cout-sin-mutex', 'Varios hilos escriben en cout sin ningún mutex: las líneas se mezclan. La consola es un recurso compartido: protégela con su propio mutex.'); }
    // 12. new sin delete
    if (/\bnew\s+\w+/.test(all) && !/\bdelete\b/.test(all) && !/(unique_ptr|shared_ptr|make_unique|make_shared)/.test(all)) { const i = clean.findIndex((l) => /\bnew\s+\w+/.test(l)); add(i, 'warn', 'new-sin-delete', 'Reservas con «new» pero no hay «delete» (ni punteros inteligentes): fuga de memoria. Si guardas punteros en un vector, libéralos en el destructor.'); }
    // 13. includes que faltan
    const need = [['mutex', /\b(mutex|lock_guard|unique_lock|scoped_lock)\b/], ['thread', /\b(thread|this_thread)\b/], ['condition_variable', /\bcondition_variable\b/], ['vector', /\bvector\s*</], ['map', /\bmap\s*</], ['set', /\bset\s*</], ['string', /\bstring\b/], ['optional', /\boptional\s*</], ['chrono', /\bchrono\b/], ['iostream', /\b(cout|cin|cerr)\b/], ['numeric', /\baccumulate\b/], ['algorithm', /\b(sort|max_element|min_element|find_if|count_if|for_each)\b/], ['memory', /\b(unique_ptr|shared_ptr|make_unique|make_shared)\b/], ['utility', /\bpair\s*</]];
    need.forEach(([h, rx]) => { if (rx.test(all) && !new RegExp('#include\\s*<' + h + '>').test(code)) { const i = clean.findIndex((l) => rx.test(l)); add(i, 'warn', 'falta-include', `Usas algo de <${h}> pero no hay «#include <${h}>». Puede compilar por casualidad en tu máquina y fallar en la del examen.`); } });
    // 14. paso por valor de contenedores grandes
    clean.forEach((l, i) => {
      if (/^\s*#/.test(l) || !/\(.*\)/.test(l)) return;
      const mm = l.match(/\(\s*(?:[^()]*,\s*)?(?:std::)?(string|vector\s*<[^()]*?>|map\s*<[^()]*?>|set\s*<[^()]*?>)\s+(\w+)\s*[,)]/);
      if (mm && !/\bmove\s*\(/.test(all) ) add(i, 'info', 'paso-por-valor', `«${mm[2]}» se pasa por valor (${mm[1].replace(/\s+/g, '')}): copia el contenido entero. Si solo lo lees, usa «const ${mm[1].replace(/\s+/g, '')}&».`);
    });
    out.sort((a, b) => a.line - b.line);
    return out;
  };
  P.reviewVerdict = (f) => { const e = f.filter((x) => x.level === 'error').length, w = f.filter((x) => x.level === 'warn').length; return { errores: e, avisos: w, compilaria: e === 0 }; };
  root.PSTR = P;
})(typeof window !== 'undefined' ? window : module.exports);

(function(){
const P=window.PSTR,S=window.PSTR_SIMS=window.PSTR_SIMS||{};
const NS='http://www.w3.org/2000/svg';
function h(tag,props,...kids){const e=document.createElement(tag);for(const k in(props||{})){if(k==='on')for(const ev in props.on)e.addEventListener(ev,props.on[ev]);else if(k==='html')e.innerHTML=props[k];else if(k in e&&k!=='list')try{e[k]=props[k]}catch(_){e.setAttribute(k,props[k])}else e.setAttribute(k,props[k])}
 kids.flat().forEach(c=>{if(c!=null)e.append(c.nodeType?c:document.createTextNode(c))});return e}
const COL=['#2456d6','#d9480f','#2b8a3e','#a61e4d','#862e9c','#0b7285'];
function gantt(tl,labels,o){o=o||{};const n=tl.length,cw=Math.max(10,Math.min(26,Math.floor(720/Math.max(n,1)))),rh=24,L=50,W=L+n*cw+10,Hh=labels.length*rh+30;
 let s=`<svg xmlns="${NS}" viewBox="0 0 ${W} ${Hh}" width="${W}" role="img" aria-label="Diagrama de Gantt">`;
 labels.forEach((l,i)=>{s+=`<text x="4" y="${i*rh+17}" font-size="13" fill="currentColor">${l}</text><line x1="${L}" x2="${W-10}" y1="${i*rh+22}" y2="${i*rh+22}" stroke="currentColor" opacity=".2"/>`});
 tl.forEach((r,t)=>{if(r>=0)s+=`<rect x="${L+t*cw}" y="${r*rh+3}" width="${cw-1}" height="${rh-8}" fill="${COL[r%COL.length]}" rx="2"><title>t=${t}</title></rect>`});
 (o.marks||[]).forEach(m=>{s+=`<text x="${L+m[1]*cw}" y="${m[0]*rh+14}" font-size="14" fill="#c92a2a" font-weight="700">✗</text>`});
 const step=n>60?10:(n>30?5:1);for(let t=0;t<=n;t+=step)s+=`<text x="${L+t*cw}" y="${labels.length*rh+16}" font-size="10" text-anchor="middle" fill="currentColor">${t}</text>`;
 return s+'</svg>'}
function box(root,title){root.innerHTML='';root.append(h('div',{className:'stt'},title));return root}
function num(v,min,max,w,cb){return h('input',{type:'number',value:v,min,max,on:{input:cb}})}
function fmt(x,d){return Number(x).toFixed(d==null?2:d).replace('.',',')}
function reg(root,load){const id=root.id.replace(/^sim-/,'');S[id]={load}}

// ---------- planificación ----------
const PRE={feb17:[[4,60,20,2],[4,10,10,1],[8,50,50,0]],jun16:[[4,100,15,2],[4,10,10,2],[8,50,50,0],[6,40,25,2]],sep16:[[12,120,120,0],[8,500,25,3],[10,20,20,3]],burns:[[3,7,7,0],[3,12,12,0],[5,20,20,0]],ej1:[[1,4,4,0],[2,6,6,0],[3,12,12,0]],fallo:[[2,4,4,0],[3,6,6,0],[3,12,12,0]]};
function rta(root,arg){box(root,'Simulador de planificación: RM / DM / EDF y tiempo de respuesta');
 let rows=(PRE[arg]||PRE.burns).map(r=>r.slice());
 const tb=h('table'),out=h('div'),pol=h('select',{on:{change:run}},h('option',{value:'RM'},'RM (periodo)'),h('option',{value:'DM'},'DM (plazo)'),h('option',{value:'EDF'},'EDF'));
 function draw(){tb.innerHTML='<tr><th>Tarea</th><th>C</th><th>T</th><th>D</th><th>B</th><th></th></tr>';rows.forEach((r,i)=>{const tr=h('tr',null,h('td',null,'τ'+(i+1)));[0,1,2,3].forEach(j=>tr.append(h('td',null,num(r[j],0,999,0,e=>{r[j]=+e.target.value;run()}))));tr.append(h('td',null,h('button',{on:{click:()=>{rows.splice(i,1);draw();run()}}},'×')));tb.append(tr)})}
 function run(){const ts=rows.map(r=>({C:r[0],T:r[1],D:r[2]||r[1],B:r[3]}));if(!ts.length){out.textContent='';return}
  const u=P.util(ts),n=ts.length,lb=P.llBound(n),H=P.hyper(ts),p=pol.value;let html=`<p>Utilización U = <b>${fmt(u,3)}</b> · cota de Liu–Layland (n=${n}) = <b>${fmt(lb,3)}</b> · hiperperiodo = <b>${H}</b>. `;
  html+=p==='EDF'?(u<=1?'EDF: U ≤ 1, planificable (si D = T).':'U &gt; 1: no planificable.'):(u<=lb?'U ≤ cota: planificable por la condición suficiente.':'U &gt; cota: la condición suficiente no concluye; usa el tiempo de respuesta.')+'</p>';
  if(p!=='EDF'){const r=P.rta(ts,p);html+='<div class="tw"><table><tr><th>Tarea</th><th>Prioridad</th><th>Iteraciones de R</th><th>R</th><th>D</th><th>¿Cumple?</th></tr>';ts.forEach((t,i)=>{const x=r.res[i];html+=`<tr><td>τ${i+1}</td><td>${r.order.length-r.order.indexOf(i)}</td><td>${x.hist.join(' → ')}</td><td>${x.R}</td><td>${t.D}</td><td>${x.ok?'✔':'✘'}</td></tr>`});html+='</table></div>'}
  const hh=Math.min(H,120),sim=P.simulate(ts,p,hh);html+=`<p>Cronograma (primeros ${hh} instantes, sin bloqueos). ${sim.misses.length?'<b style="color:#c92a2a">Hay plazos incumplidos (✗).</b>':'Ningún plazo incumplido.'}</p>`+gantt(sim.tl,ts.map((_,i)=>'τ'+(i+1)),{marks:sim.misses.map(m=>[m[0],m[1]-1])});
  out.innerHTML=html}
 root.append(h('div',{className:'row'},h('label',null,'Política: ',pol),h('button',{on:{click:()=>{rows.push([1,10,10,0]);draw();run()}}},'+ tarea'),h('small',null,'C = cómputo, T = periodo, D = plazo, B = bloqueo máximo')),h('div',{className:'tw'},tb),out);
 draw();run();root.__load=a=>{rows=(PRE[a]||PRE.burns).map(r=>r.slice());draw();run()};reg(root,root.__load)}
// ---------- ejecutivo cíclico ----------
function frames(root,arg){box(root,'Ejecutivo cíclico: tamaño del ciclo secundario');let rows=[[40,10,40],[80,8,80],[120,12,120]];
 const tb=h('table'),out=h('div');
 function draw(){tb.innerHTML='<tr><th>Tarea</th><th>T</th><th>C</th><th>D</th><th></th></tr>';rows.forEach((r,i)=>{const tr=h('tr',null,h('td',null,'τ'+(i+1)));[0,1,2].forEach(j=>tr.append(h('td',null,num(r[j],1,999,0,e=>{r[j]=+e.target.value;run()}))));tr.append(h('td',null,h('button',{on:{click:()=>{rows.splice(i,1);draw();run()}}},'×')));tb.append(tr)})}
 function run(){if(!rows.length)return;const f=P.frames(rows.map(r=>({T:r[0],C:r[1],D:r[2]})));let html=`<p>Ciclo principal Tm = mcm(T) = <b>${f.Tm}</b>. Cómputo máximo = <b>${f.maxC}</b>. El ciclo secundario Ts debe cumplir: Ts ≥ ${f.maxC}, Ts divide a Tm y 2·Ts − mcd(Ts, Tᵢ) ≤ Dᵢ para toda tarea.</p><div class="tw"><table><tr><th>Ts</th>`+rows.map((_,i)=>`<th>2Ts−mcd (τ${i+1})</th>`).join('')+'<th>¿Válido?</th></tr>';f.frames.forEach(x=>{html+=`<tr><td>${x.Ts}</td>`+x.checks.map(c=>`<td>${c.v} ${c.ok?'≤':'&gt;'} ${c.D}</td>`).join('')+`<td>${x.ok?'✔':'✘'}</td></tr>`});out.innerHTML=html+'</table></div>'}
 root.append(h('div',{className:'tw'},tb),h('button',{on:{click:()=>{rows.push([100,5,100]);draw();run()}}},'+ tarea'),out);draw();run();reg(root,()=>{})}
// ---------- carrera ----------
function race(root){box(root,'Condición de carrera: dos hilos hacen x += 2 (x empieza en 0)');
 const n=h('input',{type:'range',min:10,max:2000,value:500}),m=h('input',{type:'checkbox'}),out=h('div'),lab=h('span',null,'500 ejecuciones');
 function run(){lab.textContent=n.value+' ejecuciones';const r=P.mulberry(Date.now()%100000),c={};for(let i=0;i<+n.value;i++){const x=P.raceRandom(m.checked,r);c[x]=(c[x]||0)+1}
  const ks=Object.keys(c).sort(),mx=Math.max(...Object.values(c));let s=`<svg xmlns="${NS}" viewBox="0 0 300 120" width="300">`;ks.forEach((k,i)=>{const hh=100*c[k]/mx;s+=`<rect class="bar" x="${30+i*90}" y="${105-hh}" width="60" height="${hh}"/><text x="${60+i*90}" y="118" text-anchor="middle" font-size="12" fill="currentColor">x=${k}</text><text x="${60+i*90}" y="${100-hh}" text-anchor="middle" font-size="12" fill="currentColor">${c[k]}</text>`});
  out.innerHTML=s+'</svg><p>'+(ks.length>1||ks[0]!=='4'?'Aparece <b>x = 2</b>: se pierde una actualización (los dos hilos leyeron 0).':'Con mutex solo sale <b>x = 4</b> en todas las ejecuciones.')+'</p>'}
 root.append(h('div',{className:'row'},h('label',null,'Ejecuciones: ',n),lab,h('label',null,h('input',{type:'checkbox',id:'m'+Math.random(),on:{change:run}}),' con mutex')),out);
 root.querySelector('input[type=checkbox]').onchange=e=>{m.checked=e.target.checked;run()};n.oninput=run;root.append(h('button',{on:{click:run}},'Repetir'));run();reg(root,()=>{})}
// ---------- vector ----------
function vec(root){box(root,'std::vector: capacidad y copias con push_back');const n=h('input',{type:'range',min:1,max:64,value:20}),f=h('select',null,h('option',{value:'2'},'factor 2 (GCC)'),h('option',{value:'1.5'},'factor 1,5 (MSVC)')),r=h('input',{type:'number',value:0,min:0,max:64}),out=h('div');
 function run(){const x=P.vecGrow(+n.value,+f.value,+r.value),mx=Math.max(...x.steps.map(s=>s.cap)),w=Math.max(6,Math.floor(560/x.steps.length));let s=`<svg xmlns="${NS}" viewBox="0 0 ${w*x.steps.length+20} 130" width="${w*x.steps.length+20}">`;x.steps.forEach((t,i)=>{const hc=110*t.cap/mx,hs=110*t.size/mx;s+=`<rect x="${10+i*w}" y="${120-hc}" width="${w-1}" height="${hc}" fill="none" stroke="currentColor" opacity=".5"/><rect x="${10+i*w}" y="${120-hs}" width="${w-1}" height="${hs}" class="bar" ${t.moved?'style="fill:#d9480f"':''}/>`});
  out.innerHTML=s+`</svg><p>size final = <b>${n.value}</b>, capacity final = <b>${x.steps[x.steps.length-1].cap}</b>, realocaciones = <b>${x.reallocs}</b> (barras naranjas), elementos copiados = <b>${x.copies}</b>. Con <code>reserve(${n.value})</code> serían 1 realocación y 0 copias.</p>`}
 root.append(h('div',{className:'row'},h('label',null,'push_back ×',n),h('label',null,'crecimiento ',f),h('label',null,'reserve inicial ',r)),out);[n,f,r].forEach(e=>e.addEventListener('input',run));run();reg(root,()=>{})}
// ---------- Patriot ----------
function patriot(root){box(root,'Error de coma flotante: el reloj del Patriot');const hr=h('input',{type:'range',min:0,max:120,value:100}),out=h('div');
 function run(){const p=P.patriot(+hr.value);out.innerHTML=`<p>0,1 s en binario: <code>${P.bits(0.1,40)}…</code> (infinito periódico). Truncado a 23 bits tras la coma: error por tic = <b>${p.e.toExponential(3).replace('.',',')}</b> s.</p><p>Tras <b>${hr.value} h</b> hay ${p.ticks.toLocaleString('es-ES')} tics → deriva = <b>${fmt(p.drift,4)} s</b> → un Scud a 1676 m/s se «desplaza» <b>${fmt(p.dist,0)} m</b> respecto a donde el sistema lo busca.</p>`}
 root.append(h('div',{className:'row'},h('label',null,'Horas encendido: ',hr),h('span',null,'')),out);hr.oninput=run;run();reg(root,()=>{})}
// ---------- inversión ----------
function inv(root){box(root,'Inversión de prioridad: L (baja), M (media), H (alta) y un mutex');const sel=h('select',null,h('option',{value:'none'},'sin protocolo'),h('option',{value:'pip'},'herencia de prioridad'),h('option',{value:'icpp'},'techo de prioridad inmediato')),out=h('div');
 function run(){const r=P.inversion(sel.value);out.innerHTML=gantt(r.tl,['L','M','H'])+`<p>H termina en <b>t = ${r.fin[2]}</b> (llega en t = 3). Tiempo de respuesta de H = <b>${r.fin[2]-3}</b>; su cómputo propio es 4, luego pierde <b>${r.fin[2]-3-4}</b> unidades esperando.</p><p>L: 1 + sección crítica de 3 + 1. M llega en 2 y dura 4. H llega en 3: 1 + sección crítica de 2 + 1.</p>`}
 root.append(h('div',{className:'row'},h('label',null,'Protocolo: ',sel)),out);sel.onchange=run;run();reg(root,a=>{if(a){sel.value=a;run()}})}
// ---------- filósofos ----------
function philo(root){box(root,'Cena de los filósofos (3 cubiertos por filósofo, n+1 cubiertos)');const n=h('input',{type:'number',min:3,max:8,value:3}),md=h('select',null,h('option',{value:'seq'},'lock() de cada mutex uno a uno'),h('option',{value:'lock'},'std::lock / scoped_lock (todos a la vez)')),seed=h('input',{type:'number',value:1}),ro=h('input',{type:'number',value:20,min:1,max:200}),out=h('div');
 function run(){const r=P.philosophers(+n.value,md.value,+ro.value,P.mulberry(+seed.value));out.innerHTML=r.deadlock?`<p><b style="color:#c92a2a">INTERBLOQUEO.</b> Comidas por filósofo: ${r.eaten.join(', ')}. Cubiertos tomados por: ${r.held.map((x,i)=>`C${i+1}:${x<0?'libre':'F'+(x+1)}`).join(' · ')}</p>`:`<p><b style="color:#2b8a3e">Terminan todos.</b> Comidas por filósofo: ${r.eaten.join(', ')}.</p>`;
  let t=0;if(md.value==='seq'){let d=0;for(let s=1;s<=50;s++)if(P.philosophers(+n.value,'seq',+ro.value,P.mulberry(s)).deadlock)d++;out.innerHTML+=`<p>En 50 semillas distintas hay interbloqueo en <b>${d}</b>.</p>`}}
 root.append(h('div',{className:'row'},h('label',null,'Filósofos ',n),h('label',null,'Ciclos ',ro),h('label',null,'Semilla ',seed),md,h('button',{on:{click:run}},'Simular')),out);[n,md,seed,ro].forEach(e=>e.addEventListener('input',run));run();reg(root,()=>{})}
// ---------- laboratorio: histograma ----------
const Q='En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor. Una olla de algo más vaca que carnero, salpicón las más noches, duelos y quebrantos los sábados, lentejas los viernes, algún palomino de añadidura los domingos, consumían las tres partes de su hacienda.';
function labWords(root,arg){box(root,'Práctica 1: histograma de palabras (map<string,int>)');const ta=h('textarea',null,Q),cs=h('input',{type:'checkbox',checked:true,on:{change:run}}),out=h('div');
 function run(){const txt=cs.checked?ta.value.toLowerCase():ta.value,w=txt.split(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/).filter(Boolean),m={};w.forEach(x=>m[x]=(m[x]||0)+1);const e=Object.entries(m).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)),top=e.slice(0,8),mx=top.length?top[0][1]:1;
  let s=`<svg xmlns="${NS}" viewBox="0 0 420 ${top.length*22+6}" width="420">`;top.forEach((t,i)=>{s+=`<text x="2" y="${i*22+16}" font-size="13" fill="currentColor">${t[0]}</text><rect class="bar" x="90" y="${i*22+4}" width="${300*t[1]/mx}" height="16"/><text x="${95+300*t[1]/mx}" y="${i*22+16}" font-size="12" fill="currentColor">${t[1]}</text>`});
  const cons=top.slice(0,2).map(t=>t[0]+': '+t[1]).join('\n');out.innerHTML=s+`</svg><div class="cons">Palabras totales: ${w.length}\nPalabras distintas: ${e.length}\nLas dos más repetidas:\n${cons}</div><pre><code>map&lt;string,int&gt; hist;\nwhile (in &gt;&gt; palabra) {\n    for (char&amp; c : palabra) c = tolower((unsigned char)c);   // ${cs.checked?'activo':'desactivado'}\n    palabra.erase(remove_if(palabra.begin(), palabra.end(), [](unsigned char c){ return ispunct(c); }), palabra.end());\n    if (!palabra.empty()) ++hist[palabra];\n}</code></pre>`}
 root.append(ta,h('div',{className:'row'},h('label',null,cs,' ignorar mayúsculas')),out);ta.oninput=run;run();reg(root,a=>{if(a==='mayus'){ta.value='Programación de Tiempo Real o programación de tiempo real';cs.checked=false}else if(a==='quijote')ta.value=Q;run()})}
// ---------- laboratorio: filas por hilo ----------
function labRows(root){box(root,'Práctica 3.1: suma de matrices por filas con n hilos');const t=h('input',{type:'number',min:1,max:16,value:6}),nh=h('input',{type:'number',min:1,max:8,value:3}),out=h('div');
 function run(){const tam=+t.value,k=+nh.value,rows=P.rows(tam,k);let html='<div class="tw"><table><tr><th>Hilo</th><th>Filas que suma (inicial = id, incremento = n)</th><th>nº filas</th></tr>';rows.forEach((r,i)=>html+=`<tr><td>${i}</td><td>${r.join(', ')||'—'}</td><td>${r.length}</td></tr>`);const mxr=Math.max(...rows.map(r=>r.length));
  html+=`</table></div><div class="cons">tiempo modelo = filas del hilo más cargado × tam = ${mxr} × ${tam} = ${mxr*tam} sumas\ntiempo con 1 hilo = ${tam*tam} sumas\nmejora teórica = ${fmt(tam*tam/(mxr*tam),2)}×</div><pre><code>vector&lt;thread&gt; v;\nfor (int id = 0; id &lt; ${k}; ++id)\n    v.emplace_back(suma_fila, ref(a), ref(b), ref(c), id, ${k});   // fila inicial id, salto ${k}\nfor (auto&amp; h : v) h.join();</code></pre>`;out.innerHTML=html}
 root.append(h('div',{className:'row'},h('label',null,'Tamaño (tam×tam) ',t),h('label',null,'Hilos ',nh)),out);[t,nh].forEach(e=>e.addEventListener('input',run));run();reg(root,()=>{})}
// ---------- enlace dinámico ----------
function bind(root){box(root,'¿Qué método se ejecuta? Enlace estático frente a dinámico');const sv=h('select',null,h('option',{value:'v'},'método virtual'),h('option',{value:'n'},'método no virtual')),how=h('select',null,h('option',{value:'ptr'},'a través de Base* (apunta a Derivada)'),h('option',{value:'ref'},'a través de Base& (referida a Derivada)'),h('option',{value:'val'},'copia por valor: Base b = derivada;'),h('option',{value:'obj'},'directamente sobre un objeto Derivada')),out=h('div');
 function run(){const virt=sv.value==='v',h2=how.value;const dyn=(h2==='ptr'||h2==='ref')&&virt,d=h2==='obj'||dyn;out.innerHTML=`<p>Se ejecuta <b>${d?'Derivada::f()':'Base::f()'}</b>.</p><p>${h2==='val'?'La copia por valor «recorta» el objeto (slicing): ya solo es un Base.':virt?(d&&h2!=='obj'?'La tabla de métodos virtuales del objeto real decide en tiempo de ejecución.':'El tipo del objeto es Derivada.'):'Sin <code>virtual</code> el compilador decide por el tipo estático (Base): enlace estático.'}</p>`}
 root.append(h('div',{className:'row'},sv,how),out);[sv,how].forEach(e=>e.onchange=run);run();reg(root,()=>{})}

function complejo(root){box(root,'Práctica 2.1: número complejo (C_Complejo)');
 const mk=(v)=>h('input',{type:'number',step:'0.5',value:v}),ar=mk(3),ai=mk(4),br=mk(1),bi=mk(-2),out=h('div');
 const fmt=(re,im)=>`${+re.toFixed(6)}${im<0?'-':'+'}${+Math.abs(im).toFixed(6)}i`;
 function run(){const a=[+ar.value,+ai.value],b=[+br.value,+bi.value];const m=Math.hypot(a[0],a[1]),g=Math.atan2(a[1],a[0]);
  const code=`C_Complejo a{${a[0]}, ${a[1]}}, b{${b[0]}, ${b[1]}};\ncout << "a+b=" << a + b << "  a-b=" << a - b << '\\n';\nauto [m, arg] = modulo_argumento(a);\ncout << "|a|=" << m << " arg(a)=" << arg << " rad\\n";`;
  out.innerHTML='<pre><code></code></pre><div class="cons"></div>';out.querySelector('code').textContent=code;
  out.querySelector('.cons').textContent=`a=${fmt(...a)} b=${fmt(...b)}\na+b=${fmt(a[0]+b[0],a[1]+b[1])}  a-b=${fmt(a[0]-b[0],a[1]-b[1])}\n|a|=${+m.toFixed(6)} arg(a)=${+g.toFixed(6)} rad`}
 root.append(h('div',{className:'row'},h('label',null,'a = ',ar,' + ',ai,'i'),h('label',null,' b = ',br,' + ',bi,'i')),out);[ar,ai,br,bi].forEach(e=>e.oninput=run);run();reg(root,()=>{})}
function almacen(root){box(root,'Práctica 3.4: almacén con un generador y varios lectores (monitor)');
 const nl=h('input',{type:'range',min:1,max:5,value:3}),lab=h('span',null,'3 lectores'),sd=h('input',{type:'number',value:1,min:1,max:9999,style:'width:6em'}),out=h('div');
 function run(){lab.textContent=nl.value+' lectores';const r=P.almacen(+nl.value,7,+sd.value);
  const rows=r.trace.map((t,k)=>`<tr><td>${k+1}</td><td>${t.who==='G'?'<b>Generador</b>':'Lector '+t.who}</td><td>${t.who==='G'?'escribe':'lee'} ${t.v}</td></tr>`).join('');
  out.innerHTML=`<p>${r.ok?'✔ Cada lector leyó los 7 valores <b>una vez y en orden</b>; el generador nunca escribió antes de que todos leyeran.':'✘ Algo falló'}</p><p>Suma que ve cada lector: <b>${r.reads.map(l=>l.reduce((a,b)=>a+b,0)).join(', ')}</b> (esperado 21).</p><div class="tw" style="max-height:260px;overflow:auto"><table><tr><th>Paso</th><th>Hilo</th><th>Acción</th></tr>${rows}</table></div><p><small>El orden de los lectores cambia con la semilla; el resultado, no.</small></p>`}
 root.append(h('div',{className:'row'},h('label',null,'Lectores: ',nl),lab,h('label',null,' semilla: ',sd)),out);nl.oninput=run;sd.oninput=run;run();reg(root,()=>{})}

// ---------- modo examen ----------
const EXAMS=[['mayo26','Mayo 2026',['ex-mayo26-1','ex-mayo26-2']],['junio26','Junio 2026',['ex-junio26-1','ex-junio26-2']],['mayo25','Mayo 2025',['ex-mayo25-1','ex-mayo25-2']],['junio25','Junio 2025',['ex-junio25-1','ex-junio25-2']],['mayo24','Mayo 2024',['ex-mayo24-1','ex-mayo24-2']],['junio23','Junio 2023',['ex-junio23-1','ex-junio23-2']],['abril24','Abril 2024 (solo el ejercicio 2 está resuelto)',['ex-abril24-2']]];
function lsGet(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function href(id){return document.getElementById(id)?'#'+id:'examenes.html#'+id}
function examen(root){box(root,'Modo examen: 2 h 30 min, enunciado primero y solución al entregar');
 const KEY='pstr:examen',HIS='pstr:examen:hist';let st=lsGet(KEY,null),tick=null;
 const body=h('div');root.append(body);
 function save(){lsSet(KEY,st)}
 function setup(){clearInterval(tick);body.innerHTML='';
  const sel=h('select',null,...EXAMS.map(e=>h('option',{value:e[0]},e[1]))),dur=h('select',null,h('option',{value:150},'Examen completo (2 h 30 min)'),h('option',{value:75},'Un ejercicio (1 h 15 min)'),h('option',{value:10},'Prueba rápida (10 min)'));
  const his=lsGet(HIS,[]);
  body.append(h('p',null,'Reparto habitual: ',h('b',null,'70 % programación orientada a objetos'),' y ',h('b',null,'30 % concurrencia'),'. Las soluciones quedan ocultas hasta que entregues. Si tu código no compila, la nota de ese ejercicio se divide por 2.'),
   h('div',{className:'row'},h('label',null,'Examen: ',sel),h('label',null,'Duración: ',dur),h('button',{on:{click:()=>{st={key:sel.value,start:Date.now(),total:+dur.value*60000,phase:'run',marks:{poo:[],conc:[]},compila:{poo:true,conc:true}};save();run()}}},'Empezar')),
   his.length?h('div',null,h('p',null,h('b',null,'Tus últimos intentos')),h('ul',null,...his.slice(-5).reverse().map(x=>h('li',null,`${x.label} · ${x.fecha} · nota estimada ${fmt(x.nota,1)} / 10`)))):h('small',null,'Aún no has guardado ningún intento.'))}
 function run(){clearInterval(tick);body.innerHTML='';const ex=EXAMS.find(e=>e[0]===st.key);
  if(st.phase==='grade')return grade();
  const t=h('div',{className:'examtimer',style:'font-size:2.4rem;font-weight:800;font-variant-numeric:tabular-nums'}),warn=h('small',null,'');
  body.append(h('p',null,'Estás haciendo: ',h('b',null,ex[1])),t,warn,
   h('p',null,h('a',{className:'btn',href:href('exam-'+st.key),target:'_blank',rel:'noopener'},'Abrir enunciado'),' ',h('small',null,'(se abre en otra pestaña; en el examen real no tendrás la solución delante)')),
   h('div',{className:'row'},h('button',{on:{click:()=>{if(confirm('¿Entregar ahora?')){st.phase='grade';save();run()}}}},'Entregar'),h('button',{on:{click:()=>{if(confirm('¿Abandonar este intento?')){st=null;lsSet(KEY,null);setup()}}}},'Abandonar')),
   h('p',null,h('small',null,'Consejo: compila con ',h('code',null,'g++ -std=c++17 -Wall -Wextra -pthread'),' antes de entregar y pasa tu código por el ',h('a',{href:'#sim-revisor'},'revisor de código'),'.')));
  function upd(){const r=P.examTimer(st.start,Date.now(),st.total);t.textContent=r.text;if(r.rest<600000)t.style.color='#c92a2a';warn.textContent=r.rest<600000&&!r.over?'Quedan menos de 10 minutos: revisa que compile.':'';if(r.over){clearInterval(tick);st.phase='grade';save();run()}}
  upd();tick=setInterval(upd,1000)}
 function grade(){body.innerHTML='';const ex=EXAMS.find(e=>e[0]===st.key);
  const out=h('div',{className:'examout'});
  function calc(){const g=P.examGrade(st.marks,st.compila);out.innerHTML=`<p>POO: <b>${fmt(g.poo.final,1)}</b> / 70${g.poo.compila?'':' (no compila: ÷ 2)'} · Concurrencia: <b>${fmt(g.conc.final,1)}</b> / 30${g.conc.compila?'':' (no compila: ÷ 2)'}</p><p style="font-size:1.4rem">Nota estimada: <b>${fmt(g.sobre10,1)}</b> / 10 ${g.sobre10>=5?'✔ aprobado':'✘ por debajo del 5'}</p>`;return g}
  body.append(h('p',null,'Tiempo agotado o entrega hecha. Autoevalúate con honestidad: marca solo lo que de verdad tendrías en el papel. ',h('small',null,'(Rúbrica orientativa propia; cada convocatoria reparte los puntos a su manera.)')));
  [['poo','Programación orientada a objetos (70 puntos)'],['conc','Concurrencia (30 puntos)']].forEach(([k,tt])=>{
   const c=h('input',{type:'checkbox',checked:st.compila[k],on:{change:e=>{st.compila[k]=e.target.checked;save();calc()}}});
   body.append(h('h4',null,tt),h('label',null,c,' Mi código de este ejercicio compila sin errores'),h('ul',{style:'list-style:none;padding-left:0'},...P.RUBRICA[k].items.map((it,i)=>h('li',null,h('label',null,h('input',{type:'checkbox',checked:!!st.marks[k][i],on:{change:e=>{st.marks[k][i]=e.target.checked;save();calc()}}}),` ${it[0]} `,h('small',null,`(${it[1]})`))))))});
  body.append(out,h('h4',null,'Soluciones de referencia'),h('p',null,...ex[2].map(id=>h('a',{className:'btn',href:href(id),style:'margin-right:8px'},id.replace('ex-','').replace(/-/g,' · ejercicio ')))),
   h('div',{className:'row'},h('button',{on:{click:()=>{const g=calc(),his=lsGet(HIS,[]);his.push({label:ex[1],nota:g.sobre10,fecha:new Date().toLocaleDateString('es-ES')});lsSet(HIS,his.slice(-20));st=null;lsSet(KEY,null);setup()}}},'Guardar resultado y empezar de nuevo'),h('button',{on:{click:()=>{st=null;lsSet(KEY,null);setup()}}},'Descartar')));
  calc()}
 st?run():setup();reg(root,()=>{})}
// ---------- revisor de código ----------
const EJ_REV={herencia:`#include <iostream>
#include <vector>
using namespace std;

class Figura {
public:
    virtual double area() const = 0;
    double get_lado() { return lado_; }
protected:
    double lado_ = 1;
};

class Cuadrado : public Figura {
public:
    double area() const { return lado_ * lado_; }
    ostream& operator<<(ostream& os) { return os << "cuadrado"; }
};

int main() {
    vector<Figura*> v;
    v.push_back(new Cuadrado);
    cout << v[0]->area() << endl;
}`,monitor:`#include <iostream>
#include <thread>
#include <vector>
using namespace std;

class Cola {
public:
    void poner(int x) { lock_guard<mutex> lk{m_}; datos_.push_back(x); cv_.notify_one(); }
    int sacar(void) {
        unique_lock<mutex> lk{m_};
        if (datos_.empty()) cv_.wait(lk);
        int v = datos_.front(); datos_.erase(datos_.begin());
        return v;
    }
    int esperar_dos() {
        lock_guard<mutex> g{m_};
        cv_.wait(g, [this]{ return datos_.size() >= 2; });
        return datos_.size();
    }
private:
    mutex m_; condition_variable cv_; vector<int> datos_;
};

void consumidor(Cola& c, int n) { for (int i = 0; i < n; ++i) cout << c.sacar() << endl; }

int main() {
    Cola c;
    thread t{consumidor, c, 3};
    c.poner(1); c.poner(2); c.poner(3);
}`};
function revisor(root,arg){box(root,'Revisor de código: busca los fallos típicos antes de entregar');
 const ta=h('textarea',{rows:16,spellcheck:false,style:'width:100%;font-family:ui-monospace,Consolas,monospace;font-size:.85rem;padding:8px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);color:var(--fg);tab-size:4'}),out=h('div');
 const sel=h('select',{on:{change:()=>{if(sel.value&&EJ_REV[sel.value])ta.value=EJ_REV[sel.value];run()}}},h('option',{value:''},'(pega tu código o elige un ejemplo con fallos)'),h('option',{value:'herencia'},'Ejemplo con fallos de herencia'),h('option',{value:'monitor'},'Ejemplo con fallos de monitor'));
 const COLR={error:'#c92a2a',warn:'#e67700',info:'#1971c2'},ETQ={error:'Error',warn:'Aviso',info:'Sugerencia'};
 function run(){const c=ta.value;if(!c.trim()){out.innerHTML='<p><small>Pega aquí tu solución. La revisión es heurística: detecta patrones típicos, <b>no sustituye al compilador</b>.</small></p>';return}
  const f=P.review(c),v=P.reviewVerdict(f);
  let html=`<p>${v.compilaria?'<b style="color:#2b8a3e">No veo errores de compilación evidentes</b>':'<b style="color:#c92a2a">Veo '+v.errores+' error'+(v.errores>1?'es':'')+' que impedirían compilar</b>'} · ${v.avisos} aviso${v.avisos===1?'':'s'}. Compila siempre con <code>g++ -std=c++17 -Wall -Wextra -pthread</code>.</p>`;
  html+=f.length?'<ol style="padding-left:1.2em">'+f.map(x=>`<li style="margin:6px 0"><span style="color:${COLR[x.level]};font-weight:700">${ETQ[x.level]}</span> · línea <b>${x.line}</b> <small>(${x.id})</small><br>${x.msg}</li>`).join('')+'</ol>':'<p>✔ Ningún patrón problemático detectado.</p>';
  out.innerHTML=html}
 root.append(h('div',{className:'row'},sel),ta,out);ta.addEventListener('input',run);run();
 reg(root,a=>{if(EJ_REV[a]){ta.value=EJ_REV[a];sel.value=a;run()}});if(arg&&EJ_REV[arg]){ta.value=EJ_REV[arg];sel.value=arg;run()}}
const R={rta,frames,race,vec,patriot,inv,philo,'lab-words':labWords,'lab-rows':labRows,bind,complejo,almacen,examen,revisor};
function init(){document.querySelectorAll('.sim[data-sim]').forEach(el=>{const[name,arg]=el.dataset.sim.split(':');try{R[name](el,arg)}catch(e){el.textContent='Error en el simulador: '+e.message;console.error(e)}})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ls={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
// tema claro/oscuro: sigue al sistema (prefers-color-scheme)
{const root=document.documentElement,b=$('#theme'),sv=ls.get('tr-theme',null);if(sv)root.setAttribute('data-theme',sv);
 if(b)b.onclick=()=>{const cur=root.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'),nx=cur==='dark'?'light':'dark';root.setAttribute('data-theme',nx);ls.set('tr-theme',nx)}}
// volver arriba
const tt=$('#totop');if(tt){const f=()=>tt.classList.toggle('show',scrollY>700);addEventListener('scroll',f,{passive:true});f()}
// abrir <details> si el hash apunta dentro
function openHash(){const id=decodeURIComponent(location.hash.slice(1));if(!id)return;const e=document.getElementById(id);if(!e)return;let p=e;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement}e.scrollIntoView()}
addEventListener('hashchange',openHash);setTimeout(openHash,300);
// buscador global
let IDX=null;const q=$('#gsrch'),res=$('#gsrch-out');
async function loadIdx(){if(IDX)return IDX;if(window.SEARCH_INDEX){IDX=window.SEARCH_INDEX}else{const el=$('#sidx');IDX=el?JSON.parse(el.textContent):[]}return IDX}
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
if(q)q.addEventListener('input',async e=>{const v=norm(e.target.value.trim());if(v.length<2){res.hidden=true;return}const ix=await loadIdx();const ws=v.split(/\s+/);
 const out=[];for(const it of ix){const t=norm(it.title),b=it.n;let sc=0;let ok=true;for(const w of ws){if(t.includes(w))sc+=5;else if(b.includes(w))sc+=1;else{ok=false;break}}if(ok)out.push([sc,it])}
 out.sort((a,b)=>b[0]-a[0]);res.innerHTML=out.slice(0,25).map(([s,it])=>`<a href="${it.href}"><b>${it.title}</b> <small>${it.sec}</small><br><small>${it.snip}</small></a>`).join('')||'<small>Sin resultados</small>';res.hidden=false});
document.addEventListener('keydown',e=>{if(e.key==='/'&&q&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();q.focus()}});
// checklist
const checks=$$('.chk input');const kk='chk:'+(document.body.dataset.site||'x');let st=ls.get(kk,{});
function updProg(){const n=checks.filter(c=>c.checked).length;$$('.prog>i').forEach(i=>i.style.width=(100*n/Math.max(1,checks.length))+'%');$$('.progn').forEach(s=>s.textContent=n+' / '+checks.length)}
checks.forEach(c=>{c.checked=!!st[c.dataset.id];c.onchange=()=>{st[c.dataset.id]=c.checked;ls.set(kk,st);updProg()}});updProg();
// pestañas
$$('.tabs').forEach(tb=>{const bs=$$('button',tb);bs.forEach(b=>b.onclick=()=>{bs.forEach(x=>x.classList.toggle('on',x===b));const g=tb.dataset.g;$$('.panel[data-g="'+g+'"]').forEach(p=>p.classList.toggle('on',p.dataset.t===b.dataset.t))})});
// filtros exámenes
const fchips=$$('.chips[data-f] .chip'),fq=$('#exq');
function filt(){const act=fchips.filter(c=>c.classList.contains('on')).map(c=>c.dataset.v);const q=fq?norm(fq.value):'';let shown=0;
 $$('details.exam').forEach(d=>{const ok=(!act.length||act.some(a=>d.dataset.f.split(' ').includes(a)))&&(!q||norm(d.dataset.txt).includes(q));d.style.display=ok?'':'none';if(ok)shown++;if(q&&ok)d.open=true});
 $$('details.cur').forEach(c=>{const any=$$('details.exam',c).some(d=>d.style.display!=='none');c.style.display=any?'':'none'});const s=$('#exn');if(s)s.textContent=shown+' exámenes'}
fchips.forEach(c=>c.onclick=()=>{c.classList.toggle('on');filt()});if(fq)fq.addEventListener('input',filt);
// test (con repaso de falladas: se guardan en este navegador)
const site=document.body.dataset.site||'x',QK='sr:quiz:'+site;let failed=new Set(ls.get(QK,[]));
const qkey=q=>($('b',q)||q).textContent.replace(/^\d+\.\s*/,'').slice(0,60);
$$('.q').forEach(q=>{const ok=+q.dataset.ok;$$('.o',q).forEach((o,i)=>o.onclick=()=>{if(q.dataset.done)return;q.dataset.done=1;o.classList.add(i+1===ok?'ok':'bad');$$('.o',q)[ok-1].classList.add('ok');$('.ex',q).style.display='block';
 if(i+1===ok)failed.delete(qkey(q));else failed.add(qkey(q));ls.set(QK,[...failed]);upd()})});
function upd(){const all=$$('.q'),d=all.filter(q=>q.dataset.done),g=d.filter(q=>$('.o.bad',q)==null).length;const s=$('#qscore');if(s)s.textContent=g+' aciertos de '+d.length+' respondidas ('+all.filter(q=>q.style.display!=='none').length+' preguntas)';const rb=$('#qfail');if(rb)rb.textContent='Repasar falladas ('+all.filter(q=>failed.has(qkey(q))).length+')'}
function resetQ(){$$('.q').forEach(q=>{delete q.dataset.done;$$('.o',q).forEach(o=>o.className='o');$('.ex',q).style.display='none'})}
const rq=$('#qreset');if(rq){rq.onclick=()=>{resetQ();$$('.q').forEach(q=>q.style.display='');upd()};
 const fb=document.createElement('button');fb.id='qfail';fb.type='button';fb.style.marginLeft='6px';rq.after(fb);
 fb.onclick=()=>{resetQ();const n=$$('.q').filter(q=>failed.has(qkey(q)));$$('.q').forEach(q=>q.style.display=failed.has(qkey(q))?'':'none');if(!n.length)alert('No tienes preguntas falladas guardadas. ¡Bien!');else n[0].scrollIntoView({block:'center'});upd()};
 upd()}
// tarjetas con repetición espaciada (cajas de Leitner: 1 → 5; los intervalos crecen si aciertas)
const all=window.CARDS||[],CK='sr:cards:'+site,DAY=864e5,INT=[0,10*60e3,DAY,3*DAY,7*DAY,21*DAY];
let sr=ls.get(CK,{}),onlyDue=ls.get('sr:mode:'+site,false),ci=0,flip=false;const cd=$('#card');
const isDue=c=>!sr[c[0]]||sr[c[0]][1]<=Date.now();
const deck=()=>onlyDue?all.filter(isDue):all;
function srStats(){const m=all.filter(c=>sr[c[0]]&&sr[c[0]][0]>=4).length,d=all.filter(isDue).length;return d+' pendientes · '+m+' dominadas de '+all.length}
function showCard(){if(!cd||!all.length)return;const dk=deck(),st=$('#srstat');if(st)st.textContent=srStats();const ctl=$('#srctl');
 if(!dk.length){cd.textContent='¡Todo al día! No hay tarjetas pendientes ahora mismo.';cd.style.fontWeight='700';$('#cn').textContent='0 / 0';if(ctl)ctl.style.visibility='hidden';return}
 if(ci>=dk.length)ci=0;const c=dk[ci];cd.textContent=flip?c[1]:c[0];cd.style.fontWeight=flip?'400':'700';$('#cn').textContent=(ci+1)+' / '+dk.length;if(ctl)ctl.style.visibility=flip?'visible':'hidden'}
if(cd&&all.length){
 const bar=document.createElement('div');bar.style.cssText='margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap';
 bar.innerHTML='<span id="srctl" style="visibility:hidden"><button id="srok" type="button">✔ La sabía</button> <button id="srko" type="button">✘ Fallé</button></span><label><input type="checkbox" id="srdue"> Solo pendientes</label><small id="srstat"></small><button id="srreset" type="button" title="Borra el progreso de repaso guardado en este navegador">Reiniciar progreso</button>';
 cd.parentNode.insertBefore(bar,$('#cprev').parentNode.nextSibling);$('#srdue').checked=onlyDue;
 cd.onclick=()=>{flip=!flip;showCard()};$('#cnext').onclick=()=>{ci++;flip=false;showCard()};$('#cprev').onclick=()=>{ci=Math.max(0,ci-1);flip=false;showCard()};
 $('#cshuf').onclick=()=>{for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]]}ci=0;flip=false;showCard()};
 const grade=ok=>{const dk=deck();if(!dk.length)return;const c=dk[ci],b=ok?Math.min(Math.max(2,((sr[c[0]]||[0])[0]||0)+1),5):1;sr[c[0]]=[b,Date.now()+INT[b]];ls.set(CK,sr);flip=false;if(!onlyDue)ci++;showCard()};
 $('#srok').onclick=()=>grade(true);$('#srko').onclick=()=>grade(false);
 $('#srdue').onchange=e=>{onlyDue=e.target.checked;ls.set('sr:mode:'+site,onlyDue);ci=0;flip=false;showCard()};
 $('#srreset').onclick=()=>{if(confirm('¿Borrar el progreso de repaso de las tarjetas y las preguntas falladas?')){sr={};ls.set(CK,sr);failed=new Set();ls.set(QK,[]);ci=0;flip=false;showCard();upd()}};
 showCard()}
// botones "abrir en el simulador"
$$('.open-sim').forEach(b=>b.onclick=()=>{const s=document.getElementById('sim-'+b.dataset.sim);if(!s)return;let p=s;while(p){if(p.tagName==='DETAILS')p.open=true;p=p.parentElement}s.scrollIntoView({behavior:'smooth',block:'center'});const S=(window.PSTR_SIMS||{})[b.dataset.sim];if(S&&S.load)S.load(b.dataset.arg)});
// vídeos de YouTube: se cargan al pulsar (no se descarga nada antes)
$$('.yt').forEach(y=>{const id=y.dataset.id,b=$('.ytbtn',y);
 const th=new Image();th.onload=()=>{b.style.backgroundImage='url('+th.src+')'};th.src='https://i.ytimg.com/vi/'+id+'/hqdefault.jpg';
 b.onclick=()=>{const f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0';f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;f.title=$('b',y).textContent;f.loading='lazy';y.classList.add('on');b.replaceWith(f)}});
// figuras: pulsa para ampliar
const lb=document.createElement('div');lb.id='lb';lb.innerHTML='<div class="in"></div>';document.body.appendChild(lb);
lb.onclick=()=>lb.classList.remove('on');addEventListener('keydown',e=>{if(e.key==='Escape')lb.classList.remove('on')});
$$('figure.fig').forEach(f=>{f.title='Pulsa para ampliar';f.onclick=()=>{$('.in',lb).innerHTML=f.innerHTML;lb.classList.add('on')}});
// PWA
if('serviceWorker'in navigator&&location.protocol.startsWith('http')){navigator.serviceWorker.register('sw.js').catch(()=>{})}
})();
