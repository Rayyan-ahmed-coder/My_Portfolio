import { vi } from 'vitest';

/**
 * Installs a window.matchMedia stub. `matches` may be a boolean (applied to
 * every query) or a map of media query string to boolean.
 * Returns a dispatch helper so tests can simulate OS preference changes.
 */
export function stubMatchMedia(matches = false) {
    const resolve = (query) =>
        typeof matches === 'boolean' ? matches : Boolean(matches[query]);
    const listeners = new Map();

    const matchMedia = vi.fn((query) => {
        const list = {
            media: query,
            get matches() {
                return resolve(query);
            },
            addEventListener: (type, handler) => {
                if (type !== 'change') return;
                const handlers = listeners.get(query) || [];
                handlers.push(handler);
                listeners.set(query, handlers);
            },
            removeEventListener: (type, handler) => {
                const handlers = listeners.get(query) || [];
                listeners.set(
                    query,
                    handlers.filter((fn) => fn !== handler)
                );
            },
            addListener: () => {},
            removeListener: () => {},
            dispatchEvent: () => false,
            onchange: null,
        };
        return list;
    });

    vi.stubGlobal('matchMedia', matchMedia);
    window.matchMedia = matchMedia;

    return {
        matchMedia,
        emitChange(query, value) {
            (listeners.get(query) || []).forEach((handler) => handler({ matches: value, media: query }));
        },
    };
}

/**
 * Installs an IntersectionObserver stub that records every instance so tests can
 * drive intersections manually.
 */
export function stubIntersectionObserver() {
    const instances = [];

    class MockIntersectionObserver {
        constructor(callback, options = {}) {
            this.callback = callback;
            this.options = options;
            this.observed = [];
            this.unobserved = [];
            this.disconnected = false;
            instances.push(this);
        }

        observe(element) {
            this.observed.push(element);
        }

        unobserve(element) {
            this.unobserved.push(element);
            this.observed = this.observed.filter((el) => el !== element);
        }

        disconnect() {
            this.disconnected = true;
            this.observed = [];
        }

        takeRecords() {
            return [];
        }

        /** Test-only: fire the observer callback for the given targets. */
        trigger(entries) {
            this.callback(
                entries.map(({ target, isIntersecting = true }) => ({ target, isIntersecting })),
                this
            );
        }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    window.IntersectionObserver = MockIntersectionObserver;

    return {
        instances,
        get last() {
            return instances[instances.length - 1];
        },
    };
}

/** Replaces requestAnimationFrame with a synchronous runner. */
export function stubAnimationFrame() {
    const raf = vi.fn((callback) => {
        callback(performance.now());
        return 1;
    });
    const caf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('cancelAnimationFrame', caf);
    window.requestAnimationFrame = raf;
    window.cancelAnimationFrame = caf;
    return { raf, caf };
}

/** Collects animation frame callbacks so tests can flush them on demand. */
export function deferAnimationFrame() {
    const queue = [];
    const raf = vi.fn((callback) => queue.push(callback));
    vi.stubGlobal('requestAnimationFrame', raf);
    window.requestAnimationFrame = raf;
    return {
        raf,
        flush(timestamp = performance.now()) {
            const pending = queue.splice(0, queue.length);
            pending.forEach((callback) => callback(timestamp));
        },
        get pending() {
            return queue.length;
        },
    };
}

/**
 * Records every document-level listener registered while active so tests can
 * detach them again. Needed for modules that bind global listeners without
 * offering a teardown hook.
 */
export function trackDocumentListeners() {
    const registered = [];
    const original = document.addEventListener.bind(document);
    vi.spyOn(document, 'addEventListener').mockImplementation((type, handler, options) => {
        registered.push([type, handler, options]);
        original(type, handler, options);
    });

    return {
        detachAll() {
            registered.splice(0, registered.length).forEach(([type, handler, options]) => {
                document.removeEventListener(type, handler, options);
            });
        },
    };
}

/**
 * Freshly imports a module, bypassing the module cache, so module level state
 * (such as the cached matchMedia queries in core/utilities.js) is re-evaluated.
 * @param {() => Promise<unknown>} loader e.g. `() => import('../js/core/utilities.js')`
 */
export async function importFresh(loader) {
    vi.resetModules();
    return loader();
}
