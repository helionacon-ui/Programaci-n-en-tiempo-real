"""Figuras SVG propias (sin librerías). Usan variables CSS para el modo claro/oscuro."""
from sched import simulate
import html

PAL = ['#2f7dd1', '#d1642f', '#2fa36b', '#9a4fc7', '#c9a227', '#d12f6a']

def svg(w, h, body, label=''):
    return ('<svg viewBox="0 0 %d %d" role="img" aria-label="%s" class="svgfig" xmlns="http://www.w3.org/2000/svg">%s</svg>'
            % (w, h, html.escape(label), body))

def rect(x, y, w, h, fill='none', stroke='var(--fg)', sw=1, rx=4, extra=''):
    return '<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s" stroke="%s" stroke-width="%s" %s/>' % (x, y, w, h, rx, fill, stroke, sw, extra)

def text(x, y, s, size=13, anchor='start', fill='var(--fg)', weight='normal', mono=False):
    fam = 'ui-monospace,Menlo,Consolas,monospace' if mono else 'inherit'
    return '<text x="%s" y="%s" font-size="%s" text-anchor="%s" fill="%s" font-weight="%s" font-family="%s">%s</text>' % (x, y, size, anchor, fill, weight, fam, html.escape(s))

def line(x1, y1, x2, y2, stroke='var(--fg)', sw=1.5, dash='', arrow=False):
    return '<line x1="%s" y1="%s" x2="%s" y2="%s" stroke="%s" stroke-width="%s" %s %s/>' % (
        x1, y1, x2, y2, stroke, sw, ('stroke-dasharray="%s"' % dash) if dash else '', 'marker-end="url(#ah)"' if arrow else '')

DEFS = '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--fg)"/></marker></defs>'

def fig_mem():
    b = DEFS
    b += rect(20, 10, 240, 330, 'var(--bg2)') + text(140, 30, 'Memoria del proceso', 14, 'middle', weight='bold')
    segs = [('Código (instrucciones)', 50, 50, '#6c7a89'), ('Datos estáticos: globales y static', 105, 50, '#2fa36b'),
            ('Montículo (heap) ↓ crece', 160, 80, '#d1642f'), ('(memoria libre)', 245, 35, 'none'), ('Pila (stack) ↑ crece', 285, 45, '#2f7dd1')]
    for s, y, h, c in segs:
        b += rect(40, y, 200, h, c, 'var(--fg)', 1, 3, 'fill-opacity=".35"') + text(140, y + h / 2 + 4, s, 13, 'middle')
    b += text(280, 205, 'new / delete', 12, mono=True) + line(275, 200, 245, 200, arrow=True)
    b += text(280, 312, 'variables locales,', 12) + text(280, 327, 'parámetros', 12) + line(275, 307, 245, 307, arrow=True)
    b += rect(400, 60, 250, 120, 'none') + text(525, 80, 'Stack frame de f()', 13, 'middle', weight='bold')
    for k, s in enumerate(['parámetros', 'dirección de retorno', 'variables locales']):
        b += rect(415, 92 + k * 26, 220, 22, 'var(--bg2)') + text(525, 108 + k * 26, s, 12, 'middle')
    b += rect(400, 200, 250, 130, 'none') + text(525, 220, 'std::vector<int> v{1,2,3}', 12, 'middle', mono=True)
    b += rect(415, 235, 100, 36, '#2f7dd1', extra='fill-opacity=".3"') + text(465, 258, 'v (pila)', 12, 'middle')
    b += rect(540, 235, 95, 36, '#d1642f', extra='fill-opacity=".3"') + text(588, 258, '1 2 3 (heap)', 12, 'middle')
    b += line(515, 253, 540, 253, arrow=True)
    b += text(525, 300, 'El objeto vive en la pila; los datos, en el heap.', 12, 'middle') + text(525, 316, 'Al salir del ámbito, su destructor libera el heap.', 12, 'middle')
    return svg(680, 350, b, 'Mapa de memoria de un programa en ejecución')

def fig_vec():
    b = DEFS + text(10, 20, 'push_back sobre un vector: la capacidad se duplica y los datos se copian a otra zona', 13, weight='bold')
    caps = [(1, 1), (2, 2), (3, 4), (5, 8)]
    y = 40
    for n, cap in caps:
        b += text(10, y + 20, 'size=%d  cap=%d' % (n, cap), 12, mono=True)
        for k in range(cap):
            fill = '#2f7dd1' if k < n else 'none'
            b += rect(150 + k * 38, y, 34, 30, fill, extra='fill-opacity=".45"' if k < n else '')
        y += 48
    b += text(10, y + 10, 'Al crecer (cap 4 → 8) se reserva memoria nueva, se copian los 4 elementos y se libera la vieja:', 12)
    b += text(10, y + 28, 'los punteros, referencias e iteradores a elementos del vector antiguo quedan INVALIDADOS.', 12, fill='#d1642f', weight='bold')
    return svg(520, y + 44, b, 'Crecimiento de un vector')

def fig_herencia():
    b = DEFS
    b += rect(220, 10, 210, 70, 'var(--bg2)') + text(325, 32, 'C_Figura  «abstracta»', 13, 'middle', weight='bold')
    b += text(325, 52, '+ virtual area() = 0', 12, 'middle', mono=True) + text(325, 68, '+ virtual ~C_Figura()', 12, 'middle', mono=True)
    for x, nm, mt in [(20, 'C_Circulo', 'area() override'), (240, 'C_Rectangulo', 'area() override'), (460, 'C_Agrupacion', 'area() override')]:
        b += rect(x, 150, 180, 60, 'var(--bg2)') + text(x + 90, 172, nm, 13, 'middle', weight='bold') + text(x + 90, 194, mt, 12, 'middle', mono=True)
        b += line(x + 90, 150, 325, 82, arrow=True)
    b += line(550, 210, 550, 245, dash='4 3') + rect(460, 245, 180, 30, 'none', extra='stroke-dasharray="4 3"') + text(550, 265, 'contiene vector<C_Figura*>', 12, 'middle')
    b += text(325, 300, 'La flecha vacía significa «es un»: un C_Circulo ES una C_Figura (principio de Liskov).', 12, 'middle')
    return svg(660, 315, b, 'Jerarquía de herencia de figuras')

def fig_vtable():
    b = DEFS
    b += text(10, 20, 'Enlace dinámico: C_Persona* p = &estudiante; p->to_string();', 13, weight='bold', mono=True)
    b += rect(20, 40, 160, 90, 'var(--bg2)') + text(100, 60, 'objeto C_Estudiante', 12, 'middle', weight='bold')
    b += rect(30, 70, 140, 24, '#9a4fc7', extra='fill-opacity=".3"') + text(100, 87, 'vptr', 12, 'middle', mono=True)
    b += rect(30, 98, 140, 24, 'none') + text(100, 115, 'nombre_, univ_', 12, 'middle', mono=True)
    b += line(170, 82, 330, 82, arrow=True)
    b += rect(330, 40, 250, 110, 'var(--bg2)') + text(455, 60, 'tabla virtual de C_Estudiante', 12, 'middle', weight='bold')
    b += rect(340, 72, 230, 24, 'none') + text(455, 89, 'to_string → C_Estudiante::to_string', 12, 'middle', mono=True)
    b += rect(340, 100, 230, 24, 'none') + text(455, 117, '~C_Persona → C_Estudiante::~', 12, 'middle', mono=True)
    b += text(10, 190, 'Sin virtual no hay vptr: el compilador decide en compilación mirando el tipo del puntero (enlace estático).', 12)
    b += text(10, 210, 'Con virtual y puntero/referencia: se decide en ejecución mirando el objeto real (enlace dinámico).', 12)
    return svg(600, 225, b, 'Tabla virtual')

def fig_race():
    b = DEFS + text(10, 18, 'x = x + 2 son 3 instrucciones máquina; dos hilos pueden intercalarlas y perder un incremento', 13, weight='bold')
    b += text(40, 52, 'Hilo 1', 13, weight='bold') + text(40, 92, 'Hilo 2', 13, weight='bold') + text(40, 140, 'x', 13, weight='bold', mono=True)
    ops = [('LOAD', 0, 0), ('ADD', 1, 0), ('STORE', 4, 0), ('LOAD', 1, 1), ('ADD', 2, 1), ('STORE', 3, 1)]
    # intercalado: H1 LOAD(0) H2 LOAD(1) H1 ADD(2) H2 ADD(3) H1 STORE(4) H2 STORE(5)
    seq = [(0, 'LOAD x→R'), (1, 'LOAD x→R'), (0, 'R+=2'), (1, 'R+=2'), (0, 'STORE R→x'), (1, 'STORE R→x')]
    xs = [0, 0, 0, 0, 2, 2]
    for k, (h, nm) in enumerate(seq):
        x0 = 100 + k * 90
        col = '#2f7dd1' if h == 0 else '#d1642f'
        b += rect(x0, 36 + h * 40, 84, 28, col, extra='fill-opacity=".4"') + text(x0 + 42, 55 + h * 40, nm, 11, 'middle', mono=True)
        b += text(x0 + 42, 144, str(xs[k]), 13, 'middle', mono=True)
    b += text(100, 175, 'Resultado final x = 2 (esperábamos 4). Condición de carrera: el resultado depende del intercalado.', 12, fill='#d1642f', weight='bold')
    return svg(660, 190, b, 'Condición de carrera')

def gantt(tasks, policy, horizon, title, B=None):
    tl, misses, resp = simulate(tasks, policy, horizon)
    names = [t['name'] for t in tasks]
    order = sorted(names, key=lambda n: next((t['T'] if policy == 'RM' else t['D']) for t in tasks if t['name'] == n))
    u = 22
    W = 70 + horizon * u + 20
    b = DEFS + text(10, 18, title, 13, weight='bold')
    for r, n in enumerate(order):
        y = 40 + r * 40
        b += text(8, y + 20, n, 13, weight='bold')
        b += line(60, y + 28, 60 + horizon * u, y + 28, 'var(--muted)', 1)
        tk = next(t for t in tasks if t['name'] == n)
        for t0 in range(0, horizon, tk['T']):
            b += line(60 + t0 * u, y + 28, 60 + t0 * u, y - 4, 'var(--fg)', 1.2, arrow=True)
        for t in range(horizon):
            if tl[t] == n:
                b += rect(60 + t * u, y, u, 28, PAL[names.index(n) % len(PAL)], 'var(--bg)', 1, 2, 'fill-opacity=".8"')
    yb = 40 + len(order) * 40
    for t in range(0, horizon + 1, 5 if horizon > 30 else 1):
        b += text(60 + t * u, yb + 8, str(t), 10, 'middle', fill='var(--muted)')
    H = yb + 22
    return svg(W, H, b, title), tl, misses, resp

def fig_gantt_rm():
    ts = [dict(name='τ1', C=3, T=7, D=7), dict(name='τ2', C=3, T=12, D=12), dict(name='τ3', C=5, T=20, D=20)]
    s, tl, miss, resp = gantt(ts, 'RM', 40, 'Planificación RM, 3 tareas (C,T) = (3,7), (3,12), (5,20); flechas = activaciones')
    return s

def fig_inversion():
    u = 28; b = DEFS + text(10, 18, 'Inversión de prioridad: t_alta espera a t_baja, pero t_media se cuela', 13, weight='bold')
    rows = [('t_alta', 0), ('t_media', 1), ('t_baja', 2)]
    for n, r in rows: b += text(8, 62 + r * 44, n, 12, weight='bold') + line(70, 76 + r * 44, 70 + 16 * u, 76 + r * 44, 'var(--muted)', 1)
    def blk(r, a, c, col, lab=''):
        return rect(70 + a * u, 48 + r * 44, (c - a) * u, 28, col, 'var(--bg)', 1, 2, 'fill-opacity=".8"') + (text(70 + (a + c) * u / 2, 66 + r * 44, lab, 11, 'middle') if lab else '')
    b += blk(2, 0, 2, '#2fa36b', 'mutex') + blk(0, 2, 2.5, '#c9a227')  # alta activa en 2, intenta mutex
    b += blk(1, 2, 8, '#d1642f', 't_media ejecuta') + blk(2, 8, 10, '#2fa36b', 'mutex') + blk(0, 10, 13, '#2f7dd1', 'alta')
    b += line(70 + 2 * u, 40, 70 + 2 * u, 70, 'var(--fg)', 1.2, dash='3 3') + text(70 + 2 * u, 36, 'alta bloquea', 11, 'middle')
    b += text(10, 230, 'Con herencia de prioridad, t_baja ejecutaría a prioridad de t_alta y t_media no la interrumpiría (caso Mars Pathfinder, 1997).', 12)
    for t in range(0, 15, 2): b += text(70 + t * u, 205, str(t), 10, 'middle', fill='var(--muted)')
    return svg(70 + 16 * u + 20, 250, b, 'Inversión de prioridad')

def fig_monitor():
    b = DEFS + rect(120, 20, 330, 190, 'var(--bg2)') + text(285, 42, 'Monitor (clase)', 14, 'middle', weight='bold')
    b += rect(140, 55, 130, 56, 'none') + text(205, 78, 'datos privados', 12, 'middle') + text(205, 96, 'vector, contadores…', 11, 'middle', fill='var(--muted)')
    b += rect(290, 55, 140, 26, '#2f7dd1', extra='fill-opacity=".3"') + text(360, 73, 'mutex m_', 12, 'middle', mono=True)
    b += rect(290, 85, 140, 26, '#9a4fc7', extra='fill-opacity=".3"') + text(360, 103, 'condition_variable cv_', 10, 'middle', mono=True)
    b += rect(140, 130, 290, 60, 'none') + text(285, 150, 'métodos públicos: 1) coger m_  2) esperar con cv_.wait(lk, cond)', 10, 'middle')
    b += text(285, 170, '3) modificar datos  4) notify  5) soltar m_ (RAII)', 10, 'middle')
    for k, h in enumerate(['hilo A', 'hilo B', 'hilo C']):
        b += rect(10, 45 + k * 50, 70, 30, 'var(--bg2)') + text(45, 65 + k * 50, h, 12, 'middle') + line(80, 60 + k * 50, 120, 100, arrow=True)
    return svg(470, 225, b, 'Estructura de un monitor')

def fig_deadlock():
    b = DEFS + text(10, 18, 'Interbloqueo: cada hilo tiene un mutex y espera el del otro', 13, weight='bold')
    b += rect(40, 60, 90, 36, '#2f7dd1', extra='fill-opacity=".35"') + text(85, 83, 'hilo 1', 13, 'middle')
    b += rect(300, 60, 90, 36, '#d1642f', extra='fill-opacity=".35"') + text(345, 83, 'hilo 2', 13, 'middle')
    b += rect(40, 170, 90, 36, 'none') + text(85, 193, 'mutex A', 13, 'middle', mono=True)
    b += rect(300, 170, 90, 36, 'none') + text(345, 193, 'mutex B', 13, 'middle', mono=True)
    b += line(75, 170, 75, 98, arrow=True) + text(10, 135, 'tiene', 11)
    b += line(355, 170, 355, 98, arrow=True) + text(360, 135, 'tiene', 11)
    b += line(130, 78, 300, 188, dash='5 4', arrow=True) + line(300, 78, 130, 188, dash='5 4', arrow=True)
    b += text(215, 135, 'esperan', 11, 'middle', fill='#d1642f')
    b += text(10, 240, 'Solución: coger SIEMPRE en el mismo orden, o std::lock / std::scoped_lock con todos a la vez.', 12)
    return svg(420, 255, b, 'Interbloqueo')

def fig_cyc():
    ts = [dict(name='A', C=1, T=4, D=4), dict(name='B', C=2, T=8, D=8)]
    u = 32; b = DEFS + text(10, 18, 'Ejecutivo cíclico: ciclo principal Tm = mcm(T) = 8, ciclos secundarios Ts = 4', 13, weight='bold')
    for k in range(3): b += line(60 + k * 4 * u, 34, 60 + k * 4 * u, 100, 'var(--muted)', 1, '4 3')
    for k in range(2):
        b += rect(60 + k * 4 * u, 50, 1 * u, 26, '#2f7dd1', 'var(--bg)', 1, 2, 'fill-opacity=".8"') + text(60 + k * 4 * u + u / 2, 68, 'A', 12, 'middle')
    b += rect(60 + 1 * u, 50, 2 * u, 26, '#d1642f', 'var(--bg)', 1, 2, 'fill-opacity=".8"') + text(60 + 2 * u, 68, 'B', 12, 'middle')
    b += text(60 + 2 * u, 112, 'ciclo secundario 1', 11, 'middle', fill='var(--muted)') + text(60 + 6 * u, 112, 'ciclo secundario 2', 11, 'middle', fill='var(--muted)')
    b += text(10, 140, 'Programa secuencial: while(true){ ciclo 0: A();B();  ciclo 1: A(); sleep_until(siguiente) }', 12, mono=True)
    return svg(60 + 8 * u + 40, 155, b, 'Ejecutivo cíclico')

def fig_ciclo_vida():
    b = DEFS + text(10, 18, 'Estados de un hilo y eventos de planificación', 13, weight='bold')
    pos = {'nuevo': (20, 60), 'listo': (190, 60), 'ejecutando': (360, 60), 'bloqueado': (275, 150), 'terminado': (520, 60)}
    for k, (x, y) in pos.items():
        b += rect(x, y, 110, 36, 'var(--bg2)') + text(x + 55, y + 23, k, 13, 'middle')
    b += line(130, 78, 190, 78, arrow=True) + line(300, 70, 360, 70, arrow=True) + line(360, 86, 300, 86, arrow=True)
    b += line(470, 78, 520, 78, arrow=True) + line(380, 96, 340, 150, arrow=True) + line(285, 150, 245, 96, arrow=True)
    b += text(330, 62, 'dispatch', 10, 'middle') + text(330, 104, 'quantum/prioridad', 10, 'middle') + text(500, 70, 'fin', 10, 'middle')
    b += text(430, 130, 'lock/wait/sleep/E-S', 10, 'middle') + text(215, 130, 'notify/unlock/fin E-S', 10, 'middle')
    return svg(660, 195, b, 'Estados de hilo')


def fig_portada(art=False):
    b = DEFS + '<defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2f7dd1" stop-opacity=".30"/><stop offset="1" stop-color="#9a4fc7" stop-opacity=".22"/></linearGradient></defs>'
    b += rect(0, 0, 760, 330, 'url(#pg)', 'var(--muted)', 1, 14)
    # chip
    b += rect(48, 70, 120, 120, 'var(--bg)', 'var(--fg)', 2.5, 10)
    for k in range(5):
        b += line(66 + k * 22, 70, 66 + k * 22, 54, 'var(--fg)', 2.5) + line(66 + k * 22, 190, 66 + k * 22, 206, 'var(--fg)', 2.5)
        b += line(48, 88 + k * 22, 32, 88 + k * 22, 'var(--fg)', 2.5) + line(168, 88 + k * 22, 184, 88 + k * 22, 'var(--fg)', 2.5)
    b += rect(78, 100, 60, 60, '#2f7dd1', 'var(--fg)', 1.5, 6, 'fill-opacity=".45"') + text(108, 137, 'CPU', 18, 'middle', weight='bold')
    b += (text(108, 232, 'hilos + C++', 13, 'middle', fill='var(--muted)') if not art else '')
    # reloj
    b += '<circle cx="300" cy="130" r="58" fill="var(--bg)" stroke="var(--fg)" stroke-width="3"/>'
    for k in range(12):
        import math
        a = k * math.pi / 6
        b += line(300 + 49 * math.sin(a), 130 - 49 * math.cos(a), 300 + 55 * math.sin(a), 130 - 55 * math.cos(a), 'var(--fg)', 2)
    b += line(300, 130, 300, 90, 'var(--fg)', 3.5) + line(300, 130, 330, 142, '#d1642f', 3.5) + '<circle cx="300" cy="130" r="5" fill="var(--fg)"/>'
    b += (text(300, 232, 'plazo (deadline)', 13, 'middle', fill='var(--muted)') if not art else '')
    # gantt
    gx, gy = 410, 70
    rows = [('τ1', '#2f7dd1', [(0, 2), (5, 7), (10, 12)], [0, 5, 10]), ('τ2', '#d1642f', [(2, 5), (7, 9)], [0, 7]), ('τ3', '#2fa36b', [(9, 10), (12, 14)], [0, 12])]
    u = 22
    for r, (n, col, bl, ar) in enumerate(rows):
        y = gy + r * 44
        b += text(gx - 6, y + 22, n, 13, 'end', weight='bold') + line(gx, y + 30, gx + 15 * u, y + 30, 'var(--muted)', 1)
        for a in ar: b += line(gx + a * u, y + 30, gx + a * u, y - 4, 'var(--fg)', 1.5, arrow=True)
        for (a, c) in bl: b += rect(gx + a * u, y, (c - a) * u, 30, col, 'var(--bg)', 1, 3, 'fill-opacity=".85"')
    b += (text(gx + 7 * u, 232, 'planificación de tareas periódicas', 13, 'middle', fill='var(--muted)') if not art else '')
    if art:
        return ('<svg viewBox="0 30 760 215" role="img" aria-label="Una CPU, un reloj con plazo y un diagrama de planificación de tareas" class="svgfig" xmlns="http://www.w3.org/2000/svg">%s</svg>' % b.replace(rect(0, 0, 760, 330, 'url(#pg)', 'var(--muted)', 1, 14), ''))
    b += text(380, 275, 'Programación de Sistemas en Tiempo Real', 26, 'middle', weight='bold')
    b += text(380, 305, 'STL · clases y herencia · hilos · monitores · planificación · coma flotante', 14, 'middle', fill='var(--muted)')
    return svg(760, 330, b, 'Portada: una CPU, un reloj con plazo y un diagrama de planificación de tareas')

def fig_clase_vida():
    b = DEFS + text(10, 18, 'Ciclo de vida de un objeto y qué función especial se ejecuta en cada momento', 13, weight='bold')
    xs = [20, 190, 360, 530]
    tit = ['nace', 'se copia', 'se reasigna', 'muere']
    fn = ['constructor', 'constructor de copia\n(o de movimiento)', 'operator=\n(copia o movimiento)', 'destructor']
    ex = ['Fraccion f{1,2};', 'Fraccion g = f;', 'g = h;', '} // fin del ámbito']
    col = ['#2fa36b', '#2f7dd1', '#9a4fc7', '#d1642f']
    for k in range(4):
        b += rect(xs[k], 40, 150, 120, 'var(--bg2)', col[k], 2.5, 8) + text(xs[k] + 75, 62, tit[k], 14, 'middle', weight='bold', fill=col[k])
        for j, l in enumerate(fn[k].split('\n')): b += text(xs[k] + 75, 88 + j * 16, l, 12, 'middle')
        b += text(xs[k] + 75, 140, ex[k], 11, 'middle', mono=True, fill='var(--muted)')
        if k < 3: b += line(xs[k] + 150, 100, xs[k + 1], 100, arrow=True)
    b += rect(20, 180, 660, 62, 'none', 'var(--fg)', 1, 6)
    b += text(350, 202, 'Regla de los cinco: si escribes UNO de estos cinco, escribe (o prohíbe con =delete) los demás.', 12, 'middle', weight='bold')
    b += text(350, 221, 'destructor · constr. de copia · = de copia · constr. de movimiento · = de movimiento', 11, 'middle', mono=True)
    b += text(350, 238, 'Si la clase solo usa vector/string/unique_ptr: regla del cero (no escribas ninguno).', 11, 'middle', fill='var(--muted)')
    return svg(700, 255, b, 'Ciclo de vida de un objeto')

def fig_fork_join():
    b = DEFS + text(10, 18, 'Hilos: el principal lanza (fork) y espera (join); cada hilo avanza por su cuenta', 13, weight='bold')
    b += text(8, 62, 'main', 12, weight='bold') + line(60, 58, 580, 58, 'var(--fg)', 3)
    b += rect(150, 46, 20, 24, '#c9a227', 'var(--bg)', 1, 3) + text(160, 40, 'lanza', 10, 'middle')
    b += rect(470, 46, 20, 24, '#c9a227', 'var(--bg)', 1, 3) + text(480, 40, 'join', 10, 'middle')
    cols = ['#2f7dd1', '#d1642f', '#2fa36b']
    ends = [420, 520, 360]
    for k in range(3):
        y = 100 + k * 40
        b += text(8, y + 5, 'hilo %d' % (k + 1), 12, weight='bold') + line(160, 62, 170, y, 'var(--muted)', 1, '3 3')
        b += rect(170, y - 10, ends[k] - 170, 20, cols[k], 'var(--bg)', 1, 4, 'fill-opacity=".8"') + text((170 + ends[k]) / 2, y + 5, 'trabajo', 11, 'middle')
        b += line(ends[k], y, 480, 62, 'var(--muted)', 1, '3 3')
    b += text(10, 240, 'Sin join (ni detach) al destruir el thread: std::terminate. Datos compartidos: mutex o atomic.', 12)
    return svg(600, 255, b, 'Fork y join de hilos')

def fig_prodcons():
    b = DEFS + text(10, 18, 'Productor–consumidor con cola acotada (monitor): quién espera y por qué', 13, weight='bold')
    for k in range(2):
        b += rect(10, 50 + k * 60, 90, 38, '#2f7dd1', 'var(--bg)', 1, 6, 'fill-opacity=".4"') + text(55, 74 + k * 60, 'productor %d' % (k + 1), 12, 'middle') + line(100, 69 + k * 60, 190, 110, arrow=True)
    b += rect(190, 80, 220, 60, 'var(--bg2)', 'var(--fg)', 2, 8)
    for k in range(4):
        b += rect(200 + k * 50, 92, 40, 36, '#2fa36b' if k < 3 else 'none', 'var(--fg)', 1, 4, 'fill-opacity=".5"' if k < 3 else '')
    b += text(300, 158, 'cola de capacidad 4 (3 ocupadas)', 11, 'middle', fill='var(--muted)')
    for k in range(2):
        b += rect(500, 50 + k * 60, 90, 38, '#d1642f', 'var(--bg)', 1, 6, 'fill-opacity=".4"') + text(545, 74 + k * 60, 'consumidor %d' % (k + 1), 12, 'middle') + line(410, 110, 500, 69 + k * 60, arrow=True)
    b += text(10, 195, 'poner: wait(hay_hueco) si está llena  →  notify(hay_dato)', 12, mono=True)
    b += text(10, 215, 'sacar: wait(hay_dato) si está vacía  →  notify(hay_hueco)', 12, mono=True)
    b += text(10, 238, 'cerrar: bandera con el mutex + notify_all para que nadie se quede dormido', 12, fill='var(--muted)')
    return svg(600, 252, b, 'Productor consumidor')

def _g2(tasks, policy, horizon, title):
    return gantt(tasks, policy, horizon, title)[0]

def fig_rm_falla():
    return _g2([dict(name='τ1', C=2, T=5, D=5), dict(name='τ2', C=4, T=7, D=7)], 'RM', 15, 'RM con τ1=(C2,T5) y τ2=(C4,T7): τ2 no termina antes de t=7')

def fig_edf_ok():
    return _g2([dict(name='τ1', C=2, T=5, D=5), dict(name='τ2', C=4, T=7, D=7)], 'EDF', 15, 'EDF con las mismas tareas (U=0,971≤1): todas cumplen el plazo')

def fig_ieee():
    b = DEFS + text(10, 18, 'Formato IEEE 754: valor = (−1)^s × 1,m × 2^(e − sesgo)', 13, weight='bold')
    def barra(y, nm, parts, tot):
        x = 90; r = text(8, y + 20, nm, 13, weight='bold')
        cols = ['#d12f6a', '#c9a227', '#2f7dd1']
        for (lab, n), c in zip(parts, cols):
            w = max(24, n * 520 / tot)
            r += rect(x, y, w, 30, c, 'var(--bg)', 1, 3, 'fill-opacity=".7"') + text(x + w / 2, y + 20, lab, 11, 'middle')
            x += w
        return r
    b += barra(40, 'float', [('s 1', 1), ('exponente 8', 8), ('mantisa 23', 23)], 32)
    b += barra(90, 'double', [('s 1', 1), ('exponente 11', 11), ('mantisa 52', 52)], 64)
    b += text(10, 150, 'sesgo: 127 (float) · 1023 (double)   ·   ≈7 cifras decimales (float) · ≈15–16 (double)', 12)
    b += text(10, 175, '0,1 en binario es periódico (0,0001100110011…): se redondea → 0,1+0,2 ≠ 0,3', 12)
    b += text(10, 200, 'Épsilon de máquina: float ≈ 1,19e-7 · double ≈ 2,22e-16', 12, mono=True)
    return svg(640, 215, b, 'Formato IEEE 754')

def fig_contenedores():
    b = DEFS + text(10, 18, '¿Qué contenedor de la STL uso?', 14, weight='bold')
    bx = [('vector', 'secuencia con acceso por índice;\nel valor por defecto', '#2f7dd1'), ('map', 'clave → valor, ordenado por clave;\ncontar con ++m[k]', '#2fa36b'), ('set', 'elementos únicos y ordenados;\n¿está o no está?', '#9a4fc7'), ('unordered_map', 'clave → valor sin orden;\nbúsqueda media O(1)', '#d1642f')]
    for k, (n, d, c) in enumerate(bx):
        x = 10 + (k % 2) * 330; y = 34 + (k // 2) * 84
        b += rect(x, y, 315, 72, 'var(--bg2)', c, 2.5, 8) + text(x + 12, y + 24, n, 15, weight='bold', mono=True, fill=c)
        for j, l in enumerate(d.split('\n')): b += text(x + 12, y + 44 + j * 16, l, 12)
    b += text(10, 218, 'Recorrer y modificar: for (auto& x : v) · ordenar: sort(begin,end,lambda) · borrar: erase(remove_if(...),end)', 11, mono=True)
    return svg(660, 232, b, 'Elegir contenedor')

FIGS = dict(mem=fig_mem, vec=fig_vec, herencia=fig_herencia, vtable=fig_vtable, race=fig_race, gantt_rm=fig_gantt_rm,
            inversion=fig_inversion, monitor=fig_monitor, deadlock=fig_deadlock, cyc=fig_cyc, vida=fig_ciclo_vida,
            portada=fig_portada, portada_art=lambda: fig_portada(True), clase_vida=fig_clase_vida, fork_join=fig_fork_join, prodcons=fig_prodcons,
            rm_falla=fig_rm_falla, edf_ok=fig_edf_ok, ieee=fig_ieee, contenedores=fig_contenedores)
