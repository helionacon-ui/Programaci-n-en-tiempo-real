"""Extrae enunciados de los exámenes, limpia rastros y clasifica por tema. Salida: content/exams_index.json"""
import re, glob, json, os
W = os.path.expanduser('~/work')
META = {  # clave -> (curso, etiqueta, mes, tipo)
 '15_16__febrero2017': ('2015-16', 'Febrero 2017', 'febrero', 'final'),
 '15_16__junio2016': ('2015-16', 'Junio 2016', 'junio', 'final'),
 '15_16__septiembre2016': ('2015-16', 'Septiembre 2016', 'septiembre', 'final'),
 '16_17__feb2018': ('2016-17', 'Febrero 2018', 'febrero', 'final'),
 '16_17__junio2017': ('2016-17', 'Junio 2017', 'junio', 'final'),
 '16_17__parcial': ('2016-17', 'Parcial 2016-17', 'parcial', 'parcial'),
 '16_17__sept2017_pstr': ('2016-17', 'Septiembre 2017', 'septiembre', 'final'),
 '19_20__ejerciciosParcialPBO': ('2019-20', 'Ejercicios parcial PBO 2019-20', 'parcial', 'parcial'),
 '19_20__solucionExamenJunio_2020': ('2019-20', 'Junio 2020', 'junio', 'final'),
 '19_20__solucionExamen_sep2020': ('2019-20', 'Septiembre 2020', 'septiembre', 'final'),
 '20_21__evContinua_Parcial1_abril': ('2020-21', 'Parcial 1 abril 2021', 'abril', 'parcial'),
 '20_21__parcial2_evContinuaJunio': ('2020-21', 'Parcial 2 junio 2021', 'junio', 'parcial'),
 '20_21__solucionExamen_julio21': ('2020-21', 'Julio 2021', 'julio', 'final'),
 '20_21__solucionExamen_junio21': ('2020-21', 'Junio 2021', 'junio', 'final'),
 '21_22__solucionExamen_julio22': ('2021-22', 'Julio 2022', 'julio', 'final'),
 '21_22__solucionExamen_junio22': ('2021-22', 'Junio 2022', 'junio', 'final'),
 '21_22__solucionExamen_mayo22': ('2021-22', 'Mayo 2022', 'mayo', 'final'),
 '22_23__solucionExamen_junio23': ('2022-23', 'Junio 2023', 'junio', 'final'),
 '22_23__solucionExamen_mayo23': ('2022-23', 'Mayo 2023', 'mayo', 'final'),
 '23_24__examen_abril24': ('2023-24', 'Abril 2024', 'abril', 'final'),
 '23_24__solucionExamen_mayo24': ('2023-24', 'Mayo 2024', 'mayo', 'final'),
 '24_25__solucionExamen_junio25': ('2024-25', 'Junio 2025', 'junio', 'final'),
 '24_25__solucionExamen_mayo25': ('2024-25', 'Mayo 2025', 'mayo', 'final'),
 '25_26__solucionExamen_junio26': ('2025-26', 'Junio 2026', 'junio', 'final'),
 '25_26__solucionExamen_mayo26': ('2025-26', 'Mayo 2026', 'mayo', 'final'),
}
FOOT = re.compile(r'(LSI\s*[–-]|Departamento\s+de\s+Tecnolog|Departamento\s+Tecnolog|^\s*y las Comunicaciones|Área de Lenguajes|^\s*Nombre:|^\s*DNI:|GRADO DE INGENIER|^\s*PROGRAMACIO.?\s*N DE|^\s*DE TIEMPO|ELECTRO.\s*NICA|^\s*EXAMEN\s+\w+\s+20\d\d\s*$|EJERCICIOS DE LA ASIGNATURA)')
def norm(h):
    h = re.sub(r'\(.*?\)', '', h); h = h.replace(':', ' ').upper()
    h = re.sub(r'EJERCICIOS\b', 'EJERCICIO', h)
    return re.sub(r'\s+', ' ', h).strip()
HDR = re.compile(r'^\s*(EJERCICIOS?|PREGUNTA|CUESTIONARIO|PARCIAL)\b')
def split_stmt(lines):
    first = next((i for i, l in enumerate(lines) if HDR.match(l) and 'ASIGNATURA' not in l), None)
    end = len(lines)
    for i, l in enumerate(lines):
        if re.match(r'^\s*SOLUCI[OÓ]N', l): end = i; break
    if first is not None and end == len(lines):
        nf = norm(lines[first])
        for i in range(first + 1, len(lines)):
            if HDR.match(lines[i]) and norm(lines[i]) == nf: end = i; break
    return lines[:end]
def clean(lines):
    out = []
    for l in lines:
        if FOOT.search(l): continue
        l = l.replace('\f', '').rstrip()
        l = re.sub(r'\bDiego\b', 'Mario', l)
        out.append(l)
    txt = '\n'.join(out)
    txt = re.split(r'\n\s*Las soluciones vienen|\n\s*Consultar solo si', txt)[0]
    return re.sub(r'\n{3,}', '\n\n', txt).strip()
TOP = [('plan', r'planificaci|tiempo de respuesta|ejecutivo c[ií]clico|techo de|rate.monotonic|deadline.monotonic|herencia de prioridad|inversi[oó]n de prioridad|\bT=|\bC='),
       ('monitor', r'condition_variable|monitor|\bwait\b|notify|barrera|productor|consumidor|sem[aá]foro'),
       ('hilos', r'thread|mutex|\bhilos?\b|concurren|lock_guard|atomic'),
       ('herencia', r'herencia|virtual|abstract|polimorf|hereda|clase base|derivad|typeid'),
       ('clases', r'\bclass\b|\bclase\b|constructor|operator|destructor'),
       ('stl', r'vector|\bmap\b|\bset\b|iterator|string|stream|lambda|algorithm|templat|punter|referenc')]
def classify(t):
    t = t.lower()
    for k, rx in TOP:
        if re.search(rx, t): return k
    return 'otros'
def main():
    exams = []
    for key, (curso, label, mes, tipo) in META.items():
        f = glob.glob(W + '/txt/Exámenes*' + key + '.pdf.txt')[0]
        lines = open(f, encoding='utf-8').read().split('\n')
        st = split_stmt(lines)
        # trocear en ejercicios
        items, cur = [], []
        for l in st:
            if HDR.match(l) and not FOOT.search(l) and cur and len(''.join(cur).strip()) > 40:
                items.append(cur); cur = []
            cur.append(l)
        if cur: items.append(cur)
        intro = ''
        if items and not (items[0] and HDR.match(items[0][0])):
            intro = clean(items.pop(0))
        ex = []
        for n, it in enumerate(items, 1):
            t = clean(it)
            if len(t) < 60: continue
            ex.append(dict(n=n, text=t, tema=classify(t)))
        exams.append(dict(key=key, curso=curso, label=label, mes=mes, tipo=tipo, intro=intro, items=ex, nlines=len(st)))
    json.dump(exams, open(os.path.join(os.path.dirname(__file__), '..', 'content', 'exams_index.json'), 'w'), ensure_ascii=False, indent=1)
    from collections import Counter
    c = Counter(); tot = 0
    for e in exams:
        for it in e['items']: c[it['tema']] += 1; tot += 1
    print(tot, c.most_common())
    for e in exams: print(e['label'], len(e['items']), e['nlines'], [i['tema'] for i in e['items']])
main()
