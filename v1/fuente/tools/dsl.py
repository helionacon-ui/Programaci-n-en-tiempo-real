"""Mini-DSL -> árbol de nodos. Formato documentado en README.md."""
import re, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()

def parse(text, base=ROOT):
    lines = text.split('\n')
    nodes, i = [], 0
    n = len(lines)

    def para_end(j):
        while j < n and lines[j].strip() and not re.match(r'^(```|:::|@|#{2,3} |- |\d+\. |\||\[\[)', lines[j]):
            j += 1
        return j

    while i < n:
        ln = lines[i]
        s = ln.strip()
        if not s or s.startswith('<!--'):
            i += 1; continue
        m = re.match(r'^```(\w+)?\s*(out)?$', ln)
        if m:
            j = i + 1; buf = []
            while j < n and not lines[j].startswith('```'):
                buf.append(lines[j]); j += 1
            nodes.append(dict(t='code', lang=(m.group(1) or ''), out=bool(m.group(2)), text='\n'.join(buf)))
            i = j + 1; continue
        m = re.match(r'^@include\s+(\w+)\s+(\S+)(?:\s+(\d+)-(\d+))?(?:\s+(runout))?$', s)
        if m:
            path = os.path.join(base, m.group(2))
            src = read(path).rstrip('\n').split('\n')
            if m.group(3): src = src[int(m.group(3)) - 1:int(m.group(4))]
            nodes.append(dict(t='code', lang=m.group(1), out=False, text='\n'.join(src), src=m.group(2)))
            if m.group(5):
                op = os.path.join(base, 'code', 'out', os.path.basename(m.group(2)) + '.txt')
                if os.path.exists(op):
                    nodes.append(dict(t='code', lang='', out=True, text=read(op).rstrip('\n')))
            i += 1; continue
        m = re.match(r'^@stmt\s+(\w+)\s+(\d+)$', s)
        if m:
            nodes.append(dict(t='stmt', key=m.group(1), n=int(m.group(2)))); i += 1; continue
        m = re.match(r'^@out\s+(\S+)(?:\s+(\d+))?$', s)
        if m:
            lines_ = read(os.path.join(base, m.group(1))).rstrip('\n').split('\n')
            if m.group(2) and len(lines_) > int(m.group(2)): lines_ = lines_[:int(m.group(2))] + ['…']
            nodes.append(dict(t='code', lang='', out=True, text='\n'.join(lines_))); i += 1; continue
        m = re.match(r'^:::(\w+)\s*(.*)$', s)
        if m:
            depth, j, buf = 1, i + 1, []
            while j < n:
                if re.match(r'^:::\w+', lines[j].strip()): depth += 1
                elif lines[j].strip() == ':::':
                    depth -= 1
                    if depth == 0: break
                buf.append(lines[j]); j += 1
            nodes.append(dict(t='box', kind=m.group(1), title=m.group(2), kids=parse('\n'.join(buf), base)))
            i = j + 1; continue
        m = re.match(r'^@ejercicio\s+(.*)$', s)
        if m:
            parts = [p.strip() for p in m.group(1).split('|')]
            meta = dict(id=parts[0], title=parts[1])
            for p in parts[2:]:
                k, _, v = p.partition('=')
                meta[k.strip()] = v.strip()
            j, buf = i + 1, []
            while j < n and lines[j].strip() != '@fin':
                buf.append(lines[j]); j += 1
            nodes.append(parse_ex(meta, buf, base))
            i = j + 1; continue
        m = re.match(r'^@(quiz|card|gl|check|plan|form)\s+(.*)$', s)
        if m:
            nodes.append(dict(t=m.group(1), args=[p.strip() for p in m.group(2).split('|')]))
            i += 1; continue
        m = re.match(r'^\[\[yt:([\w-]{11})\|([^|\]]+)\|([^|\]]+)\|([^|\]]*)(?:\|([^|\]]*)\|([^|\]]*))?\]\]$', s)
        if m:
            nodes.append(dict(t='yt', id=m.group(1), title=m.group(2).strip(), chan=m.group(3).strip(), dur=m.group(4).strip(), lang=(m.group(5) or '').strip(), lvl=(m.group(6) or '').strip())); i += 1; continue
        m = re.match(r'^\[\[(sim|fig|open):([\w\-:,.=]+)\]\]$', s)
        if m:
            nodes.append(dict(t=m.group(1), name=m.group(2))); i += 1; continue
        m = re.match(r'^(#{2,3}) (.*)$', ln)
        if m:
            title, _, hid = m.group(2).partition(' {#')
            nodes.append(dict(t='h', level=len(m.group(1)), text=title.strip(), id=hid.rstrip('}') or None)); i += 1; continue
        if s.startswith('|'):
            rows = []
            while i < n and lines[i].strip().startswith('|'):
                rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')]); i += 1
            rows = [r for r in rows if not all(re.fullmatch(r':?-{2,}:?', c) for c in r)]
            nodes.append(dict(t='table', rows=rows)); continue
        if re.match(r'^(- )', ln) or re.match(r'^\d+\. ', ln):
            ordered = bool(re.match(r'^\d+\. ', ln)); items = []
            while i < n and (re.match(r'^(- |\d+\. )', lines[i]) or (lines[i].startswith('  ') and items and lines[i].strip())):
                if re.match(r'^(- |\d+\. )', lines[i]):
                    items.append(re.sub(r'^(- |\d+\. )', '', lines[i]))
                else:
                    items[-1] += ' ' + lines[i].strip()
                i += 1
            nodes.append(dict(t='list', ordered=ordered, items=items)); continue
        j = para_end(i + 1)
        nodes.append(dict(t='p', text=' '.join(x.strip() for x in lines[i:j]))); i = j
    return nodes

def parse_ex(meta, buf, base):
    sec, cur = {'enun': [], 'antes': [], 'pasos': [], 'res': [], 'ojo': []}, None
    pasos = []
    chunks = []  # (kind, title, lines)
    for ln in buf:
        s = ln.strip()
        m = re.match(r'^@(enunciado|antes|resultado|ojo)\s*$', s)
        if m:
            chunks.append([m.group(1), '', []]); continue
        m = re.match(r'^@paso\s*(.*)$', s)
        if m:
            chunks.append(['paso', m.group(1), []]); continue
        if chunks: chunks[-1][2].append(ln)
    ex = dict(t='ex', meta=meta, enun=[], antes=[], pasos=[], res=[], ojo=[])
    for kind, title, ls in chunks:
        k = parse('\n'.join(ls), base)
        if kind == 'enunciado': ex['enun'] += k
        elif kind == 'antes': ex['antes'] += k
        elif kind == 'resultado': ex['res'] += k
        elif kind == 'ojo': ex['ojo'] += k
        else: ex['pasos'].append(dict(title=title, kids=k))
    return ex
