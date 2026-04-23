// Cache name — bump only if you need to force-clear old caches
const CACHE_NAME = 'chaurasi-v3';

// Pre-cached static assets (not HTML — HTML uses network-first below)
const STATIC_ASSETS = ['./manifest.json', './logo.svg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS))
  );
  // Take control immediately — no waiting for old SW to die
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Delete every old cache version
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  // Claim all open tabs so this SW controls them right away
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle GET requests from the same origin
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // ── Network-first for HTML ──────────────────────────────────────────────
  // Always serves the freshest index.html. Falls back to cache when offline.
  // This is the key to auto-updates: no manual cache-busting ever needed.
  if (e.request.mode === 'navigate' ||
      url.pathname.endsWith('.html') ||
      url.pathname === '/') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          // Cache the fresh response for offline fallback
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // ── Cache-first for static assets (logo, manifest) ─────────────────────
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached ||
      fetch(e.request).then(res => {
        caches.open(CACHE_NAME).then(c => c.put(e.request, res.clone()));
        return res;
      })
    )
  );
});
