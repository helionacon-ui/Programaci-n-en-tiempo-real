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
    'inicio': ('index.html', 'Empezar', 0, '0', 'Empieza aquí desde cero'),
    'examen': ('empezar.html', 'Empezar', 0, '?', 'El examen y cómo estudiar'),
    't0': ('tema-0.html', 'Teoría', 1, '0', None), 't1': ('tema-1.html', 'Teoría', 2, '1', None),
    't2': ('tema-2.html', 'Teoría', 3, '2', None), 't3': ('tema-3.html', 'Teoría', 4, '3', None),
    't4': ('tema-4.html', 'Teoría', 5, '4', None), 't5': ('tema-5.html', 'Teoría', 6, '5', None),
    't6': ('tema-6.html', 'Teoría', 7, '6', None), 't7': ('tema-7.html', 'Teoría', 8, '7', None),
    'practicas': ('practicas.html', 'Práctica', 7, 'P', None), 'examenes': ('examenes.html', 'Práctica', 8, 'E', None),
    'hojas': ('hojas.html', 'Práctica', 3, 'H', None), 'demos': ('demostraciones.html', 'Práctica', 8, 'D', None),
    'auto': ('autoevaluacion.html', 'Repasar', 8, 'A', None), 'simulacros': ('simulacro.html', 'Repasar', 8, 'S', None),
    'formularios': ('formulario.html', 'Repasar', 0, 'Σ', None), 'glosario': ('glosario.html', 'Repasar', 0, 'G', None),
    'plan': ('plan.html', 'Repasar', 0, '✓', None),
}
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
    out = '<a href="%s"%s style="--tc:%s">Portada</a>' % ('index.html' if multi else '#top', ' aria-current="page" class="cur"' if active == 'inicio' and multi else '', BLUE)
    g = None
    for sid, title, color, f, grp in secs:
        gname = PG[sid][1]
        if gname != g: out += '<div class="grp">%s</div>' % gname; g = gname
        cur = ' aria-current="page" class="cur"' if (multi and sid == active) else ''
        out += '<a%s href="%s" style="--tc:%s">%s</a>' % (cur, href(sid, multi), color, esc(short(sid, title)))
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
            '<p class="fecha" style="margin:6px 0 0;max-width:none;font:13px/1.45 system-ui,sans-serif;color:var(--muted,#5b6660)">%s</p></div>' % (HUB_URL, datos(date)))

def footer():
    return '<p class="inicio" style="margin:36px 0 8px;text-align:center;font-size:13px;color:var(--muted)">Guía no oficial de Programación de Sistemas en Tiempo Real (UPCT) · Proyecto iniciado el <time datetime="%s">%s</time></p>' % (START, fecha(START))

def hero(stats, art, multi, secs):
    st = ''.join('<div><b>%s</b><span>%s</span></div>' % (n, l) for n, l in stats)
    def a(sid, label, pri=False):
        return '<a class="btn%s" href="%s">%s</a>' % (' pri' if pri else '', href(sid, multi), label)
    cta = a('inicio', 'Empieza desde cero', True).replace('href="index.html"', 'href="#sec-inicio"') if multi else a('inicio', 'Empieza desde cero', True)
    cta += a('examen', 'El examen') + a('examenes', 'Exámenes resueltos') + a('simulacros', 'Simulacros') + a('auto', 'Autoevaluación') + a('formularios', 'Formulario')
    return ('<header class="hero"><div class="hero-in"><div class="hero-txt"><div class="eyebrow">UPCT · GIEyA · Programación en C++</div>'
            '<h1>Programación de Sistemas en <span>Tiempo Real</span></h1><p class="sub">Guía para aprobar</p><div class="stats">%s</div><div class="cta">%s</div></div>'
            '<div aria-hidden="true" class="hero-art">%s<p class="art-cap">Una CPU, un reloj con plazo y tareas que se planifican: la asignatura en una imagen.</p></div></div></header>' % (st, cta, art))

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
    css_tag = '<link rel="stylesheet" href="style.css?v=%s">' % ver if multi else '<style>%s</style>' % css
    return ('<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>%s</title><meta name="description" content="%s">'
            '<meta name="theme-color" content="#2456d6">%s<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Tiempo real">%s%s%s'
            '<style>html{-webkit-text-size-adjust:100%%}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style></head>' % (html.escape(title), html.escape(desc), man, fonts, mj, css_tag))

MJ = ('<script>window.MathJax={tex:{inlineMath:[["\\\\(","\\\\)"]],displayMath:[["\\\\[","\\\\]"]]},svg:{fontCache:"global"},options:{skipHtmlTags:["script","noscript","style","textarea","pre","code"]}};</script>'
      '<script async src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js"></script>')

def page(sid, title, secs, pages, content_html, extra, stats, art, date, css, js_tag, ver, TITLE, sidx_inline=''):
    multi = True
    i = [s[0] for s in secs].index(sid)
    prv = secs[i - 1] if i else None; nxt = secs[i + 1] if i + 1 < len(secs) else None
    pager = '<nav class="pager" aria-label="Páginas">%s%s</nav>' % (
        '<a href="%s"><small>← Anterior</small>%s</a>' % (PG[prv[0]][0], esc(prv[1])) if prv else '',
        '<a class="nx" href="%s"><small>Siguiente →</small>%s</a>' % (PG[nxt[0]][0], esc(nxt[1])) if nxt else '')
    name = re.sub(r'^T\d · ', '', title)
    crumb = '<div class="crumb"><a href="index.html">Tiempo real</a><span class="sep">›</span><span>%s</span><span class="sep">›</span><span>%s</span></div>' % (PG[sid][1], esc(title)) if sid != 'inicio' else ''
    main = search_card()
    if sid == 'inicio': main += pages_map(secs, True)
    main += section(sid, title, content_html, extra, True) + pager + footer()
    top = hero(stats, art, True, secs) if sid == 'inicio' else ''
    ttl = TITLE if sid == 'inicio' else '%s · %s' % (title, TITLE)
    body = ('<body data-site="guia">%s%s%s<a href="#top" class="totop" id="totop" aria-label="Volver arriba">↑</a><div class="wrap" id="top">%s<main>%s</main></div>%s</body></html>'
            % (hub(date) if sid != 'inicio' else '', crumb, top, toc(secs, sid, True), main, js_tag))
    if sid == 'inicio': body = body.replace('<body data-site="guia">', '<body data-site="guia">' + hub(date).replace('class="hub-bar"', 'class="hub-bar"'), 1)
    return head(ttl, 'Guía de estudio de %s: teoría, ejemplos, prácticas, vídeos y exámenes resueltos.' % TITLE, True, css, ver, MJ) + body

def master(secs, pages, extras, stats, art, date, css, js, TITLE, sidx_inline):
    main = search_card() + pages_map(secs, False)
    for sid, title, color, f, grp in secs:
        main += section(sid, title, pages.get(sid, ''), extras.get(sid, ''), False)
    body = ('<body data-site="guia">%s%s<a href="#top" class="totop" id="totop" aria-label="Volver arriba">↑</a><div class="wrap" id="top">%s<main>%s%s</main></div>%s<script>%s</script></body></html>'
            % (hub(date), hero(stats, art, False, secs), toc(secs, None, False), main, footer(), sidx_inline, js))
    return head(TITLE + ' · Guía completa', 'Guía completa de %s en una sola página.' % TITLE, False, css, '', MJ) + body

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
    open(os.path.join(site, 'style.css'), 'w', encoding='utf-8').write(css)
    open(os.path.join(site, 'app.js'), 'w', encoding='utf-8').write(js)
    open(os.path.join(site, 'search-index.js'), 'w', encoding='utf-8').write('window.SEARCH_INDEX=%s;' % json.dumps(ix_site, ensure_ascii=False))
    js_tag = '<script src="search-index.js?v=%s"></script><script src="app.js?v=%s"></script>' % (ver, ver)
    for sid, title, color, f, grp in secs:
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
    core = ['./'] + ['./' + PG[s[0]][0] for s in secs] + ['./style.css?v=' + ver, './app.js?v=' + ver, './search-index.js?v=' + ver, './manifest.webmanifest', './formulario_1_pagina.pdf', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
                                                             'https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js']
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
