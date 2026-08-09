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

// Assets the offline experience cannot work without: if these fail, the
// installation must fail loudly instead of activating a broken cache.
const CRITICAL_ASSETS = ['./index.html', OFFLINE_URL];

// 1. Install Event: Force immediate activation and cache base shell
self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);

        // addAll() rejects the whole batch on a single 404, which would leave
        // the app with no cache at all. Cache each asset individually and only
        // fail the install when a critical asset is missing.
        const results = await Promise.allSettled(
            STATIC_ASSETS.map(asset => cache.add(asset))
        );

        const failures = results
            .map((result, index) => ({ result, asset: STATIC_ASSETS[index] }))
            .filter(({ result }) => result.status === 'rejected');

        failures.forEach(({ result, asset }) => {
            console.error('[SW] Failed to pre-cache asset:', asset, result.reason);
        });

        const criticalFailure = failures.find(({ asset }) => CRITICAL_ASSETS.includes(asset));
        if (criticalFailure) {
            throw new Error(`[SW] Install aborted, critical asset unavailable: ${criticalFailure.asset}`);
        }

        await self.skipWaiting();
    })());
});

// 2. Activate Event: Flush old versions instantly out of user storage
self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        const deletions = await Promise.allSettled(
            cacheNames
                .filter(cache => cache !== CACHE_NAME)
                .map(cache => caches.delete(cache))
        );

        deletions.forEach(deletion => {
            if (deletion.status === 'rejected') {
                console.error('[SW] Failed to purge outdated cache:', deletion.reason);
            }
        });

        await self.clients.claim();
    })());
});

/**
 * Stores a response without letting a storage failure (quota, opaque response,
 * unsupported scheme) reject the request that triggered it.
 */
async function cacheResponse(request, response) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response);
    } catch (error) {
        console.error('[SW] Failed to cache response for:', request.url, error);
    }
}

// 3. Fetch Event: Advanced Hybrid Caching Engine
self.addEventListener('fetch', (event) => {
    // Restrict interception to safe, local HTTP/HTTPS GET requests
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;

    // STRATEGY A: Webpage/HTML navigation requests
    if (event.request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const networkResponse = await fetch(event.request);
                event.waitUntil(cacheResponse(event.request, networkResponse.clone()));
                return networkResponse;
            } catch (networkError) {
                console.warn('[SW] Navigation request failed, serving cache:', event.request.url, networkError);
                const cachedResponse = await caches.match(event.request);
                const fallback = cachedResponse || await caches.match(OFFLINE_URL);
                return fallback || new Response('Offline and no cached page available.', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
        })());
        return;
    }

    // STRATEGY B: Assets (CSS, JS, Fonts, Images) using Stale-While-Revalidate
    event.respondWith((async () => {
        const cachedResponse = await caches.match(event.request);

        const fetchPromise = fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
                event.waitUntil(cacheResponse(event.request, networkResponse.clone()));
            }
            return networkResponse;
        });

        if (cachedResponse) {
            // Revalidate in the background; a failure here must not surface as
            // an unhandled rejection nor affect the cached response.
            event.waitUntil(fetchPromise.catch((error) => {
                console.warn('[SW] Background revalidation failed for:', event.request.url, error);
            }));
            return cachedResponse;
        }

        try {
            return await fetchPromise;
        } catch (error) {
            // Nothing cached and the network is gone: answer with an explicit
            // error response rather than a null that becomes a fetch TypeError.
            console.error('[SW] Asset unavailable offline:', event.request.url, error);
            return new Response('', {
                status: 504,
                statusText: 'Gateway Timeout'
            });
        }
    })());
});
