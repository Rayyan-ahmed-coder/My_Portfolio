/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

// 1. Instantly activate and claim clients to avoid mid-session loading gaps
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
// 2. Clear old cached chunks from previous versions instantly to save device space
cleanupOutdatedCaches();

// 3. Ultra-Fast Pre-caching Core
// Injects all compiled HTML, JS, CSS, and structural images at build time
const manifest = self.__WB_MANIFEST || [];
precacheAndRoute(manifest);

// 4. Route 1: Navigation Request Strategy (HTML Pages) -> Network First with ultra-fast fallback
const navigationHandler = new NetworkFirst({
    cacheName: "portfolio-navigation-v1",
    plugins: [
        new ExpirationPlugin({
            maxEntries: 10,
            maxAgeSeconds: 3 * 24 * 60 * 60, // 3 Days max window
        }),
    ],
});
registerRoute(new NavigationRoute(navigationHandler));

// 5. Route 2: Static Assets & Bundles (JS, CSS) -> Stale While Revalidate
// Serves instantly from cache while pulling updates down quietly in the background
registerRoute(
    ({ request }) => request.destination === "script" || request.destination === "style",
    new StaleWhileRevalidate({
        cacheName: "portfolio-bundles-v1",
    })
);

// 6. Route 3: CDN Fonts (Google Fonts / Gstatic) -> Cache First (Extreme Max Speed)
// Fonts change rarely; caching them explicitly cuts out recurring HTTP handsakes entirely
registerRoute(
    ({ url }) => url.origin === "https://googleapis.com" || url.origin === "https://gstatic.com",
    new CacheFirst({
        cacheName: "portfolio-fonts-cdn",
        plugins: [
            new ExpirationPlugin({
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Year structural storage lock
            }),
        ],
    })
);

// 7. Route 4: Images & Media -> Cache First with Auto-Purging
registerRoute(
    ({ request }) => request.destination === "image",
    new CacheFirst({
        cacheName: "portfolio-images-v1",
        plugins: [
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days active cache layout
            }),
        ],
    })
);