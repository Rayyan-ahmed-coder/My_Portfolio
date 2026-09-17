/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// HTML must prefer fresh deployments, while still working offline.
registerRoute(new NavigationRoute(new NetworkFirst({
    cacheName: "portfolio-navigation-v2",
    networkTimeoutSeconds: 3,
    plugins: [new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 24 * 60 * 60 })],
})));

// Hashed Vite assets are immutable; cache them without a network round trip.
registerRoute(
    ({ request }) => request.destination === "script" || request.destination === "style",
    new StaleWhileRevalidate({
        cacheName: "portfolio-bundles-v2",
        plugins: [new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
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

registerRoute(
    ({ request }) => request.destination === "image",
    new CacheFirst({
        cacheName: "portfolio-images-v2",
        plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
);
