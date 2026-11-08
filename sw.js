// Service worker: guarda la guía para usarla sin conexión.
const CACHE = 'tr-d6edda';
const CORE = ["./", "./index.html", "./empezar.html", "./tema-0.html", "./tema-1.html", "./tema-2.html", "./tema-3.html", "./tema-4.html", "./tema-5.html", "./tema-6.html", "./tema-7.html", "./practicas.html", "./examenes.html", "./hojas.html", "./demostraciones.html", "./autoevaluacion.html", "./simulacro.html", "./formulario.html", "./glosario.html", "./plan.html", "./style.css?v=d6edda", "./app.js?v=d6edda", "./search-index.js?v=d6edda", "./manifest.webmanifest", "./formulario_1_pagina.pdf", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-svg.js"];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(new Request(u, {mode: u.startsWith('http') ? 'no-cors' : 'same-origin'})).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isPage = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (isPage) {
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
      .catch(() => caches.match(req, {ignoreSearch: true}).then(h => h || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {
    const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
