// CornerMaster — service worker
// Estrategia:
//   - HTML: network-first, fallback a cache (para que las páginas se actualicen)
//   - Assets estáticos (_next, imágenes): stale-while-revalidate
//   - API/Supabase: NUNCA cachear (datos siempre frescos)
const CACHE = "cornermaster-v1";
const STATIC = ["/", "/login", "/dashboard", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // NUNCA interceptar Supabase, Vercel, ni cross-origin APIs
  if (url.origin !== self.location.origin) return;

  // HTML: network-first
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match("/dashboard")))
    );
    return;
  }

  // Assets: stale-while-revalidate
  e.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
