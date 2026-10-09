/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches, matchPrecache } from "workbox-precaching";
import { registerRoute, NavigationRoute, setCatchHandler } from "workbox-routing";
import { CacheFirst, NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare const self: ServiceWorkerGlobalScope;

// Activate updates promptly and remove the previous navigation cache once.
self.addEventListener("install", (event) => {
    event.waitUntil(self.skipWaiting());
});
self.addEventListener("activate", (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.delete("portfolio-navigation-v2"),
            caches.delete("portfolio-navigation-v3"),
        ])
    );
});

cleanupOutdatedCaches();

// Precache the app shell and hashed local runtime assets.
precacheAndRoute(self.__WB_MANIFEST || []);

// HTML must prefer fresh deployments, while still working offline.
registerRoute(new NavigationRoute(new NetworkFirst({
    cacheName: "portfolio-navigation-v4",
    networkTimeoutSeconds: 2,
    plugins: [new ExpirationPlugin({ maxEntries: 5, maxAgeSeconds: 24 * 60 * 60 })],
})));

setCatchHandler(async ({ request }) => {
    if (request.destination !== "document") return Response.error();
    const offlinePage = await matchPrecache(new URL("offline.html", self.registration.scope).href);
    return offlinePage ?? Response.error();
});

// Keep only same-origin images in the runtime cache; hashed app assets are precached.
registerRoute(
    ({ request, url }) => request.destination === "image" && url.origin === self.location.origin,
    new CacheFirst({
        cacheName: "portfolio-images-v5",
        plugins: [new ExpirationPlugin({ maxEntries: 40, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }),
);