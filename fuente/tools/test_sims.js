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
