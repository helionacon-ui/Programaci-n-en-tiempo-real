#!/usr/bin/env python3
"""PDFs: guía completa, versión Acrobat (solución plegable), exámenes, hojas y formulario de una página.
Uso: python3 tools/build_pdf.py [full|acrobat|examenes|hojas|formulario|all]"""
import os, sys, re, json, subprocess, shutil, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B
from dsl import parse, read, ROOT
import render_tex as T
from render_tex import RT, inline, verb, tid

OUT = os.path.join(ROOT, 'build_pdf'); os.makedirs(OUT, exist_ok=True)
DATE = B.DATE

PREAMBLE = r'''\documentclass[10pt,a4paper]{article}
\usepackage[a4paper,top=20mm,bottom=20mm,left=18mm,right=18mm,headheight=14pt]{geometry}
\usepackage{fontspec}
\setmainfont{DejaVu Sans}[Scale=0.90]
\setmonofont{DejaVu Sans Mono}[Scale=0.84,Ligatures=NoCommon]
\usepackage{amsmath,amssymb}
\usepackage{unicode-math}
\setmathfont{Latin Modern Math}
\usepackage{polyglossia}\setmainlanguage{spanish}
\usepackage[table,dvipsnames]{xcolor}
\usepackage{graphicx,float,tabularx,array,booktabs,longtable,multicol}
\usepackage{enumitem}\setlist{nosep,leftmargin=*,itemsep=1pt,topsep=2pt}
\usepackage{fvextra}
\usepackage[most]{tcolorbox}
\usepackage{fancyhdr}
\usepackage{titlesec}
\usepackage[unicode=true,colorlinks=true,linkcolor=blue!55!black,urlcolor=blue!55!black,bookmarksnumbered=true,bookmarksopen=true,bookmarksopenlevel=1,pdftitle={%(title)s},pdfauthor={Guía de estudio},pdfsubject={Programación de Sistemas en Tiempo Real},pdflang={es}]{hyperref}
\usepackage{bookmark}
%(ocg)s
\definecolor{codebar}{HTML}{6C7A89}\definecolor{outbar}{HTML}{2B8A3E}\definecolor{stmtbar}{HTML}{C2255C}
\definecolor{tblhead}{HTML}{E9EDF5}\definecolor{stepnum}{HTML}{2456D6}
\tcbset{bxbase/.style={enhanced jigsaw,breakable,boxrule=0.5pt,arc=2mm,left=2.5mm,right=2.5mm,top=1.2mm,bottom=1.2mm,fonttitle=\bfseries\small,before skip=6pt,after skip=6pt,coltitle=black}}
\tcbset{bxblue/.style={bxbase,colback=blue!4,colframe=blue!50!black,colbacktitle=blue!12},
 bxamber/.style={bxbase,colback=yellow!10,colframe=orange!70!black,colbacktitle=yellow!25},
 bxviolet/.style={bxbase,colback=violet!4,colframe=violet!60!black,colbacktitle=violet!12},
 bxgray/.style={bxbase,colback=black!3,colframe=black!45,colbacktitle=black!10},
 bxred/.style={bxbase,colback=red!5,colframe=red!60!black,colbacktitle=red!12},
 bxgreen/.style={bxbase,colback=green!5,colframe=green!45!black,colbacktitle=green!14},
 bxteal/.style={bxbase,colback=teal!5,colframe=teal!60!black,colbacktitle=teal!12},
 bxenun/.style={bxbase,colback=white,colframe=black!60,colbacktitle=black!8}}
\setcounter{secnumdepth}{2}\setcounter{tocdepth}{2}
\titleformat{\section}{\Large\bfseries\color{stepnum}}{\thesection}{0.6em}{}[\vspace{-2pt}\titlerule]
\titleformat{\subsection}{\large\bfseries}{\thesubsection}{0.6em}{}
\titleformat{\subsubsection}{\normalsize\bfseries\color{black!75}}{}{0pt}{}
\titleformat{\paragraph}[block]{\normalsize\bfseries}{}{0pt}{}
\titlespacing*{\section}{0pt}{14pt}{8pt}\titlespacing*{\subsection}{0pt}{12pt}{5pt}\titlespacing*{\subsubsection}{0pt}{10pt}{4pt}\titlespacing*{\paragraph}{0pt}{8pt}{3pt}
\pagestyle{fancy}\fancyhf{}\fancyhead[L]{\small\color{black!60}Programación de Sistemas en Tiempo Real}\fancyhead[R]{\small\color{black!60}\leftmark}
\fancyfoot[L]{\small\color{black!60}Última actualización: %(date)s}\fancyfoot[R]{\small\thepage}
\renewcommand{\sectionmark}[1]{\markboth{#1}{}}
\setlength{\parskip}{4pt}\setlength{\parindent}{0pt}\emergencystretch=3em\sloppy
'''

def preamble(acrobat, title=B.TITLE):
    return PREAMBLE % dict(title=title, date=DATE, ocg='\\usepackage{ocgx2}' if acrobat else '')

class RTX(RT):
    def __init__(self, exams, acrobat=False):
        super().__init__(acrobat); self.exams = exams
    def node(self, n):
        if n['t'] == 'stmt':
            e = next(x for x in self.exams if B.exkey(x) == n['key']); it = next(i for i in e['items'] if i['n'] == n['n'])
            return verb(it['text'], 'stmt', 'Enunciado')
        return super().node(n)

def stats_tex(exams):
    rec = [e for e in exams if e['curso'] >= '2022-23']
    def count(es):
        c = collections.Counter()
        for e in es:
            for it in e['items']:
                if it['tema'] != 'otros': c[it['tema']] += 1
        return c
    ca, cr = count(exams), count(rec)
    ta = sum(ca.values())
    rows = ' \\\\ \\hline\n'.join('%s & %d & %d\\,\\%% & %d & %d' % (inline(B.TEMA_NAMES[k]), ca[k], round(100 * ca[k] / ta), cr[k], ca[k] - cr[k]) for k in B.TEMA_ORDER)
    return ('\\noindent{\\small\\renewcommand{\\arraystretch}{1.25}\\begin{tabularx}{\\linewidth}{|X|r|r|r|r|}\\hline\n\\rowcolor{tblhead}\\textbf{Tema} & \\textbf{Ejercicios} & \\textbf{Peso} & \\textbf{Desde 2022-23} & \\textbf{Antes} \\\\ \\hline\n%s \\\\ \\hline\n\\end{tabularx}}\n\n'
            '{\\scriptsize Conteo automático por palabras clave sobre los %d ejercicios con enunciado de los exámenes; cada ejercicio cuenta una vez, en su tema principal. Es una estimación, no una estadística oficial.}\n\n') % (rows, ta)

def render_files(rt, files):
    out = []
    for f in files:
        p = B.C(f)
        if os.path.exists(p): out.append(rt.render(parse(read(p))))
    return ''.join(out)

def exam_tex(rt, exams, solved, include_all=True):
    rt.sec = 'examenes'
    byexam = {}
    for m in solved: byexam.setdefault(m.get('exam', ''), []).append(m)
    s = '\\subsection{Empieza por aquí}\nLos más recientes y los que mejor reflejan el examen actual (POO 70 \\%, concurrencia 30 \\%). Empieza por el primero y ve hacia atrás.\n\n'
    for k in ['mayo26', 'junio26', 'mayo25', 'junio25']:
        e = next((x for x in exams if B.exkey(x) == k), None)
        if not e: continue
        s += '\\paragraph{%s}\n\\begin{itemize}\n' % inline(e['label'])
        s += ''.join('\\item \\hyperlink{%s}{%s} --- \\emph{%s}\n' % (tid(m['id']), inline(m['title']), inline(B.TEMA_NAMES.get(m.get('tema', '').split(',')[0].strip(), ''))) for m in byexam.get(k, [])) or '\\item (enunciado en la lista completa)\n'
        s += '\\end{itemize}\n'
    s += '\\subsection{Practicar por tema}\nEjercicios resueltos paso a paso, agrupados por tema. Los exámenes sin resolución completa están en la lista de enunciados.\n\n'
    for t in B.TEMA_ORDER:
        ms = [m for m in solved if m.get('tema', '').split(',')[0].strip() == t]
        if not ms: continue
        s += '\\paragraph{%s}\n\\begin{itemize}\n' % inline(B.TEMA_NAMES[t])
        s += ''.join('\\item \\hyperlink{%s}{%s} (%s)\n' % (tid(m['id']), inline(m['title']), inline(next((e['label'] for e in exams if B.exkey(e) == m.get('exam')), ''))) for m in ms)
        s += '\\end{itemize}\n'
    if include_all:
        s += '\\subsection{Buscar un examen: enunciados por curso}\nTodos los exámenes del material, agrupados por curso. Los marcados con «resuelto» tienen resolución paso a paso más abajo.\n\n'
        for c in sorted({e['curso'] for e in exams}, reverse=True):
            s += '\\subsubsection{Curso %s}\n' % c
            for e in [x for x in exams if x['curso'] == c]:
                k = B.exkey(e); ms = byexam.get(k, [])
                s += '\\hypertarget{exam-%s}{}\\paragraph{%s \\,--\\, %d ejercicios%s}\n' % (tid(k), inline(e['label']), len(e['items']), ' (resuelto)' if ms else '')
                if e['intro']: s += '\\emph{%s}\n\n' % inline(re.sub(r'\s+', ' ', e['intro']))
                if ms: s += '\\textbf{Resuelto en la guía:} ' + ' · '.join('\\hyperlink{%s}{%s}' % (tid(m['id']), inline(m['title'])) for m in ms) + '\n\n'
                for it in e['items']:
                    s += '\\noindent\\textbf{Ejercicio %d} {\\small\\color{black!60}(%s)}\\par\\nopagebreak\n%s' % (it['n'], inline(B.TEMA_NAMES.get(it['tema'], '')), verb(it['text'], 'stmt'))
    s += '\\subsection{Resoluciones paso a paso}\n' + render_files(rt, B.EXAM_FILES)
    return s

def collect_solved():
    solved = []
    for f in B.EXAM_FILES:
        p = B.C(f)
        if os.path.exists(p):
            for n in parse(read(p)):
                if n['t'] == 'ex': solved.append(n['meta'])
    return solved

def build_sections(rt, exams, only=None):
    solved = collect_solved(); body = {}
    rt.stats_hook = lambda: stats_tex(exams)
    for sid, title, color, f, g in B.SECS:
        if only and sid not in only: continue
        rt.sec = sid
        if sid == 'examenes': body[sid] = exam_tex(rt, exams, solved, include_all=True)
        elif f: body[sid] = render_files(rt, [f])
    return body

def derived(rt, only=None):
    d = {}
    for f in ['quiz.md', 'glosario.md', 'plan.md']:
        p = B.C(f)
        if os.path.exists(p): rt.sec = 'auto'; rt.render(parse(read(p)))
    # autoevaluación
    out = '\\subsection{Test con corrección}\nResponde primero sin mirar; luego comprueba la respuesta y la explicación.\n\n'
    for i, q in enumerate(rt.quiz, 1):
        a = q[:-1]; idx = len(a) - 2; opts, ok = a[1:idx], int(a[idx]); ex = a[idx + 1]
        blk = '\\begin{tcolorbox}[bxgray,title={%d. %s}]\n\\begin{itemize}[label={}]\n%s\\end{itemize}\n' % (i, inline(a[0]), ''.join('\\item \\textbf{%s)} %s\n' % ('abcdefgh'[j], inline(o)) for j, o in enumerate(opts)))
        sol = '\\par\\smallskip\\textbf{Respuesta: %s).} %s\n' % ('abcdefgh'[ok - 1], inline(ex))
        if rt.acrobat:
            ids, w = rt.ocg_wrap([sol])
            blk += '\\switchocg{%s}{\\fcolorbox{stepnum}{white}{\\scriptsize\\ Mostrar / ocultar respuesta\\ }}\n%s' % (ids[0], w)
        else: blk += sol
        out += blk + '\\end{tcolorbox}\n'
    out += '\\subsection{Tarjetas de repaso}\n\\begin{longtable}{|>{\\raggedright\\arraybackslash}p{0.38\\linewidth}|>{\\raggedright\\arraybackslash}p{0.54\\linewidth}|}\\hline\n\\rowcolor{tblhead}\\textbf{Pregunta} & \\textbf{Respuesta} \\\\ \\hline\\endhead\n'
    out += ' \\\\ \\hline\n'.join('%s & %s' % (inline(c[0]), inline(c[1])) for c in rt.cards) + ' \\\\ \\hline\n\\end{longtable}\n'
    d['auto'] = out
    fs = ''
    for sid, title, color, f, g in B.SECS:
        bs = [x for x in rt.formulas if x[0] == sid]
        if bs: fs += '\\subsection{%s}\n' % inline(title) + ''.join('\\begin{tcolorbox}[bxblue,title={%s}]\n%s\\end{tcolorbox}\n' % (inline(x[1]), x[2]) for x in bs)
    d['formularios'] = 'Las fórmulas clave de cada tema, juntas. En el archivo aparte tienes una versión de una página para imprimir.\n\n' + fs
    gl = sorted(rt.gl, key=lambda x: B.nrm(x[0]))
    d['glosario'] = '\\begin{description}[leftmargin=*,style=nextline]\n' + ''.join('\\item[%s] %s\n' % (inline(g[0]), inline(g[1])) for g in gl) + '\\end{description}\n'
    d['plan'] = '\\subsection{Plan por semanas}\n' + ''.join('\\paragraph{%s}\n%s\n\n' % (inline(it[0]), inline(it[1])) for it in rt.plan)
    d['_checks'] = '\\subsection{Tu progreso}\nMarca a mano lo que vayas terminando (la versión web lo guarda sola).\n\\begin{itemize}[label=$\\square$]\n' + ''.join('\\item %s\n' % inline(c[1]) for c in rt.checks) + '\\end{itemize}\n'
    return d

TITLEPAGE = r'''\begin{titlepage}
\thispagestyle{empty}
\vspace*{1cm}
{\color{stepnum}\rule{\linewidth}{2pt}}\par\vspace{6mm}
{\fontsize{30}{34}\selectfont\bfseries Programación de Sistemas\\[2mm] en Tiempo Real\par}\vspace{6mm}
{\Large Guía de estudio completa\par}\vspace{3mm}
{\large Teoría desde cero, prácticas, exámenes resueltos, demostraciones, autoevaluación y simulacros\par}\vspace{8mm}
{\color{stepnum}\rule{\linewidth}{2pt}}\par\vspace{1.2cm}
%(variant)s\par\vspace{6mm}
%(cover)s\par\vspace{6mm}
{\small Los simuladores interactivos están en la versión web de la guía; aquí aparecen como capturas.\par}
\vfill
{\small Última actualización: %(date)s\par}
\end{titlepage}
'''

def doc(body, acrobat=False, variant='', title=B.TITLE, toc=True):
    d = preamble(acrobat, title) + '\\begin{document}\n'
    d += TITLEPAGE % dict(date=DATE, variant=variant, cover='\\centering\\includegraphics[width=\\linewidth,height=7.5cm,keepaspectratio]{%s}' % T.fig_pdf('portada'))
    if toc: d += '\\tableofcontents\\clearpage\n'
    return d + body + '\\end{document}\n'

def compile_tex(name, tex, runs=2):
    p = os.path.join(OUT, name + '.tex'); open(p, 'w', encoding='utf-8').write(tex)
    for i in range(runs):
        r = subprocess.run(['xelatex', '-interaction=nonstopmode', '-halt-on-error', name + '.tex'], cwd=OUT, capture_output=True, text=True)
        if r.returncode != 0:
            log = open(os.path.join(OUT, name + '.log'), encoding='utf-8', errors='ignore').read()
            i0 = log.find('\n!'); print('ERROR', name, log[i0:i0 + 1500]); return False
    print('OK', name, os.path.getsize(os.path.join(OUT, name + '.pdf')) // 1024, 'KB')
    return True

def main(which):
    exams = B.norm_exams(json.load(open(B.C('exams_index.json'), encoding='utf-8')))
    if which in ('full', 'acrobat', 'all'):
        for acro in ([False, True] if which == 'all' else [which == 'acrobat']):
            rt = RTX(exams, acro)
            body = build_sections(rt, exams)
            d = derived(rt)
            parts = []
            for sid, title, color, f, g in B.SECS:
                b = body.get(sid, d.get(sid, ''))
                extra = d['_checks'] if sid == 'inicio' else ''
                parts.append('\\section{%s}\n\\hypertarget{sec-%s}{}%s%s\n\\clearpage\n' % (inline(title), sid, b, extra))
            variant = 'Versión para Acrobat: pulsa «Mostrar / ocultar» para abrir o cerrar cada solución.' if acro else 'Versión completa con todas las soluciones visibles.'
            compile_tex('guia_tiempo_real_acrobat' if acro else 'guia_tiempo_real', doc(''.join(parts), acro, variant), runs=3)
    if which in ('examenes', 'all'):
        rt = RTX(exams, False); body = build_sections(rt, exams, only={'examenes'})
        compile_tex('examenes_resueltos', doc('\\section{Exámenes resueltos}\n' + body['examenes'], False, 'Exámenes del material con su resolución paso a paso.', B.TITLE + ' · Exámenes resueltos'), runs=3)
    if which in ('hojas', 'all'):
        rt = RTX(exams, False); body = build_sections(rt, exams, only={'hojas'})
        compile_tex('hojas_resueltas', doc('\\section{Hojas de problemas resueltas}\n' + body['hojas'], False, 'Hojas de problemas resueltas paso a paso.', B.TITLE + ' · Hojas resueltas'), runs=3)
    if which in ('formulario', 'all'):
        rt = RTX(exams, False); build_sections(rt, exams)
        for size in ['\\scriptsize', '\\tiny']:
            blocks = ''
            for sid, title, color, f, g in B.SECS:
                bs = [x for x in rt.formulas if x[0] == sid]
                if bs: blocks += '\\noindent{\\bfseries\\color{stepnum}%s}\\par\n' % inline(title) + ''.join('{\\bfseries %s}\\par\n%s\\smallskip\n' % (inline(x[1]), x[2]) for x in bs)
            d = preamble(False, B.TITLE + ' · Formulario').replace('top=20mm,bottom=20mm,left=18mm,right=18mm', 'top=9mm,bottom=11mm,left=8mm,right=8mm').replace('\\pagestyle{fancy}', '\\pagestyle{empty}\\def\\fancy{}')
            d += '\\begin{document}\n\\pagestyle{empty}\n{\\Large\\bfseries Formulario · Programación de Sistemas en Tiempo Real}\\hfill{\\scriptsize %s}\\par\\smallskip\n' % DATE
            d += '%s\\setlength{\\parskip}{1pt}\\setlist{nosep,leftmargin=*,itemsep=0pt,topsep=0pt}\\begin{multicols}{3}\n%s\\end{multicols}\n\\end{document}\n' % (size, blocks)
            compile_tex('formulario_1_pagina', d, runs=1)
            from pypdf import PdfReader
            n = len(PdfReader(os.path.join(OUT, 'formulario_1_pagina.pdf')).pages); print('formulario páginas:', n, size)
            if n == 1: break

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'full')
