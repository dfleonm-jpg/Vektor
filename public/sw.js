/**
 * Vektor — Service Worker.
 *
 * Estrategia:
 *   - App shell y assets estáticos → cache-first (la UI abre al instante y
 *     funciona sin conexión, clave en gimnasios con mala señal).
 *   - Navegaciones → network-first con fallback al shell cacheado offline.
 *   - API (/api/*) → nunca se cachea; los datos van por la cola de sync.
 *
 * La cola de sincronización vive en IndexedDB (ver src/lib/offline/*); este SW
 * solo gestiona el cacheo de la interfaz y los recursos.
 */

const CACHE_VERSION = "vektor-v1";
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icons/icon.svg",
  "/offline.html",
];

// Instalación: precachea el app shell.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

// Activación: limpia versiones antiguas del caché.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // No cachear llamadas a la API ni a orígenes externos.
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) {
    return;
  }

  // Navegaciones (documentos HTML): network-first con fallback offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/offline.html");
        }),
    );
    return;
  }

  // Assets estáticos: cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
