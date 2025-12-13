const CACHE_NAME = 'fakejobai-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/login.html',
    '/assets/css/style.css',
    '/assets/css/mobile-app.css',
    '/js/app-core.js',
    '/js/mobile-nav.js',
    '/js/globe-map.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
