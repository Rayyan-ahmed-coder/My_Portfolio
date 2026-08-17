const CACHE_NAME = 'rayyan-portfolio-v4';
const OFFLINE_URL = 'offline.html';

// Explicit paths without './' prefixes to ensure clean resolution across subdirectories
const STATIC_ASSETS = [
    '',
    'index.html',
    'offline.html',
    'site.webmanifest',
    'css/style.css',
    'css/responsive.css',
    'assets/icons/favicon.png',
    'assets/icons/apple-touch-icon.png',
    'assets/icons/icon-192.png',
    'assets/icons/icon-512.png',
    'assets/icons/maskable-icon-512x512.svg'
];

// 1. Install Event: Robust caching loop
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pre-caching structural assets and offline fallback');
                return Promise.all(
                    STATIC_ASSETS.map((url) => {
                        return cache.add(url).catch((err) => {
                            console.warn(`[SW] Pre-cache failed for resource: ${url}`, err);
                        });
                    })
                );
            })
            .then(() => self.skipWaiting())
    );
});

// 2. Activate Event: Flush old cache stores immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            console.log('[SW] Purging outdated cache:', cache);
                            return caches.delete(cache);
                        }
                        return Promise.resolve(false);
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// 3. Fetch Event: Intercept and distribute assets safely
self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') return;
    if (!request.url.startsWith(self.location.origin)) return;

    // STRATEGY A: Webpage/HTML navigation requests (Network-First, falling back to cache)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse.status === 200) {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return networkResponse;
                })
                .catch(async () => {
                    const cachedResponse = await caches.match(request);
                    if (cachedResponse) return cachedResponse;

                    // Fallback to offline.html if the specific route isn't cached
                    const fallbackResponse = await caches.match(OFFLINE_URL);
                    if (fallbackResponse) return fallbackResponse;

                    return new Response('Network disconnected. Content unavailable offline.', {
                        status: 503,
                        headers: { 'Content-Type': 'text/plain' }
                    });
                })
        );
        return;
    }

    // STRATEGY B: Static Assets & CSS Shell Files (Cache-First strategy)
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse; // Return straight from cache instantly
            }

            return fetch(request)
                .then((networkResponse) => {
                    if (networkResponse.status === 200 || networkResponse.type === 'opaque') {
                        const responseClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
                    }
                    return networkResponse;
                })
                .catch((err) => {
                    throw err;
                });
        })
    );
});