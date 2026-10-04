/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

// Fast installation cycles
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.delete("portfolio-navigation-v2"),
        ])
    );
});

cleanupOutdatedCaches();

// Precache primary static layout configuration maps
precacheAndRoute(self.__WB_MANIFEST || []);

// HTML must prefer fresh deployments, while still working offline.
registerRoute(new NavigationRoute(new NetworkFirst({
    cacheName: "portfolio-navigation-v3",
    networkTimeoutSeconds: 3,
    plugins: [new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 24 * 60 * 60 })],
})));

// CRITICAL FIX: Native Workbox Route Handler for Custom Compressed Brotli Assets on GitHub Pages
registerRoute(
    ({ request, url }) => 
        url.origin === self.location.origin && 
        (request.destination === "script" || request.destination === "style"),
    async ({ request, url }) => {
        // Safe cross-platform absolute path resolution for GitHub Pages subfolders
        const brotliUrl = url.href + ".br";
        
        try {
            const response = await fetch(brotliUrl);
            
            // If GitHub Pages fails to find the pre-compressed asset file, fall back to standard asset routing
            if (!response.ok) return fetch(request.clone());

            const newHeaders = new Headers(response.headers);
            newHeaders.set("Content-Encoding", "br");
            
            if (url.pathname.endsWith(".js")) {
                newHeaders.set("Content-Type", "application/javascript");
            } else if (url.pathname.endsWith(".css")) {
                newHeaders.set("Content-Type", "text/css");
            }

            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: newHeaders,
            });
        } catch {
            return fetch(request.clone());
        }
    }
);

// Match the actual Google Fonts hosts, including www.gstatic.com.
registerRoute(
    ({ url, request }) =>
        request.destination === "font" &&
        (url.hostname === "fonts.googleapis.com" || url.hostname.endsWith(".gstatic.com")),
    new CacheFirst({
        cacheName: "portfolio-fonts-v2",
        plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 })],
    }),
);

// High performance compressed image caching layouts
registerRoute(
    ({ request }) => request.destination === "image",
    new CacheFirst({
        cacheName: "portfolio-images-v4",
        plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
);
