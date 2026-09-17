/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Prefer a fresh document so deployments become visible quickly, with an
// offline fallback when the network is unavailable.
registerRoute(new NavigationRoute(new NetworkFirst({
    cacheName: "portfolio-navigation-v2",
    networkTimeoutSeconds: 3,
    plugins: [new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 24 * 60 * 60 })],
})));

// Vite filenames are content-hashed. Cache hits are safe and avoid a network
// request on repeat visits; precaching still handles the initial visit.
registerRoute(
    ({ request }) => request.destination === "script" || request.destination === "style",
    new CacheFirst({
        cacheName: "portfolio-bundles-v3",
        plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
);

registerRoute(
    ({ url, request }) =>
        request.destination === "font" &&
        (url.hostname === "fonts.googleapis.com" || url.hostname.endsWith(".gstatic.com")),
    new CacheFirst({
        cacheName: "portfolio-fonts-v2",
        plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 })],
    }),
);

registerRoute(
    ({ request }) => request.destination === "image",
    new CacheFirst({
        cacheName: "portfolio-images-v2",
        plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
);
