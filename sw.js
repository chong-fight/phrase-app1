// Service Worker - offline caching for PWA
const CACHE = "phrase-app-v2";
const BASE = "/phrase-app1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        `${BASE}/`,
        `${BASE}/learn/`,
        `${BASE}/review/`,
        `${BASE}/phrases/`,
        `${BASE}/import/`,
        `${BASE}/stats/`,
        `${BASE}/settings/`,
        `${BASE}/icon.svg`,
        `${BASE}/manifest.json`,
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Static assets (_next/static): cache-first, fallback to network
  if (request.url.includes("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Navigation / same-origin requests: network-first, fallback to cache
  event.respondWith(
    fetch(request).then((res) => {
      if (res.ok && request.method === "GET") {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, clone));
      }
      return res;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      // Final fallback: homepage
      return caches.match(`${BASE}/`);
    })
  );
});
