"""Renderizador LaTeX (mismo árbol DSL que render_html). Lo usa build_pdf.py."""
import re, os, subprocess, hashlib
from figs import FIGS

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def tex_esc(s):
    out = []
    for ch in s:
        out.append({'\\': r'\textbackslash{}', '{': r'\{', '}': r'\}', '$': r'\$', '&': r'\&', '%': r'\%', '#': r'\#', '_': r'\_', '^': r'\textasciicircum{}', '~': r'\textasciitilde{}'}.get(ch, ch))
    return ''.join(out)

def code_inline(s):
    out = []
    for ch in s:
        if ch in '_,.:(<>/=;-': out.append(tex_esc(ch) + r'\allowbreak{}')
        else: out.append(tex_esc(ch))
    return r'\texttt{' + ''.join(out) + '}'

def inline(s):
    toks = []
    def stash(m):
        toks.append(m.group(0)); return '\x00%d\x00' % (len(toks) - 1)
    s = re.sub(r'`[^`]+`', stash, s)
    s = re.sub(r'\$\$.+?\$\$|\$[^$\n]+\$', stash, s)
    s = re.sub(r'\[([^\]]+)\]\((#[^)]+|https?://[^)]+)\)', stash, s)
    s = tex_esc(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'\\textbf{\1}', s)
    s = re.sub(r'(?<![\w*])\*(?![\s*])(.+?)(?<![\s*])\*(?![\w*])', r'\\emph{\1}', s)
    def back(m):
        t = toks[int(m.group(1))]
        if t.startswith('`'): return code_inline(t[1:-1])
        if t.startswith('$$'): return r'\[' + t[2:-2] + r'\]'
        if t.startswith('$'): return '$' + t[1:-1] + '$'
        mm = re.match(r'\[([^\]]+)\]\((.*)\)', t)
        label, url = mm.group(1), mm.group(2)
        if url.startswith('#'): return r'\hyperlink{%s}{%s}' % (tid(url[1:]), inline(label))
        return r'\href{%s}{%s}' % (url.replace('%', r'\%').replace('#', r'\#'), inline(label))
    prev = None
    while prev != s:
        prev = s
        s = re.sub(r'\x00(\d+)\x00', back, s)
    return s

def tid(s):  # identificador seguro para hypertarget
    return re.sub(r'[^A-Za-z0-9:.-]', '_', s)

def slug(s):
    s = s.lower()
    for a, b in zip('áéíóúüñ', 'aeiouun'): s = s.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:48]

KIND_TITLES = dict(tip='Idea clave', warn='Qué suele fallar', deep='Más a fondo', note='Nota', formula='Fórmulas clave', ojo='Ojo', intuicion='Intuición', def_='Definición')
KIND_COL = dict(tip='bxblue', warn='bxamber', deep='bxviolet', note='bxgray', formula='bxblue', ojo='bxred', intuicion='bxgreen', antes='bxteal', def_='bxgray')

def verb(text, kind='code', label=''):
    # Verbatim no admite \end{Verbatim} dentro; se sustituye
    text = text.replace('\\end{Verbatim}', '\\ end{Verbatim}').replace('\t', '    ')
    col = {'code': 'codebar', 'out': 'outbar', 'stmt': 'stmtbar'}[kind]
    lab = ('\\noindent{\\scriptsize\\color{gray}%s}\\par\\nopagebreak\n' % label) if label else ''
    return lab + '\\begin{Verbatim}[breaklines=true,breakanywhere=true,fontsize=\\footnotesize,frame=leftline,framerule=2.2pt,rulecolor=\\color{%s},framesep=3mm,xleftmargin=1mm]\n%s\n\\end{Verbatim}\n' % (col, text)

SIMSHOT = os.path.join(ROOT, 'assets', 'shots')
_figcache = {}
def fig_pdf(name):
    if name in _figcache: return _figcache[name]
    svg = FIGS[name]()
    for a, b in [('var(--fg)', '#1d2330'), ('var(--bg2)', '#eef1f6'), ('var(--bg)', '#ffffff'), ('var(--muted)', '#5b6474')]:
        svg = svg.replace(a, b)
    os.makedirs(os.path.join(ROOT, 'build_pdf', 'figs'), exist_ok=True)
    base = os.path.join(ROOT, 'build_pdf', 'figs', name)
    open(base + '.svg', 'w', encoding='utf-8').write(svg)
    subprocess.run(['rsvg-convert', '-f', 'pdf', '-o', base + '.pdf', base + '.svg'], check=True)
    _figcache[name] = base + '.pdf'
    return _figcache[name]

class RT:
    def __init__(self, acrobat=False):
        self.sec = 'inicio'
        self.acrobat = acrobat
        self.ocg = 0
        self.quiz, self.cards, self.gl, self.checks, self.plan = [], [], [], [], []
        self.formulas = []   # (sec, title, tex)
        self.ex_ids = []

    def render(self, nodes): return ''.join(self.node(n) for n in nodes)

    def ocg_wrap(self, tex_blocks):
        """Devuelve (ids, tex) con cada bloque en su propia capa (versión Acrobat)."""
        ids, out = [], []
        for b in tex_blocks:
            self.ocg += 1; i = 'ocg%d' % self.ocg; ids.append(i)
            out.append('\\begin{ocg}{Solución %d}{%s}{0}\n%s\\mbox{}\n\\end{ocg}\n' % (self.ocg, i, b))
        return ids, ''.join(out)

    def node(self, n):
        t = n['t']
        if t == 'h':
            hid = n['id'] or (self.sec + '-' + slug(n['text']))
            cmd = 'subsection' if n['level'] == 2 else 'subsubsection'
            return '\\hypertarget{%s}{}\\%s{%s}\n' % (tid(hid), cmd, inline(n['text']))
        if t == 'p': return inline(n['text']) + '\n\n'
        if t == 'list':
            env = 'enumerate' if n['ordered'] else 'itemize'
            return '\\begin{%s}\n%s\\end{%s}\n' % (env, ''.join('\\item %s\n' % inline(x) for x in n['items']), env)
        if t == 'code':
            if n['out']: return verb(n['text'], 'out', 'Salida')
            return verb(n['text'], 'code', (n['lang'] or '').upper() if n['lang'] else '')
        if t == 'stmt': raise RuntimeError('stmt debe resolverse antes')
        if t == 'table':
            rows = n['rows']; nc = len(rows[0])
            fs = '\\small' if nc <= 4 else '\\footnotesize'
            spec = '|' + '|'.join(['>{\\raggedright\\arraybackslash}X'] * nc) + '|'
            body = ' \\\\ \\hline\n'.join(' & '.join(inline(c) for c in (r + [''] * (nc - len(r)))[:nc]) for r in rows[1:])
            head = ' & '.join('\\textbf{%s}' % inline(c) for c in rows[0])
            return '{%s\\renewcommand{\\arraystretch}{1.25}\\noindent\\begin{tabularx}{\\linewidth}{%s}\\hline\n\\rowcolor{tblhead}%s \\\\ \\hline\n%s \\\\ \\hline\n\\end{tabularx}}\n\n' % (fs, spec, head, body)
        if t == 'box':
            k = n['kind']; title = n['title'] or KIND_TITLES.get(k, k)
            inner = self.render(n['kids'])
            if k == 'formula': self.formulas.append((self.sec, title, inner))
            return '\\begin{tcolorbox}[%s,title={%s}]\n%s\\end{tcolorbox}\n' % (KIND_COL.get(k, 'bxgray'), inline(title), inner)
        if t == 'sim':
            nm = n['name'].replace(':', '-')
            f = os.path.join(SIMSHOT, 'sim-%s.png' % nm)
            if not os.path.exists(f): return ''
            return ('\\begin{figure}[H]\\centering\\includegraphics[width=\\linewidth,height=0.42\\textheight,keepaspectratio]{%s}\\par\\smallskip{\\scriptsize\\color{gray}Captura del simulador interactivo (disponible en la versión web de la guía).}\\end{figure}\n' % f)
        if t == 'open': return ''
        if t == 'yt':
            return ('\\begin{tcolorbox}[bxgray,title={Vídeo recomendado}]\\textbf{%s}\\par{\\small %s · %s}\\par\\href{https://www.youtube.com/watch?v=%s}{\\texttt{youtube.com/watch?v=%s}}\\end{tcolorbox}\n'
                    % (inline(n['title']), inline(n['chan']), inline(n['dur']), n['id'], n['id'].replace('_', '\\_')))
        if t == 'fig':
            if n['name'] == 'stats': return self.stats_hook()
            return '\\begin{figure}[H]\\centering\\includegraphics[width=0.92\\linewidth,height=0.4\\textheight,keepaspectratio]{%s}\\end{figure}\n' % fig_pdf(n['name'])
        if t == 'ex': return self.exercise(n)
        if t == 'quiz': self.quiz.append(n['args'] + [self.sec]); return ''
        if t == 'card': self.cards.append(n['args'] + [self.sec]); return ''
        if t == 'gl': self.gl.append(n['args']); return ''
        if t == 'check': self.checks.append(n['args'] + [self.sec]); return ''
        if t in ('form', 'plan'): self.plan.append(n['args']); return ''
        raise ValueError(t)

    stats_hook = lambda self: ''

    def exercise(self, n):
        m = n['meta']; eid = m['id']
        out = ['\\hypertarget{%s}{}\\subsubsection{%s}\n' % (tid(eid), inline(m['title']))]
        out.append('\\begin{tcolorbox}[bxenun,title={Enunciado}]\n%s\\end{tcolorbox}\n' % self.render(n['enun']))
        out.append('\\begin{tcolorbox}[bxteal,title={Antes de empezar: qué piden y qué teoría usas}]\n%s\\end{tcolorbox}\n' % self.render(n['antes']))
        blocks = []
        for k, p in enumerate(n['pasos'], 1):
            blocks.append('\\par\\medskip\\noindent\\colorbox{stepnum}{\\textcolor{white}{\\,\\textbf{%d}\\,}}\\ \\textbf{%s}\\par\\smallskip\n%s' % (k, inline(re.sub(r'^\d+\.\s*', '', p['title'])), self.render(p['kids'])))
        if n['ojo']:
            blocks.append('\\begin{tcolorbox}[bxred,title={Ojo: errata en la solución de referencia}]\n%s\\end{tcolorbox}\n' % self.render(n['ojo']))
        blocks.append('\\begin{tcolorbox}[bxgreen,title={Resultado final}]\n%s\\end{tcolorbox}\n' % self.render(n['res']))
        if self.acrobat:
            ids, body = self.ocg_wrap(blocks)
            out.append('\\par\\medskip\\noindent\\switchocg{%s}{\\fcolorbox{stepnum}{white}{\\ \\textbf{Mostrar / ocultar la resolución}\\ }}\\par\\medskip\n' % ' '.join(ids))
            out.append(body)
        else:
            out.append(''.join(blocks))
        return ''.join(out)
