const CACHE_NAME = 'rayyan-portfolio-v3';
const OFFLINE_URL = './offline.html';

// Static Shell Assets to cache completely on installation
const STATIC_ASSETS = [
    './',
    './index.html',
    './offline.html',
    './site.webmanifest',
    './css/style.css',
    './css/responsive.css',
    './assets/icons/favicon.png',
    './assets/icons/apple-touch-icon.png',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/maskable-icon-512x512.svg'
];

// 1. Install Event: Force immediate activation and cache base shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching structural assets and offline fallback');
            return cache.addAll(STATIC_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

// 2. Activate Event: Flush old versions instantly out of user storage
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('[SW] Purging outdated cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Fetch Event: Advanced Hybrid Caching Engine
self.addEventListener('fetch', (event) => {
    // Restrict interception to safe, local HTTP/HTTPS requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    // STRATEGY A: Webpage/HTML navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Update the cache dynamically with fresh HTML versions
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    return networkResponse;
                })
                .catch(() => {
                    // Network failed: Try to get the specific page from cache, otherwise drop into offline.html
                    return caches.match(event.request).then((cachedResponse) => {
                        return cachedResponse || caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    // STRATEGY B: Assets (CSS, JS, Fonts, Images) using Stale-While-Revalidate
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                }
                return networkResponse;
            }).catch(() => null); // Silent catch if offline
            // Return instantly from cache if available, otherwise wait for network fetch
            return cachedResponse || fetchPromise;
        })
    );
});