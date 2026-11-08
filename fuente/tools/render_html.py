import re, html, json
from figs import FIGS

def esc(s): return html.escape(s, quote=False)

def inline(s):
    toks = []
    def stash(m):
        toks.append(m.group(0)); return '\x00%d\x00' % (len(toks) - 1)
    s = re.sub(r'`[^`]+`', stash, s)
    s = re.sub(r'\$\$.+?\$\$|\$[^$\n]+\$', stash, s)
    s = esc(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'(?<![\w*])\*(?![\s*])(.+?)(?<![\s*])\*(?![\w*])', r'<i>\1</i>', s)
    s = re.sub(r'\[([^\]]+)\]\((#[^)]+|https?://[^)]+)\)', r'<a href="\2">\1</a>', s)
    def back(m):
        t = toks[int(m.group(1))]
        if t.startswith('`'): return '<code>' + esc(t[1:-1]) + '</code>'
        if t.startswith('$$'): return '\\[' + esc(t[2:-2]) + '\\]'
        return '\\(' + esc(t[1:-1]) + '\\)'
    return re.sub(r'\x00(\d+)\x00', back, s)

KIND_TITLES = dict(tip='Idea clave', warn='Qué suele fallar', deep='Más a fondo', note='Nota', formula='Fórmulas clave',
                   ojo='Ojo', intuicion='Intuición', def_='Definición')

def slug(s):
    s = s.lower()
    for a, b in zip('áéíóúüñ', 'aeiouun'): s = s.replace(a, b)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:48]

class R:
    def __init__(self, page_ctx):
        self.ctx = page_ctx          # dict: tema color, section id
        self.uid = 0
        self.index = []              # entradas de búsqueda
        self.quiz, self.cards, self.gl, self.checks, self.plan = [], [], [], [], []

    def nid(self, p='n'):
        self.uid += 1
        return '%s%d' % (p, self.uid)

    def render(self, nodes):
        return ''.join(self.node(n) for n in nodes)

    def node(self, n):
        t = n['t']
        if t == 'h':
            hid = n['id'] or (self.ctx['sec'] + '-' + slug(n['text']))
            if n['level'] == 2:
                self.index.append(dict(id=hid, title=n['text'], sec=self.ctx['sec']))
            return '<h%d id="%s" data-s="1">%s</h%d>' % (n['level'] + 1 if n['level'] == 2 else 4, hid, inline(n['text']), n['level'] + 1 if n['level'] == 2 else 4)
        if t == 'p': return '<p>%s</p>' % inline(n['text'])
        if t == 'list':
            tag = 'ol' if n['ordered'] else 'ul'
            return '<%s>%s</%s>' % (tag, ''.join('<li>%s</li>' % inline(x) for x in n['items']), tag)
        if t == 'code':
            cls = 'out' if n['out'] else 'lang-' + (n['lang'] or 'txt')
            label = '<span class="lbl">Salida</span>' if n['out'] else ('<span class="lbl">%s</span>' % n['lang'].upper() if n['lang'] else '')
            return '<pre class="%s">%s<code>%s</code></pre>' % (cls, label, esc(n['text']))
        if t == 'table':
            rows = n['rows']
            th = ''.join('<th>%s</th>' % inline(c) for c in rows[0])
            body = ''.join('<tr>%s</tr>' % ''.join('<td>%s</td>' % inline(c) for c in r) for r in rows[1:])
            return '<div class="tw"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (th, body)
        if t == 'box':
            k = n['kind']; title = n['title'] or KIND_TITLES.get(k, k)
            inner = self.render(n['kids'])
            if k == 'deep':
                return '<details class="box deep"><summary>%s</summary>%s</details>' % (inline(title), inner)
            return '<aside class="box %s"><div class="bt">%s</div>%s</aside>' % (k, inline(title), inner)
        if t == 'sim':
            return '<div class="sim" data-sim="%s" id="sim-%s"></div>' % (n['name'], n['name'].replace(':', '-'))
        if t == 'open':
            sim, _, arg = n['name'].partition(':')
            return '<button class="btn open-sim" data-sim="%s" data-arg="%s">Abrir en el simulador</button>' % (sim, arg)
        if t == 'fig':
            name = n['name']
            return '<figure class="fig">%s</figure>' % FIGS[name]()
        if t == 'ex': return self.exercise(n)
        if t == 'quiz': self.quiz.append(n['args'] + [self.ctx['sec']]); return ''
        if t == 'card': self.cards.append(n['args'] + [self.ctx['sec']]); return ''
        if t == 'gl': self.gl.append(n['args']); return ''
        if t == 'check': self.checks.append(n['args'] + [self.ctx['sec']]); return ''
        if t == 'form': self.plan.append(n['args']); return ''
        if t == 'plan': self.plan.append(n['args']); return ''
        raise ValueError(t)

    def exercise(self, n):
        m = n['meta']; eid = m['id']
        chips = ''.join('<span class="chip">%s</span>' % esc(x.strip()) for x in (m.get('tema', '') + ',' + m.get('tipo', '')).split(',') if x.strip())
        self.index.append(dict(id=eid, title=m['title'], sec=self.ctx['sec']))
        out = ['<article class="ex" id="%s" data-tags="%s" data-curso="%s" data-tipo="%s" data-tema="%s">' % (
            eid, esc(m.get('exam', '') + ' ' + m['title']), esc(m.get('curso', '')), esc(m.get('tipo', '')), esc(m.get('tema', '')))]
        out.append('<h3 class="exh">%s %s</h3>' % (inline(m['title']), chips))
        out.append('<div class="enun"><div class="bt">Enunciado</div>%s</div>' % self.render(n['enun']))
        out.append('<aside class="box antes"><div class="bt">Antes de empezar: qué piden y qué teoría usas</div>%s</aside>' % self.render(n['antes']))
        out.append('<div class="pasos">')
        for k, p in enumerate(n['pasos'], 1):
            out.append('<details class="paso"><summary><span class="pn">%d</span> %s</summary>%s</details>' % (k, inline(p['title']), self.render(p['kids'])))
        out.append('</div>')
        if n['ojo']:
            out.append('<aside class="box ojo"><div class="bt">Ojo: errata en la solución de referencia</div>%s</aside>' % self.render(n['ojo']))
        out.append('<details class="resultado"><summary>Resultado final</summary>%s</details>' % self.render(n['res']))
        out.append('</article>')
        return ''.join(out)
