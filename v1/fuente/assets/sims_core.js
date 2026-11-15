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
