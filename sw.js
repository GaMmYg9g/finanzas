const CACHE_NAME = 'finanzas-v4';
const urlsToCache = [
  '/finanzas/',
  '/finanzas/index.html',
  '/finanzas/css/styles.css',
  '/finanzas/js/app.js',
  '/finanzas/js/components/alcancia.js',
  '/finanzas/js/components/monedero.js',
  '/finanzas/js/components/ingresos.js',
  '/finanzas/js/components/gastos.js',
  '/finanzas/js/components/dashboard.js',
  '/finanzas/js/components/deudas.js',
  '/finanzas/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});
