/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = "rayyan-portfolio-v5"; 
const OFFLINE_URL = "/My_Portfolio/offline.html";

/** Shell assets structured to align with your Vite GitHub Pages subpath */
const STATIC_ASSETS: readonly string[] = [
    "/My_Portfolio/",
    "/My_Portfolio/index.html",
    "/My_Portfolio/offline.html",
    "/My_Portfolio/site.webmanifest",
    "/My_Portfolio/assets/icons/favicon.png",
    "/My_Portfolio/assets/icons/apple-touch-icon.png",
    "/My_Portfolio/assets/icons/icon-192.png",
    "/My_Portfolio/assets/icons/icon-512.png",
    "/My_Portfolio/assets/icons/maskable-icon-512x512.svg",
];

/** Caches assets individually to prevent single 404 file drops from crashing the install scope */
const precache = async (): Promise<void> => {
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(STATIC_ASSETS.map((asset) => cache.add(asset)));

    const failed = results.reduce<number>((count, result) => count + (result.status === "rejected" ? 1 : 0), 0);
    if (failed) {
        console.warn(`[SW] ${failed}/${STATIC_ASSETS.length} shell assets failed to pre-cache.`);
    }
};

const purgeOldCaches = async (): Promise<void> => {
    const names = await caches.keys();
    await Promise.all(
        names
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
    );
};

const putInCache = async (request: Request, response: Response): Promise<void> => {
    // FIX 1 & 2: Guard clause against invalid HTTP schemes and bad status responses
    const url = new URL(request.url);
    if (!url.protocol.startsWith("http")) return;
    if (response.status !== 200) return;

    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response);
    } catch {
        // Quota limits or opaque-response errors isolated securely
    }
};

/** Network-first strategy optimized for documents and portfolio route changes */
const handleNavigation = async (request: Request): Promise<Response> => {
    try {
        const networkResponse = await fetch(request);
        void putInCache(request, networkResponse.clone());
        return networkResponse;
    } catch {
        const cached = await caches.match(request);
        if (cached) return cached;

        const offline = await caches.match(OFFLINE_URL);
        return offline ?? new Response("Offline", { status: 503, statusText: "Offline" });
    }
};

/** Cache-first strategy for static assets with background revalidation */
const handleAsset = async (request: Request): Promise<Response> => {
    const cached = await caches.match(request);

    // FIX 4: Catch dynamic background fetch errors to prevent unhandled promise rejections
    const networkFetch = fetch(request)
        .then((response) => {
            void putInCache(request, response.clone());
            return response;
        })
        .catch(() => null);

    if (cached) {
        // Fires background sync completely un-awaited so layout displays immediately
        void networkFetch;
        return cached;
    }

    const response = await networkFetch;
    return response ?? new Response("", { status: 504, statusText: "Gateway Timeout" });
};

sw.addEventListener("install", (event) => {
    event.waitUntil(precache().then(() => sw.skipWaiting()));
});

sw.addEventListener("activate", (event) => {
    event.waitUntil(purgeOldCaches().then(() => sw.clients.claim()));
});

sw.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Block tracking scripts or post hooks from dropping operational worker tasks
    if (request.method !== "GET") return;

    // FIX 1: Guard clause against file://, chrome-extension://, and other non-http URLs at entry
    if (!url.protocol.startsWith("http")) return;

    // FIX 3: Fixed CDN detection string parsing bugs (removed broken absolute prefixes)
    const isSameOrigin = url.origin === sw.location.origin;
    const isFontCDN = url.hostname.includes("gstatic.com") || url.hostname.includes("googleapis.com");

    if (!isSameOrigin && !isFontCDN) return;

    event.respondWith(
        request.mode === "navigate" 
            ? handleNavigation(request) 
            : handleAsset(request)
    );
});