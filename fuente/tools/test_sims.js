const P = require('../assets/sims_core.js').PSTR; const assert = require('assert');
const ts = [{C:3,T:7,D:7},{C:3,T:12,D:12},{C:5,T:20,D:20}];
const r = P.rta(ts,'RM'); assert.deepStrictEqual(r.res.map(x=>x.R),[3,6,20]);
const s = P.simulate(ts,'RM',420); assert.deepStrictEqual(s.resp,[3,6,20]); assert.strictEqual(s.misses.length,0);
// problemas de examen (bloqueos calculados con tools/rta.py)
const feb=[{C:4,T:60,D:20,B:2},{C:4,T:10,D:10,B:1},{C:8,T:50,D:50,B:0}];
assert.deepStrictEqual(P.rta(feb,'DM').res.map(x=>x.R),[10,5,20]);
const sep=[{C:12,T:120,D:120,B:0},{C:8,T:500,D:25,B:3},{C:10,T:20,D:20,B:3}];
const rs=P.rta(sep,'DM').res; assert.deepStrictEqual(rs.map(x=>x.R),[40,31,13]); assert.deepStrictEqual(rs.map(x=>x.ok),[true,false,true]);
const f=P.frames([{T:25,C:10,D:25},{T:50,C:5,D:50},{T:100,C:5,D:100}]);
assert.deepStrictEqual(f.frames.filter(x=>x.ok).map(x=>x.Ts),[10,25]); assert.strictEqual(f.Tm,100);
const v=P.vecGrow(5,2,0); assert.deepStrictEqual(v.steps.map(s=>s.cap),[1,2,4,4,8]); assert.strictEqual(v.copies,1+2+4);
const p=P.patriot(100); assert(Math.abs(p.drift-0.3433)<1e-3); assert(Math.abs(p.dist-575.4)<0.5);
const rnd=P.mulberry(7); const outs=new Set(); for(let i=0;i<500;i++) outs.add(P.raceRandom(false,rnd)); assert(outs.has(2)&&outs.has(4));
for(let i=0;i<500;i++) assert.strictEqual(P.raceRandom(true,rnd),4);
assert.deepStrictEqual(P.rows(5,2),[[0,2,4],[1,3]]);
const ph=P.philosophers(3,'lock',5,P.mulberry(3)); assert(!ph.deadlock);
let dl=0; for(let s=1;s<=20;s++) if(P.philosophers(3,'seq',50,P.mulberry(s)).deadlock) dl++; assert(dl>0);
const iv=['none','pip','icpp'].map(p=>P.inversion(p).fin[2]); assert.deepStrictEqual(iv,[12,9,8]);
console.log('sims_core OK; interbloqueos en 20 semillas:',dl);
{
  const A = require('../assets/sims_core.js').PSTR || require('../assets/sims_core.js');
  for (let seed = 1; seed <= 50; seed++) { const r = A.almacen(3, 7, seed); if (!r.ok || r.trace.length !== 7 * 4) throw new Error('almacen ' + seed); }
  console.log('almacen OK');
}
{
  const P = require('../assets/sims_core.js').PSTR; const assert = require('assert'); const fs = require('fs');
  // nota estimada
  const full = { poo: [1, 1, 1, 1, 1, 1], conc: [1, 1, 1, 1, 1] };
  assert.strictEqual(P.examGrade(full, { poo: true, conc: true }).sobre10, 10);
  assert.strictEqual(P.examGrade(full, { poo: false, conc: true }).sobre10, 6.5);   // 70/2 + 30 = 65
  assert.strictEqual(P.examGrade({ poo: [], conc: [] }, { poo: true, conc: true }).sobre10, 0);
  assert.strictEqual(P.RUBRICA.poo.items.reduce((a, i) => a + i[1], 0), 70); assert.strictEqual(P.RUBRICA.conc.items.reduce((a, i) => a + i[1], 0), 30);
  const t = P.examTimer(1000, 1000 + 3723000, 150 * 60000); assert.strictEqual(t.text, '01:27:57'); assert(P.examTimer(0, 1e9, 1000).over);
  // revisor: los ejemplos con fallos los detectan y NINGUNA solución de referencia da error ni aviso
  const src = fs.readFileSync(__dirname + '/../assets/sims.js', 'utf8'); const m = src.match(/const EJ_REV=\{herencia:`([\s\S]*?)`,monitor:`([\s\S]*?)`\};/);
  const ids = (c) => P.review(c).map((x) => x.id);
  for (const id of ['destructor-no-virtual', 'falta-const', 'falta-override', 'operator-miembro', 'new-sin-delete']) assert(ids(m[1]).includes(id), 'herencia ' + id);
  for (const id of ['falta-include', 'wait-sin-predicado', 'if-wait', 'wait-lock_guard', 'falta-ref', 'sin-join']) assert(ids(m[2]).includes(id), 'monitor ' + id);
  assert(ids('class A {\n int x;\n}\nint main(){}').includes('punto-coma-clase'));
  assert(!P.reviewVerdict(P.review(m[1])).compilaria && !P.reviewVerdict(P.review(m[2])).compilaria);
  let n = 0;
  for (const d of ['exams', 'exams2']) for (const f of fs.readdirSync(__dirname + '/../code/' + d).filter((x) => x.endsWith('.cpp'))) {
    const r = P.review(fs.readFileSync(__dirname + '/../code/' + d + '/' + f, 'utf8')).filter((x) => x.level !== 'info');
    assert.deepStrictEqual(r, [], 'falso positivo en ' + f); n++;
  }
  console.log('examen + revisor OK; soluciones de referencia sin avisos:', n);
}
