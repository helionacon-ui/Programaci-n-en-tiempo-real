"""Esqueleto del sitio, igual que el de «Control por Computador»: portada con buscador, una página por tema,
índice lateral con grupos, migas, paginador anterior/siguiente, style.css / app.js / search-index.js compartidos, PWA."""
import os, re, json, html, hashlib, shutil

REPO_NAME = 'Programaci-n-en-tiempo-real'
PAGES_URL = 'https://helionacon-ui.github.io/Programaci-n-en-tiempo-real/'
HUB_URL = 'https://helionacon-ui.github.io/GIEIA-UPCT/'
START = '2026-11-08'
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

# sid: (archivo, grupo, índice de color, insignia, texto corto del índice)
PG = {
    'inicio': ('empezar.html', 'Empezar', 0, '0', 'Empieza aquí'),
    'examen': ('empezar.html', 'Empezar', 0, '?', 'Empieza aquí y el examen'),
    't0': ('t0.html', 'Teoría', 1, '0', None), 't1': ('t1.html', 'Teoría', 2, '1', None),
    't2': ('t2.html', 'Teoría', 3, '2', None), 't3': ('t3.html', 'Teoría', 4, '3', None),
    't4': ('t4.html', 'Teoría', 5, '4', None), 't5': ('t5.html', 'Teoría', 6, '5', None),
    't6': ('t6.html', 'Teoría', 7, '6', None), 't7': ('t7.html', 'Teoría', 8, '7', None),
    'practicas': ('practicas.html', 'Practicar', 7, 'P', None), 'examenes': ('examenes.html', 'Practicar', 8, 'E', None),
    'hojas': ('hojas.html', 'Practicar', 3, 'H', None), 'demos': ('demostraciones.html', 'Practicar', 8, 'D', None),
    'auto': ('autoevaluacion.html', 'Practicar', 8, '✎', None), 'simulacros': ('simulador.html', 'Practicar', 8, 'S', None),
    'formularios': ('formulario.html', 'Consultar', 0, 'Σ', None), 'glosario': ('glosario.html', 'Consultar', 0, 'Aa', None),
    'plan': ('plan.html', 'Consultar', 0, '→', None),
}
DESC = {
    'inicio': 'Qué es la asignatura, cómo es el examen, por dónde empezar y tu progreso.',
    't0': 'Qué es un sistema de tiempo real: plazos, periodos, jitter y ciclo de vida.',
    't1': 'Referencias, punteros, flujos, contenedores de la STL, lambdas y plantillas.',
    't2': 'Clases, encapsulación, regla de 0, 3 y 5, sobrecarga de operadores y composición.',
    't3': 'Herencia, polimorfismo, clases abstractas, destructor virtual y sus trampas.',
    't4': 'std::thread, condiciones de carrera, mutex, interbloqueo y tareas periódicas.',
    't5': 'Variables condición y monitores: cómo resolver el ejercicio de concurrencia.',
    't6': 'Ejecutivo cíclico, prioridades fijas (RM), inversión de prioridad y EDF.',
    't7': 'Números reales en el ordenador y los casos del misil Patriot y Mars Pathfinder.',
    'practicas': 'Las tres prácticas explicadas: colecciones, objetos y concurrencia.',
    'examenes': 'Exámenes reales resueltos paso a paso, con código verificado.',
    'hojas': 'Hojas de problemas resueltas: cálculo, conjuntos y cadenas, clases.',
    'demos': 'Demostraciones de planificación: Liu–Layland, EDF, techo de prioridad…',
    'auto': 'Test con corrección y tarjetas de repaso que recuerdan lo que fallas.',
    'simulacros': 'Modo examen con reloj, revisor de código y tres simulacros completos.',
    'formularios': 'Todas las fórmulas del curso en una página.',
    'glosario': 'Los términos del curso, explicados en una línea.',
    'plan': 'Cómo repartir el estudio hasta el examen.',
}
BLOQUES = [('Introducción', 'Sistemas de tiempo real', 'La idea general: qué es un sistema de tiempo real y qué se le exige.', ['t0']),
           ('C++ y objetos', 'Bloque de C++ y objetos', 'Temas 1 a 3: repaso de C y C++, clases, herencia y polimorfismo.', ['t1', 't2', 't3']),
           ('Concurrencia', 'Bloque de concurrencia', 'Temas 4 y 5: hilos, exclusión mutua, monitores y variables condición.', ['t4', 't5']),
           ('Tiempo real', 'Planificación y números', 'Temas 6 y 7: planificación de tareas y coma flotante en casos reales.', ['t6', 't7'])]
MASTER = 'guia-completa.html'
COL = {}   # sid -> color original de la guía (se rellena en write_site)
BLUE = '#2456d6'
tcs = lambda c: 'color-mix(in srgb,%s 12%%,var(--surface))' % c
esc = lambda s: html.escape(s, quote=False)

def fecha(iso):
    y, m, d = iso.split('-'); return '%d de %s de %s' % (int(d), MESES[int(m) - 1], y)

def datos(date):
    return ('Proyecto iniciado el <time datetime="%s">%s</time> · Última actualización: <time datetime="%s">%s</time>' % (START, fecha(START), date, fecha(date)))

def short(sid, title):
    t = PG[sid][4]
    if t: return t
    return re.sub(r'^T(\d) · ', r'T\1 ', title) if sid.startswith('t') and sid[1:].isdigit() else title

def href(sid, multi, frag=''):
    return PG[sid][0] + frag if multi else '#sec-' + sid if not frag else frag

def toc(secs, active, multi):
    if multi and active == 'examen': active = 'inicio'
    out = '<a class="home%s" href="%s"%s style="--tc:%s">Portada</a>' % (' cur' if active == 'home' and multi else '', 'index.html' if multi else '#top', ' aria-current="page"' if active == 'home' and multi else '', BLUE)
    g = None
    for sid, title, color, f, grp in secs:
        if multi and sid == 'examen': continue
        gname = PG[sid][1]
        if gname != g: out += '<div class="grp">%s</div>' % gname; g = gname
        cur = ' aria-current="page" class="cur"' if (multi and sid == active) else ''
        out += '<a%s href="%s" style="--tc:%s">%s</a>' % (cur, href(sid, multi), color, esc(short(sid, title) if multi or sid != 'inicio' else title))
    if multi: out += '<div class="grp">Todo junto</div><a href="%s" style="--tc:#495057">Guía completa en una sola página</a><a href="guia_tiempo_real.pdf" style="--tc:#495057">Guía en PDF (navegable)</a>' % MASTER
    return '<nav aria-label="Índice" class="toc">%s</nav>' % out

def section(sid, title, content, extra='', multi=True):
    f, grp, ci, badge, _ = PG[sid]
    is_t = sid.startswith('t') and sid[1:].isdigit()
    name = re.sub(r'^T\d · ', '', title)
    if sid == 'inicio': name = 'Empieza aquí si partes de cero'
    kick = '%s · Tema %s' % (grp, sid[1:]) if is_t else grp
    subs = re.findall(r'<h3 id="([^"]+)" data-s="1">(.*?)</h3>', content)
    otp = ''
    if len(subs) > 1:
        otp = '<div class="onthispage"><span>En esta página</span>%s</div>' % ''.join('<a href="#%s">%s</a>' % (i, re.sub('<.*?>', '', t)) for i, t in subs)
    return ('<section class="sec%s" id="sec-%s" style="--tc:%s;--tcs:%s"><div class="sh"><span aria-hidden="true" class="badge">%s</span><div class="shx"><p class="kick">%s</p><h2 id="%s">%s</h2><div class="tags"><span class="tag">%s</span></div></div></div>%s%s%s</section>'
            % (' tema' if is_t else '', sid, COL[sid], tcs(COL[sid]), badge, kick, sid, esc(name), grp, otp, content, extra))

def search_card():
    return '<div class="srch-card gs"><label class="srch-lab" for="gsrch">Buscar en toda la guía</label><input type="search" id="gsrch" placeholder="Por ejemplo: monitor, vtable, RM, Kahan, regla de cinco…" autocomplete="off" spellcheck="false"><div id="gsrch-out" class="gs-out" hidden></div></div>'

def hub(date):
    return ('<div class="hub-bar" style="max-width:1180px;margin:0 auto;padding:10px 16px 0"><a href="%s" style="display:inline-flex;align-items:center;gap:6px;font:600 13.5px/1 system-ui,sans-serif;padding:8px 12px;border-radius:999px;border:1px solid var(--line,#d3dcdf);background:var(--surface,var(--card,#fff));color:var(--fg,#18232b);text-decoration:none">← Todas las guías GIEyA</a>'
            '<p class="fecha" style="margin:6px 0 0;max-width:none;font:13px/1.45 system-ui,sans-serif;color:var(--muted,#5b6660)">%s</p></div>'
            '<button class="theme" id="theme" type="button" aria-label="Cambiar entre tema claro y oscuro">◐ Tema</button>' % (HUB_URL, datos(date)))

def footer():
    return '<p class="sitefoot">Guía no oficial de Programación de Sistemas en Tiempo Real (UPCT). Proyecto personal de estudio iniciado el <time datetime="%s">%s</time>.</p>' % (START, fecha(START))

def hero(stats, art, multi, secs):
    st = ''.join('<div><b>%s</b><span>%s</span></div>' % (n, l) for n, l in stats)
    def a(sid, label, pri=False):
        return '<a class="btn%s" href="%s">%s</a>' % (' pri' if pri else '', href(sid, multi), label)
    if multi:
        cta = a('inicio', 'Empieza por aquí', True) + a('simulacros', 'Hazte un simulacro') + a('plan', 'Plan de estudio')
        extra = ('<p class="lede hello">Guía no oficial de la UPCT para preparar la asignatura sin agobios: teoría explicada con ejemplos, '
                 'ejercicios de examen resueltos paso a paso, simuladores y tests para entrenar.</p>')
        hint = '<p class="hint">¿Tienes poco tiempo? Lee <a href="empezar.html">«Empieza aquí»</a> y haz un simulacro: con eso ya sabrás por dónde vas.</p>'
    else:
        cta = a('inicio', 'Empieza desde cero', True) + a('examen', 'El examen') + a('examenes', 'Exámenes resueltos') + a('simulacros', 'Simulacros') + a('auto', 'Autoevaluación') + a('formularios', 'Formulario')
        extra = hint = ''
    return ('<header class="hero"><div class="hero-in"><div class="hero-txt"><div class="eyebrow">UPCT · GIEyA · Programación en C++</div>'
            '<h1>Programación de Sistemas en <span>Tiempo Real</span></h1><p class="sub">Para llegar al examen con calma</p>%s<div class="stats">%s</div><div class="cta">%s</div>%s</div>'
            '<div aria-hidden="true" class="hero-art">%s<p class="art-cap">Una CPU, un reloj con plazo y tareas que se planifican: la asignatura en una imagen.</p></div></div></header>' % (extra, st, cta, hint, art))

def card(sid, title):
    f, grp, ci, badge, _ = PG[sid]
    is_t = sid.startswith('t') and sid[1:].isdigit()
    name = re.sub(r'^T\d · ', '', title) if is_t else short(sid, title)
    badge = ('T' + sid[1:]) if is_t else badge
    return ('<a class="pcard" href="%s" style="--tc:%s;--tcs:%s"><span class="badge" aria-hidden="true">%s</span><h3>%s</h3><p>%s</p><span class="go">Abrir →</span></a>'
            % (f, COL[sid], tcs(COL[sid]), badge, esc(name), esc(DESC.get(sid, ''))))

def home_main(secs):
    T = {x[0]: x[1] for x in secs}
    def grp(kick, h2, p, cards): return '<section class="hgrp"><p class="kick" style="color:var(--accent)">%s</p><h2>%s</h2><p>%s</p><div class="pcards">%s</div></section>' % (kick, h2, p, cards)
    out = search_card()
    out += grp('Empezar', 'Antes de nada', 'Qué es la asignatura y por dónde empezar.', card('inicio', T['inicio']))
    for kick, h2, p, ids in BLOQUES: out += grp(kick, h2, p, ''.join(card(i, T[i]) for i in ids))
    out += grp('Practicar', 'Practica', 'Resuelve, repasa y simula el examen.', ''.join(card(i, T[i]) for i in ['practicas', 'examenes', 'hojas', 'demos', 'auto', 'simulacros']))
    extra = ''.join('<a class="pcard" href="%s" style="--tc:#495057;--tcs:%s"><span class="badge" aria-hidden="true">%s</span><h3>%s</h3><p>%s</p><span class="go">Abrir →</span></a>' % (h, tcs('#495057'), b, t, d)
                    for h, b, t, d in [(MASTER, '≡', 'Guía completa', 'Todo el contenido en una sola página, con buscador.'), ('guia_tiempo_real.pdf', 'PDF', 'Guía en PDF', 'Versión navegable para imprimir o llevar en el móvil.')])
    out += grp('Consultar', 'Consulta rápida', 'Para tener a mano el día antes.', ''.join(card(i, T[i]) for i in ['formularios', 'glosario', 'plan']) + extra)
    return '<div style="padding-inline:0"><main class="home-main">%s</main>%s</div>' % (out, footer())

def home_page(secs, stats, art, date, js_tag, ver, TITLE):
    body = ('<body class="home" data-site="guia">%s%s<a href="#top" class="totop" id="totop" aria-label="Volver arriba">↑</a><div id="top"></div>%s%s%s</body></html>'
            % (hub(date), '', hero(stats, art, True, secs), home_main(secs), js_tag))
    return head(TITLE, 'Guía de estudio de %s: teoría, ejemplos, prácticas, vídeos y exámenes resueltos.' % TITLE, True, '', ver, None) + body

def pages_map(secs, multi):
    out = ''
    for sid, title, color, f, grp in secs:
        if sid == 'inicio': continue
        out += '<a href="%s" style="--tc:%s"><small>%s</small>%s</a>' % (href(sid, multi), color, PG[sid][1], esc(title if not (sid.startswith('t') and sid[1:].isdigit()) else title))
    if multi:
        out += ''.join('<a href="%s" style="--tc:#495057"><small>%s</small>%s</a>' % x for x in [(MASTER, 'Todo junto', 'Guía completa en una sola página'), ('guia_tiempo_real.pdf', 'PDF', 'Guía en PDF (navegable)'), ('examenes_resueltos.pdf', 'PDF', 'Exámenes resueltos en PDF'), ('hojas_resueltas.pdf', 'PDF', 'Hojas de problemas en PDF'), ('formulario_1_pagina.pdf', 'PDF', 'Formulario en una página')])
    return ('<section class="sec" style="--tc:#2456d6;--tcs:%s"><div class="sh"><span class="badge" aria-hidden="true">≡</span><div class="shx"><p class="kick">Contenido</p><h2 id="paginas">Páginas de la guía</h2></div></div><div class="pages">%s</div></section>' % (tcs(BLUE), out))

def head(title, desc, multi, css, ver, mj):
    man = ('<link rel="manifest" href="manifest.webmanifest"><link rel="icon" type="image/png" sizes="192x192" href="icon-192.png"><link rel="apple-touch-icon" href="apple-touch-icon.png">' if multi else '')
    fonts = ('<link href="https://fonts.googleapis.com" rel="preconnect"/><link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>'
             '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&amp;family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&amp;family=IBM+Plex+Mono:wght@400;500&amp;display=swap" rel="stylesheet"/>')
    css_tag = '<link rel="stylesheet" href="assets/styles.css?v=%s">' % ver if multi else '<style>%s</style>' % css
    return ('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>%s</title><meta name="description" content="%s">'
            '<meta name="theme-color" content="#2456d6">%s<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Tiempo real">%s%s%s'
            '<style>html{-webkit-text-size-adjust:100%%}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style></head>' % (html.escape(title), html.escape(desc), man, fonts, katex_tag(multi, ver), css_tag))

_KB64 = {}
def katex_tag(multi, ver=''):
    """Hoja de estilos de KaTeX: enlazada en el sitio multipágina, incrustada (con las fuentes) en la guía de una sola página."""
    if multi: return '<link rel="stylesheet" href="assets/katex.css%s">' % (('?v=' + ver) if ver else '')
    if 'c' not in _KB64:
        import base64
        d = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'katex')
        css = open(os.path.join(d, 'katex.css'), encoding='utf-8').read()
        css = re.sub(r'url\(fonts/([^)]+\.woff2)\)', lambda m: 'url(data:font/woff2;base64,%s)' % base64.b64encode(open(os.path.join(d, 'fonts', m.group(1)), 'rb').read()).decode(), css)
        _KB64['c'] = '<style>' + css + '</style>'
    return _KB64['c']

MJ = None

def page(sid, title, secs, pages, content_html, extra, stats, art, date, css, js_tag, ver, TITLE, sidx_inline=''):
    multi = True
    seq = [x for x in secs if x[0] != 'inicio']          # «inicio» y «examen» comparten página (empezar.html)
    i = [x[0] for x in seq].index(sid)
    prv = seq[i - 1] if i else None; nxt = seq[i + 1] if i + 1 < len(seq) else None
    lab = lambda x: short(x[0], x[1]) if x[0] == 'examen' else x[1]
    pn = ('<a class="pv" href="%s" style="--tc:%s"><small>← Anterior</small><strong>%s</strong></a>' % (PG[prv[0]][0], COL[prv[0]], esc(lab(prv))) if prv else '<a class="ph" aria-hidden="true" tabindex="-1"><small>.</small><strong>.</strong></a>')
    pn += ('<a class="nx" href="%s" style="--tc:%s"><small>Siguiente →</small><strong>%s</strong></a>' % (PG[nxt[0]][0], COL[nxt[0]], esc(lab(nxt))) if nxt else '')
    pager = '<nav class="pn" aria-label="Páginas">%s</nav>' % pn
    shown = short('examen', title) if sid == 'examen' else title
    crumb = '<div class="crumb"><a href="index.html">Tiempo real</a><span class="sep">/</span><b>%s</b></div>' % esc(shown)
    main = search_card()
    if sid == 'examen': main += section('inicio', dict((x[0], x[1]) for x in secs)['inicio'], pages.get('inicio', ''), '', True)
    main += section(sid, title, content_html, extra, True) + pager
    ttl = '%s · %s' % (shown, TITLE)
    body = ('<body data-site="guia">%s%s<a href="#top" class="totop" id="totop" aria-label="Volver arriba">↑</a><div class="wrap" id="top">%s<main>%s</main></div>%s%s</body></html>'
            % (hub(date), crumb, toc(secs, sid, True), main, footer(), js_tag))
    return head(ttl, 'Guía de estudio de %s: teoría, ejemplos, prácticas, vídeos y exámenes resueltos.' % TITLE, True, css, ver, None) + body

def master(secs, pages, extras, stats, art, date, css, js, TITLE, sidx_inline):
    main = search_card() + pages_map(secs, False)
    for sid, title, color, f, grp in secs:
        main += section(sid, title, pages.get(sid, ''), extras.get(sid, ''), False)
    body = ('<body data-site="guia">%s%s<a href="#top" class="totop" id="totop" aria-label="Volver arriba">↑</a><div class="wrap" id="top">%s<main>%s%s</main></div>%s<script>%s</script></body></html>'
            % (hub(date), hero(stats, art, False, secs), toc(secs, None, False), main, footer(), sidx_inline, js))
    return head(TITLE + ' · Guía completa', 'Guía completa de %s en una sola página.' % TITLE, False, css, '', None) + body

def icons(dst):
    try:
        from PIL import Image, ImageDraw
    except Exception as e:
        print('sin iconos:', e); return
    def draw(sz, pad):
        im = Image.new('RGB', (sz, sz), '#2456d6'); d = ImageDraw.Draw(im)
        a, b = sz * pad, sz * (1 - pad)
        d.rounded_rectangle([a, a, b, b], radius=sz * .08, outline='white', width=max(3, sz // 28))
        w = b - a
        d.rectangle([a + w * .3, a + w * .3, a + w * .7, a + w * .7], fill='white')
        for k in range(3):
            o = a + w * (.38 + .12 * k)
            d.line([o, a - sz * .05, o, a], fill='white', width=max(2, sz // 40)); d.line([o, b, o, b + sz * .05], fill='white', width=max(2, sz // 40))
        return im
    draw(192, .22).save(os.path.join(dst, 'icon-192.png')); draw(512, .22).save(os.path.join(dst, 'icon-512.png'))
    draw(512, .30).save(os.path.join(dst, 'icon-maskable-512.png')); draw(180, .22).save(os.path.join(dst, 'apple-touch-icon.png'))

def write_site(site, secs, pages, extras, stats, art, date, base_css, ours_css, js, TITLE, ix_site, ix_master, master_html_out=None):
    COL.update({x[0]: x[2] for x in secs})
    shutil.rmtree(site, ignore_errors=True); os.makedirs(site)
    css = base_css + ours_css
    ver = hashlib.md5((css + js).encode()).hexdigest()[:6]
    os.makedirs(os.path.join(site, 'assets'))
    open(os.path.join(site, 'assets', 'styles.css'), 'w', encoding='utf-8').write(css)
    open(os.path.join(site, 'assets', 'app.js'), 'w', encoding='utf-8').write(js)
    open(os.path.join(site, 'assets', 'search-index.js'), 'w', encoding='utf-8').write('window.SEARCH_INDEX=%s;' % json.dumps(ix_site, ensure_ascii=False))
    js_tag = '<script src="assets/search-index.js?v=%s"></script><script src="assets/app.js?v=%s"></script>' % (ver, ver)
    open(os.path.join(site, 'index.html'), 'w', encoding='utf-8').write(home_page(secs, stats, art, date, js_tag, ver, TITLE))
    for sid, title, color, f, grp in secs:
        if sid == 'inicio': continue
        content = pages.get(sid, '')
        open(os.path.join(site, PG[sid][0]), 'w', encoding='utf-8').write(page(sid, title, secs, pages, content, extras.get(sid, ''), stats, art, date, css, js_tag, ver, TITLE))
    sidx = '<script type="application/json" id="sidx">%s</script>' % json.dumps(ix_master, ensure_ascii=False).replace('</', '<\\/')
    m = master(secs, pages, extras, stats, art, date, css, js, TITLE, sidx)
    open(os.path.join(site, MASTER), 'w', encoding='utf-8').write(m)
    open(os.path.join(site, '.nojekyll'), 'w').write('')
    man = dict(name=TITLE + ' · Guía para aprobar', short_name='Tiempo real', description='Guía de estudio de %s (UPCT): teoría, vídeos, simuladores, exámenes y ejercicios resueltos.' % TITLE, lang='es',
               start_url='./', scope='./', display='standalone', background_color='#f4f6f5', theme_color='#2456d6',
               icons=[dict(src='icon-192.png', sizes='192x192', type='image/png'), dict(src='icon-512.png', sizes='512x512', type='image/png'), dict(src='icon-maskable-512.png', sizes='512x512', type='image/png', purpose='maskable')])
    json.dump(man, open(os.path.join(site, 'manifest.webmanifest'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    core = ['./', './index.html'] + sorted(set('./' + PG[s[0]][0] for s in secs)) + ['./assets/styles.css?v=' + ver, './assets/app.js?v=' + ver, './assets/search-index.js?v=' + ver, './manifest.webmanifest', './formulario_1_pagina.pdf', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
                                                             './assets/katex.css?v=' + ver] + ['./assets/fonts/' + f for f in sorted(os.listdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'katex', 'fonts')))]
    sw = ("// Service worker: guarda la guía para usarla sin conexión.\nconst CACHE = 'tr-%s';\nconst CORE = %s;\n" % (ver, json.dumps(core)) + r"""self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, {mode: u.startsWith('http') ? 'no-cors' : 'same-origin'})).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isPage) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req, {ignoreSearch: true}).then(h => h || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
""")
    open(os.path.join(site, 'sw.js'), 'w', encoding='utf-8').write(sw)
    icons(site)
    return m
