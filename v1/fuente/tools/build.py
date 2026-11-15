#!/usr/bin/env python3
"""Genera: dist/guia.html (maestro autocontenido), dist/site/* (multipágina + PWA).  Uso: python3 tools/build.py"""
import os, re, json, html, glob, shutil, datetime, sys, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dsl import parse, read, ROOT
from render_html import R, inline, esc, slug

DATE = os.environ.get('GUIA_DATE', datetime.date.today().isoformat())
TITLE = 'Programación de Sistemas en Tiempo Real'
SECS = [  # id, título corto, color, archivo de contenido, grupo
 ('inicio', 'Empieza aquí', '#2456d6', '00_inicio.md', 'Guía'),
 ('examen', 'El examen y cómo estudiar', '#c2255c', '01_examen.md', 'Guía'),
 ('t0', 'T0 · Sistemas de tiempo real', '#0b7285', 't0_tiempo_real.md', 'Teoría'),
 ('t1', 'T1 · Repaso de C y C++', '#2b8a3e', 't1_cpp.md', 'Teoría'),
 ('t2', 'T2 · Clases y objetos', '#e8590c', 't2_clases.md', 'Teoría'),
 ('t3', 'T3 · Herencia y polimorfismo', '#862e9c', 't3_herencia.md', 'Teoría'),
 ('t4', 'T4 · Hilos y exclusión mutua', '#1864ab', 't4_hilos.md', 'Teoría'),
 ('t5', 'T5 · Monitores y variables condición', '#087f5b', 't5_monitores.md', 'Teoría'),
 ('t6', 'T6 · Planificación', '#a61e4d', 't6_planificacion.md', 'Teoría'),
 ('t7', 'T7 · Coma flotante y casos reales', '#5f3dc4', 't7_flotante.md', 'Teoría'),
 ('practicas', 'Prácticas', '#d9480f', 'practicas.md', 'Práctica'),
 ('examenes', 'Exámenes resueltos', '#c92a2a', None, 'Práctica'),
 ('hojas', 'Hojas de problemas', '#e67700', 'hojas.md', 'Práctica'),
 ('demos', 'Demostraciones', '#6741d9', 'demos.md', 'Práctica'),
 ('auto', 'Autoevaluación', '#2f9e44', None, 'Repaso'),
 ('simulacros', 'Simulacros', '#e03131', 'simulacros.md', 'Repaso'),
 ('formularios', 'Formularios', '#1971c2', None, 'Repaso'),
 ('glosario', 'Glosario', '#495057', None, 'Repaso'),
 ('plan', 'Plan de estudio', '#0c8599', None, 'Repaso'),
]
EXAM_FILES = ['ex_mayo26.md', 'ex_junio26.md', 'ex_mayo25.md', 'ex_junio25.md', 'ex_planificacion.md', 'ex_extra.md']
TEMA_NAMES = dict(stl='C++ básico y STL (strings, vector, map, set, flujos)', clases='Clases y objetos', herencia='Herencia y polimorfismo',
                  hilos='Hilos y exclusión mutua', monitor='Monitores y variables condición', plan='Planificación de tiempo real', otros='Otros')
TEMA_ORDER = ['stl', 'clases', 'herencia', 'hilos', 'monitor', 'plan']
def C(p): return os.path.join(ROOT, 'content', p)
def asset(n): return read(os.path.join(ROOT, 'assets', n))
def nrm(s): return re.sub(r'[̀-ͯ]', '', unicodedata.normalize('NFD', s.lower()))

R_ = R(dict(sec='inicio'))
FORMULAS, EX_META = {}, []
_orig_node = R_.node
def _node(n):
    if n['t'] == 'box' and n['kind'] == 'formula':
        FORMULAS.setdefault(R_.ctx['sec'], []).append(_orig_node(n))
    return _orig_node(n)
R_.node = _node

def render_content(sid, files):
    R_.ctx['sec'] = sid
    out = []
    for f in files:
        if os.path.exists(C(f)): out.append(R_.render(parse(read(C(f)))))
    return ''.join(out)

def stats_table(exams):
    import collections
    rec = [e for e in exams if e['curso'] >= '2022-23']; old = [e for e in exams if e['curso'] < '2022-23']
    def count(es):
        c = collections.Counter()
        for e in es:
            for it in e['items']:
                if it['tema'] != 'otros': c[it['tema']] += 1
        return c
    ca, cr, co = count(exams), count(rec), count(old)
    ta = sum(ca.values())
    rows = ''.join('<tr><td>%s</td><td>%d</td><td>%d %%</td><td>%d</td><td>%d</td></tr>' % (TEMA_NAMES[k], ca[k], round(100 * ca[k] / ta), cr[k], co[k]) for k in TEMA_ORDER)
    mx = max(ca.values())
    bars = ''.join('<div style="display:flex;align-items:center;gap:8px;margin:3px 0"><span style="width:250px;max-width:45%%;font-size:.85rem">%s</span><span style="background:var(--c);height:14px;width:%d%%;border-radius:3px"></span><b style="font-size:.8rem">%d</b></div>' % (TEMA_NAMES[k], int(50 * ca[k] / mx), ca[k]) for k in TEMA_ORDER)
    return ('<div class="tw"><table><thead><tr><th>Tema</th><th>Ejercicios (26 exámenes)</th><th>Peso</th><th>Desde 2022-23</th><th>Antes</th></tr></thead><tbody>%s</tbody></table></div>%s'
            '<p><small>Conteo automático por palabras clave sobre los %d ejercicios con enunciado de los 26 exámenes del material; cada ejercicio cuenta una vez, en su tema principal. Es una estimación, no una estadística oficial.</small></p>') % (rows, bars, ta)

def norm_text(t):
    t = unicodedata.normalize('NFKC', t)
    t = re.sub(r'En este documento se presentan.*?(?:\n\s*\n|$)', '', t, flags=re.S)
    t = t.replace('Llamar al profesor para', 'Avisar en el aula para')
    sub = '₀₁₂₃₄₅₆₇₈₉'
    t = re.sub(r'(?<![A-Za-z])([A-Za-z])([!"#$%&\'(])(?![\w])', lambda m: m.group(1) + sub[ord(m.group(2)) - 32], t)
    t = re.sub(r'(?<=\s)!(?=s ·)', '√', t)
    return t

def norm_exams(exams):
    for e in exams:
        e['intro'] = norm_text(e.get('intro') or '')
        for it in e['items']: it['text'] = norm_text(it['text'])
    return exams

def exkey(e): return re.sub(r'^(solucionExamen_?|examen_)', '', re.sub(r'.*__', '', e['key']))

def exam_section(exams, solved):
    R_.ctx['sec'] = 'examenes'
    byexam = {}
    for m in solved: byexam.setdefault(m.get('exam', ''), []).append(m)
    p1 = '<p>Los más recientes y los que mejor reflejan el examen actual (POO 70 %, concurrencia 30 %). Empieza por el primero y ve hacia atrás.</p>'
    for k in ['mayo26', 'junio26', 'mayo25', 'junio25', 'mayo24', 'abril24', 'junio23']:
        e = next((x for x in exams if exkey(x) == k), None)
        if not e: continue
        links = ''.join('<a class="excard" href="#%s"><b>%s</b> <span class="chip">%s</span></a>' % (m['id'], esc(m['title']), esc(TEMA_NAMES.get(m.get('tema', '').split(',')[0].strip(), ''))) for m in byexam.get(k, []))
        p1 += '<h4>%s</h4>%s' % (esc(e['label']), links or '<p>(enunciado en «Buscar un examen»)</p>')
    p2 = '<p>Ejercicios resueltos paso a paso, agrupados por tema. Los exámenes sin resolución completa están en «Buscar un examen» con su enunciado.</p>'
    for t in TEMA_ORDER:
        ms = [m for m in solved if m.get('tema', '').split(',')[0].strip() == t]
        if ms: p2 += '<h4>%s</h4>' % esc(TEMA_NAMES[t]) + ''.join('<a class="excard" href="#%s">%s <span class="chip">%s</span></a>' % (m['id'], esc(m['title']), esc(next((e['label'] for e in exams if exkey(e) == m.get('exam')), ''))) for m in ms)
    meses = ['abril', 'mayo', 'junio', 'julio', 'septiembre', 'febrero']
    chips = ''.join('<span class="chip" data-v="%s">%s</span>' % (v, l) for v, l in [('parcial', 'Parcial'), ('final', 'Final / convocatoria')] + [(m, m.capitalize()) for m in meses] + [('resuelto', 'Con resolución en la guía')])
    groups = ''
    for c in sorted({e['curso'] for e in exams}, reverse=True):
        inner = ''
        for e in [x for x in exams if x['curso'] == c]:
            k = exkey(e); ms = byexam.get(k, [])
            f = e['tipo'] + ' ' + e['mes'] + (' resuelto' if ms else '')
            body = ''
            if e['intro']: body += '<p><i>%s</i></p>' % esc(re.sub(r'\s+', ' ', e['intro']))
            if ms: body += '<p><b>Resuelto en la guía:</b> ' + ' · '.join('<a href="#%s">%s</a>' % (m['id'], esc(m['title'])) for m in ms) + '</p>'
            for it in e['items']:
                link = next((m for m in ms if str(m.get('n', '')) == str(it['n'])), None)
                body += '<h4>Ejercicio %d <span class="chip">%s</span>%s</h4><pre><code>%s</code></pre>' % (it['n'], esc(TEMA_NAMES.get(it['tema'], '')), (' <a href="#%s">Ver resolución</a>' % link['id']) if link else '', esc(it['text']))
            txt = e['label'] + ' ' + c + ' ' + ' '.join(i['text'] for i in e['items'])
            inner += '<details class="exam" id="exam-%s" data-f="%s" data-txt="%s"><summary>%s · %d ejercicios%s</summary>%s</details>' % (k, f, esc(txt[:6000]).replace('"', '&quot;'), esc(e['label']), len(e['items']), ' · <span class="chip on">resuelto en la guía</span>' if ms else '', body)
        groups += '<details class="cur" %s><summary><b>Curso %s</b></summary>%s</details>' % ('open' if c >= '2024-25' else '', c, inner)
    p3 = '<div class="chips" data-f="1">%s</div><input id="exq" type="search" placeholder="Buscar en los enunciados (p. ej. monitor, herencia, map)…" style="width:100%%;padding:8px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);color:var(--fg)"><p id="exn"></p>%s' % (chips, groups)
    tabs = '<div class="tabs" data-g="ex"><button class="on" data-t="a">Empieza por aquí</button><button data-t="b">Practicar por tema</button><button data-t="c">Buscar un examen</button></div>'
    panels = '<div class="panel on" data-g="ex" data-t="a">%s</div><div class="panel" data-g="ex" data-t="b">%s</div><div class="panel" data-g="ex" data-t="c">%s</div>' % (p1, p2, p3)
    return tabs + panels + '<h3 id="examenes-resoluciones" data-s="1">Resoluciones paso a paso</h3>' + render_content('examenes', EXAM_FILES)

def quiz_html():
    out = ['<p>Pulsa una opción: se corrige al momento y se explica por qué. <button id="qreset">Reiniciar</button> <b id="qscore"></b></p>']
    for i, q in enumerate(R_.quiz, 1):
        a = q[:-1]; idx = len(a) - 2; opts, ok = a[1:idx], int(a[idx]); ex = a[idx + 1]
        out.append('<div class="q" data-ok="%d" id="q%d"><b>%d. %s</b>%s<div class="ex" style="display:none"><b>Explicación.</b> %s</div></div>' % (ok, i, i, inline(a[0]), ''.join('<span class="o">%s</span>' % inline(o) for o in opts), inline(ex)))
    cards = [(c[0], c[1]) for c in R_.cards]
    out.append('<h3 id="auto-tarjetas" data-s="1">Tarjetas de repaso</h3><div class="card3d" id="card"></div><div style="margin-top:8px;display:flex;gap:8px;align-items:center"><button id="cprev">←</button><button id="cnext">→</button><button id="cshuf">Barajar</button><span id="cn"></span></div><script>window.CARDS=%s;</script>' % json.dumps(cards, ensure_ascii=False).replace('</', '<\\/'))
    return ''.join(out)

def build_pages(exams):
    pages = {}
    for sid, title, color, f, g in SECS:
        if f: pages[sid] = render_content(sid, [f])
    solved = []
    for f in EXAM_FILES:
        if os.path.exists(C(f)):
            for n in parse(read(C(f))):
                if n['t'] == 'ex': solved.append(n['meta'])
    pages['examenes'] = exam_section(exams, solved)
    for f in ['quiz.md', 'glosario.md', 'plan.md']:
        if os.path.exists(C(f)):
            R_.ctx['sec'] = 'auto'; R_.render(parse(read(C(f))))
    pages['auto'] = '<h3 id="auto-test" data-s="1">Test con corrección</h3>' + quiz_html()
    fs = ''.join('<h3 id="form-%s" data-s="1">%s</h3>%s' % (sid, esc(title), ''.join(FORMULAS[sid])) for sid, title, color, f, g in SECS if sid in FORMULAS)
    pages['formularios'] = '<p>Las fórmulas clave de cada tema, juntas. Para llevarlas impresas hay un PDF de una página.</p>' + fs
    gl = sorted(R_.gl, key=lambda x: nrm(x[0]))
    pages['glosario'] = '<dl>' + ''.join('<dt id="gl-%s"><b>%s</b></dt><dd>%s</dd>' % (slug(g[0]), inline(g[0]), inline(g[1])) for g in gl) + '</dl>'
    pages['plan'] = '<h3 id="plan-semanas" data-s="1">Plan por semanas</h3>' + ''.join('<h4>%s</h4><p>%s</p>' % (inline(it[0]), inline(it[1])) for it in R_.plan)
    pages['_checks'] = ''.join('<label class="chk"><input type="checkbox" data-id="%s"> %s</label>' % (c[0], inline(c[1])) for c in R_.checks)
    return pages

def side_nav(pages, active, multi):
    out = ''; g = None
    for sid, title, color, f, grp in SECS:
        if grp != g: out += '<div class="grp">%s</div>' % grp; g = grp
        href = ('#sec-' + sid) if not multi else ('%s.html' % sid)
        out += '<a class="top" style="--c:%s" href="%s">%s</a>' % (color, href, esc(title))
        if (not multi) or sid == active:
            subs = re.findall(r'<h3 id="([^"]+)" data-s="1">(.*?)</h3>', pages.get(sid, ''))
            if subs:
                out += '<div class="sub">%s</div>' % ''.join('<a href="%s#%s">%s</a>' % ('' if not multi else sid + '.html', i, re.sub('<.*?>', '', t)) for i, t in subs[:30])
    return out

def shell(body, title, nav, multi, sidx_inline='', pagerhtml='', site='guia'):
    css, js = asset('style.css'), asset('app.js')
    mj = S.katex_tag(False)
    man = '<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png">' if multi else ''
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="Guía de estudio de Programación de Sistemas en Tiempo Real: teoría, ejemplos, prácticas y exámenes resueltos.">
<meta name="theme-color" content="#2456d6">{man}<style>{css}</style>{mj}</head>
<body data-site="{site}"><header class="top"><button id="menu" aria-label="Índice">☰</button><h1>Tiempo real</h1><input id="q" type="search" placeholder="Buscar en la guía ( / )" aria-label="Buscar"><span class="date">Actualizado: {DATE}</span><button id="tbtn" aria-label="Modo claro/oscuro">◐</button></header>
<div id="res"></div><div class="layout"><nav id="side" aria-label="Índice">{nav}</nav><main>{body}{pagerhtml}<footer>Guía de Programación de Sistemas en Tiempo Real · Última actualización: {DATE}</footer></main></div>
{sidx_inline}<script>{asset('sims_core.js')}</script><script>{asset('sims.js')}</script><script>{js}</script></body></html>'''

def search_index(pages, multi):
    ix = []
    for sid, title, color, f, g in SECS:
        for p in re.split(r'(?=<h[34] id=")', pages.get(sid, '')):
            m = re.match(r'<h[34] id="([^"]+)"[^>]*>(.*?)</h[34]>', p)
            hid, ttl = (m.group(1), re.sub('<.*?>', '', m.group(2))) if m else ('', title)
            t = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', p, flags=re.S)
            t = html.unescape(re.sub(r'<.*?>', '', re.sub(r'<br\s*/?>|</p>|</li>|</tr>', ' ', t)))
            t = re.sub(r'\s+', ' ', t).strip()
            if len(t) < 30: continue
            href = ('#' + hid if hid else '#sec-' + sid) if not multi else '%s%s' % (__import__('sitio').PG[sid][0], '#' + hid if hid else '')
            ix.append(dict(title=ttl, sec=title, href=href, snip=t[:140], n=nrm(t[:2500])))
    return ix

def checklist_block(pages):
    return '<div class="prog"><i></i></div><p><b class="progn"></b> tareas marcadas. Se guarda solo en este navegador.</p>' + pages['_checks']

def main():
    exams = norm_exams(json.load(open(C('exams_index.json'), encoding='utf-8')))
    _n = R_.node
    def node2(n):
        if n['t'] == 'fig' and n['name'] == 'stats': return stats_table(exams)
        if n['t'] == 'stmt':
            e = next(x for x in exams if exkey(x) == n['key']); it = next(i for i in e['items'] if i['n'] == n['n'])
            return '<pre class="stmt"><code>%s</code></pre>' % esc(it['text'])
        return _n(n)
    R_.node = node2
    pages = build_pages(exams)
    dist = os.path.join(ROOT, 'dist'); os.makedirs(dist, exist_ok=True)
    import sitio as S
    extras = {'examen': '<h3 id="examen-progreso" data-s="1">Tu progreso</h3>' + checklist_block(pages)}
    all_html = ''.join(pages.get(s[0], '') for s in SECS)
    n_ex = all_html.count('class="ex prob"') + sum(1 for e in exams for _ in e['items']) * 0
    stats = [('8', 'temas, de T0 a T7'), (str(all_html.count('class="ex prob"')), 'ejercicios resueltos paso a paso'),
             (str(len(set(re.findall(r'data-sim="([^"]+)"', all_html)))), 'simuladores interactivos'), (str(all_html.count('class="yt"')), 'vídeos recomendados')]
    from figs import FIGS
    art = FIGS['portada_art']()
    ix_site = search_index(pages, True)
    ix_master = search_index(pages, False)
    js = asset('sims_core.js') + '\n' + asset('sims.js') + '\n' + asset('app.js')
    site = os.path.join(dist, 'site')
    m = S.write_site(site, SECS, pages, extras, stats, art, DATE, asset('cxc_base.css'), asset('ours.css'), js, TITLE, ix_site, ix_master)
    open(os.path.join(dist, 'guia.html'), 'w', encoding='utf-8').write(m)
    # fórmulas: se convierten ya en el HTML (KaTeX), así se ven sin conexión y sin JavaScript
    import subprocess, shutil
    kd = os.path.join(ROOT, 'assets', 'katex')
    shutil.copy(os.path.join(kd, 'katex.css'), os.path.join(site, 'assets', 'katex.css'))
    shutil.copytree(os.path.join(kd, 'fonts'), os.path.join(site, 'assets', 'fonts'))
    files = [os.path.join(site, f) for f in os.listdir(site) if f.endswith('.html')] + [os.path.join(dist, 'guia.html')]
    r = subprocess.run(['node', os.path.join(ROOT, 'tools', 'prerender_math.js')] + files, capture_output=True, text=True)
    print(r.stdout.strip(), r.stderr.strip()[:500])
    if r.returncode: raise SystemExit('fórmulas con error')
    print('OK', len(ix_site), 'entradas;', os.path.getsize(os.path.join(dist, 'guia.html')) // 1024, 'KB maestro;', len(os.listdir(site)), 'archivos en site/')
if __name__ == '__main__': main()
