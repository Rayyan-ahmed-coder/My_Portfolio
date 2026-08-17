/// <reference lib="webworker" />

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = "rayyan-portfolio-v4";
const OFFLINE_URL = "./offline.html";

/** Shell assets whose URLs are stable across builds (hashed bundles are cached on demand). */
const STATIC_ASSETS: readonly string[] = [
    "./",
    "./index.html",
    "./offline.html",
    "./site.webmanifest",
    "./assets/icons/favicon.png",
    "./assets/icons/apple-touch-icon.png",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",
    "./assets/icons/maskable-icon-512x512.svg",
];

/**
 * Caches assets one by one: a single 404 (renamed icon, changed build output)
 * must not reject installation and leave the site without a worker.
 */
const precache = async (): Promise<void> => {
    const cache = await caches.open(CACHE_NAME);
    const results = await Promise.allSettled(STATIC_ASSETS.map((asset) => cache.add(asset)));

    const failed = results.reduce<number>((count, result) => count + (result.status === "rejected" ? 1 : 0), 0);
    if (failed) console.warn(`[SW] ${failed}/${STATIC_ASSETS.length} shell assets could not be pre-cached`);
};

const purgeOldCaches = async (): Promise<void> => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)));
};

const putInCache = async (request: Request, response: Response): Promise<void> => {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response);
    } catch {
        // Quota or opaque-response failures must not surface to the page.
    }
};

/** Network-first for documents, with the cached page or offline shell as fallback. */
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

/** Stale-while-revalidate for static assets: instant paint, background refresh. */
const handleAsset = async (request: Request): Promise<Response> => {
    const cached = await caches.match(request);

    const network = fetch(request)
        .then((response) => {
            if (response.status === 200 && response.type === "basic") {
                void putInCache(request, response.clone());
            }
            return response;
        })
        .catch(() => null);

    if (cached) {
        void network;
        return cached;
    }

    const response = await network;
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

    // Only same-origin GETs are cacheable; anything else goes straight to network.
    if (request.method !== "GET" || !request.url.startsWith(sw.location.origin)) return;

    event.respondWith(request.mode === "navigate" ? handleNavigation(request) : handleAsset(request));
});
