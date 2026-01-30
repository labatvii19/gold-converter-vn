// Service Worker for Gold Converter VN PWA
// Version: 3.0.0 (Clean Slate)

const CACHE_NAME = 'gold-converter-vn-v3';
const STATIC_CACHE = 'gold-converter-static-v3';

// URLs to cache on install
const urlsToCache = [
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
                        console.log('[Service Worker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip external APIs (let them go to network)
    if (url.origin !== self.location.origin) {
        return;
    }

    // For navigation requests (HTML), use Network First, fallback to cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    return response;
                })
                .catch(() => {
                    // Start URL for PWA fallback
                    return caches.match('/')
                        .then(r => r || new Response('Offline - Service Unavailable', { status: 503 }));
                })
        );
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((response) => {
                if (response) {
                    return response;
                }

                const fetchRequest = request.clone();
                return fetch(fetchRequest).then((response) => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2|woff)$/)) {
                        caches.open(STATIC_CACHE)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });
                    }
                    return response;
                });
            })
    );
});
