// Guarda la guía para poder leerla sin conexión.
// Las páginas se piden primero a la red, así que una actualización se ve en cuanto hay cobertura.
const CACHE = 'programacion-tiempo-real-v1';
const CORE = ["./", "./anim-manim.js", "./anim-temas.js", "./app.js", "./asig-nav.js", "./buscador-index.js", "./cuestiones.html", "./examenes.html", "./formulario.html", "./index.html", "./laboratorio.html", "./manifest.webmanifest", "./piel.css", "./piel.js", "./plan.html", "./problemas.html", "./sims.js", "./style.css", "./tema-01.html", "./tema-02.html", "./tema-03.html", "./tema-04.html", "./tema-05.html", "./tema-06.html", "./tema-07.html", "./tema-08.html", "./tema-09.html", "./tema-10.html", "https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(CORE.map(u => c.add(new Request(u, {mode: u.startsWith('http') ? 'no-cors' : 'same-origin'})).catch(() => {}))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'saltar') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  const esPagina = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (esPagina) {
    e.respondWith(fetch(req)
      .then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req, {ignoreSearch: true}).then(h => h || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const red = fetch(req).then(r => {
      if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => hit);
    return hit || red;
  }));
});
