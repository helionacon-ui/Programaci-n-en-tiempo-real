// Convierte las fórmulas \( ... \) y \[ ... \] de los HTML ya generados en HTML de KaTeX (sin JavaScript en el navegador).
// Uso: node tools/prerender_math.js fichero.html ...
const fs = require('fs'), path = require('path');
const katex = require(path.join(__dirname, '..', 'assets', 'katex', 'katex.min.js'));
const dec = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&');
let total = 0, bad = [];
for (const f of process.argv.slice(2)) {
  let h = fs.readFileSync(f, 'utf8'), n = 0;
  const tok = /(<(pre|code|script|style|textarea|svg)\b[\s\S]*?<\/\2>|<[^>]+>)/g;
  const parts = h.split(tok);
  // split con 2 grupos de captura: [texto, etiqueta, nombre, texto, ...]
  let out = '';
  for (let i = 0; i < parts.length; i += 3) {
    let t = parts[i];
    t = t.replace(/\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g, (m, d, s) => {
      const disp = d !== undefined, src = dec(disp ? d : s);
      try { n++; return katex.renderToString(src, { displayMode: disp, throwOnError: true, output: 'htmlAndMathml', strict: 'ignore' }); }
      catch (e) { bad.push(path.basename(f) + ': ' + src.slice(0, 60) + ' → ' + e.message.slice(0, 80)); return m; }
    });
    out += t; if (parts[i + 1] !== undefined) out += parts[i + 1];
  }
  fs.writeFileSync(f, out); total += n;
}
console.log('fórmulas convertidas:', total, '· con error:', bad.length);
bad.slice(0, 20).forEach((b) => console.log('  ' + b));
process.exit(bad.length ? 1 : 0);
