const CACHE_NAME = 'fakejobai-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/history.html',
    '/report.html',
    '/about.html',
    '/login.html',
    '/welcome.html',
    '/assets/css/style.css',
    '/assets/css/dashboard-pro.css',
    '/assets/css/mobile-app.css',
    '/assets/images/logo.svg',
    '/assets/images/ai-logo.png',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://unpkg.com/aos@2.3.4/dist/aos.css'
];

// Install: Cache all static assets (Cache-First)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: Strategy Implementation
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. API Calls: Network-First Strategy
    if (url.origin === self.location.origin && (url.pathname.includes('/analyze/') || url.pathname.includes('/api/'))) {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 2. Static Assets: Cache-First Strategy
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        })
    );
});
