const CACHE_NAME = 'finanzas-v6'; // Versión aumentada para forzar actualización
const urlsToCache = [
    '.',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './js/components/alcancia.js',
    './js/components/monedero.js',
    './js/components/ingresos.js',
    './js/components/gastos.js',
    './js/components/dashboard.js',
    './js/components/deudas.js',
    './js/components/prestamos.js',
    './manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // Forzar activación inmediata
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
    // Eliminar cachés antiguas
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Tomar control de todas las páginas abiertas inmediatamente
            return clients.claim();
        })
    );
});
