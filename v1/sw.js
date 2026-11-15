// Service worker: guarda la guía para usarla sin conexión.
const CACHE = 'tr-423d43';
const CORE = ["./", "./index.html", "./autoevaluacion.html", "./demostraciones.html", "./empezar.html", "./examenes.html", "./formulario.html", "./glosario.html", "./hojas.html", "./plan.html", "./practicas.html", "./simulador.html", "./t0.html", "./t1.html", "./t2.html", "./t3.html", "./t4.html", "./t5.html", "./t6.html", "./t7.html", "./assets/styles.css?v=423d43", "./assets/app.js?v=423d43", "./assets/search-index.js?v=423d43", "./manifest.webmanifest", "./formulario_1_pagina.pdf", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png", "./assets/katex.css?v=423d43", "./assets/fonts/KaTeX_AMS-Regular.woff2", "./assets/fonts/KaTeX_Caligraphic-Bold.woff2", "./assets/fonts/KaTeX_Caligraphic-Regular.woff2", "./assets/fonts/KaTeX_Fraktur-Bold.woff2", "./assets/fonts/KaTeX_Fraktur-Regular.woff2", "./assets/fonts/KaTeX_Main-Bold.woff2", "./assets/fonts/KaTeX_Main-BoldItalic.woff2", "./assets/fonts/KaTeX_Main-Italic.woff2", "./assets/fonts/KaTeX_Main-Regular.woff2", "./assets/fonts/KaTeX_Math-BoldItalic.woff2", "./assets/fonts/KaTeX_Math-Italic.woff2", "./assets/fonts/KaTeX_SansSerif-Bold.woff2", "./assets/fonts/KaTeX_SansSerif-Italic.woff2", "./assets/fonts/KaTeX_SansSerif-Regular.woff2", "./assets/fonts/KaTeX_Script-Regular.woff2", "./assets/fonts/KaTeX_Size1-Regular.woff2", "./assets/fonts/KaTeX_Size2-Regular.woff2", "./assets/fonts/KaTeX_Size3-Regular.woff2", "./assets/fonts/KaTeX_Size4-Regular.woff2", "./assets/fonts/KaTeX_Typewriter-Regular.woff2"];
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
