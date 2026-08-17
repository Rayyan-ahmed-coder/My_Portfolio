import { vi } from 'vitest';

export type MediaMatches = boolean | Record<string, boolean>;

export interface MatchMediaStub {
    matchMedia: ReturnType<typeof vi.fn>;
    emitChange(query: string, value: boolean): void;
}

/**
 * Installs a window.matchMedia stub. `matches` may be a boolean (applied to
 * every query) or a map of media query string to boolean.
 * Returns a dispatch helper so tests can simulate OS preference changes.
 */
export function stubMatchMedia(matches: MediaMatches = false): MatchMediaStub {
    const resolve = (query: string): boolean =>
        typeof matches === 'boolean' ? matches : Boolean(matches[query]);
    const listeners = new Map<string, ((event: Partial<MediaQueryListEvent>) => void)[]>();

    const matchMedia = vi.fn((query: string) => {
        const list = {
            media: query,
            get matches(): boolean {
                return resolve(query);
            },
            addEventListener: (type: string, handler: (event: Partial<MediaQueryListEvent>) => void) => {
                if (type !== 'change') return;
                const handlers = listeners.get(query) ?? [];
                handlers.push(handler);
                listeners.set(query, handlers);
            },
            removeEventListener: (type: string, handler: (event: Partial<MediaQueryListEvent>) => void) => {
                if (type !== 'change') return;
                const handlers = listeners.get(query) ?? [];
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
        return list as unknown as MediaQueryList;
    });

    vi.stubGlobal('matchMedia', matchMedia);
    window.matchMedia = matchMedia as unknown as typeof window.matchMedia;

    return {
        matchMedia,
        emitChange(query: string, value: boolean): void {
            (listeners.get(query) ?? []).forEach((handler) => handler({ matches: value, media: query }));
        },
    };
}

export interface MockIntersectionObserverInstance {
    callback: IntersectionObserverCallback;
    options: IntersectionObserverInit;
    observed: Element[];
    unobserved: Element[];
    disconnected: boolean;
    trigger(entries: { target: Element; isIntersecting?: boolean }[]): void;
}

export interface IntersectionObserverStub {
    instances: MockIntersectionObserverInstance[];
    readonly last: MockIntersectionObserverInstance;
}

/**
 * Installs an IntersectionObserver stub that records every instance so tests can
 * drive intersections manually.
 */
export function stubIntersectionObserver(): IntersectionObserverStub {
    const instances: MockIntersectionObserverInstance[] = [];

    class MockIntersectionObserver implements MockIntersectionObserverInstance {
        callback: IntersectionObserverCallback;
        options: IntersectionObserverInit;
        observed: Element[] = [];
        unobserved: Element[] = [];
        disconnected = false;

        constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
            this.callback = callback;
            this.options = options;
            instances.push(this);
        }

        observe(element: Element): void {
            this.observed.push(element);
        }

        unobserve(element: Element): void {
            this.unobserved.push(element);
            this.observed = this.observed.filter((el) => el !== element);
        }

        disconnect(): void {
            this.disconnected = true;
            this.observed = [];
        }

        takeRecords(): IntersectionObserverEntry[] {
            return [];
        }

        /** Test-only: fire the observer callback for the given targets. */
        trigger(entries: { target: Element; isIntersecting?: boolean }[]): void {
            this.callback(
                entries.map(({ target, isIntersecting = true }) => ({
                    target,
                    isIntersecting,
                })) as unknown as IntersectionObserverEntry[],
                this as unknown as IntersectionObserver
            );
        }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

    return {
        instances,
        get last(): MockIntersectionObserverInstance {
            return instances[instances.length - 1] as MockIntersectionObserverInstance;
        },
    };
}

/** Replaces requestAnimationFrame with a synchronous runner. */
export function stubAnimationFrame() {
    const raf = vi.fn((callback: FrameRequestCallback) => {
        callback(performance.now());
        return 1;
    });
    const caf = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('cancelAnimationFrame', caf);
    window.requestAnimationFrame = raf as unknown as typeof window.requestAnimationFrame;
    window.cancelAnimationFrame = caf as unknown as typeof window.cancelAnimationFrame;
    return { raf, caf };
}

/** Collects animation frame callbacks so tests can flush them on demand. */
export function deferAnimationFrame() {
    const queue: FrameRequestCallback[] = [];
    const raf = vi.fn((callback: FrameRequestCallback) => queue.push(callback));
    vi.stubGlobal('requestAnimationFrame', raf);
    window.requestAnimationFrame = raf as unknown as typeof window.requestAnimationFrame;
    return {
        raf,
        flush(timestamp: number = performance.now()): void {
            queue.splice(0, queue.length).forEach((callback) => callback(timestamp));
        },
        get pending(): number {
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
    const registered: [string, EventListenerOrEventListenerObject, unknown][] = [];
    const original = document.addEventListener.bind(document);
    vi.spyOn(document, 'addEventListener').mockImplementation((type, handler, options) => {
        registered.push([type, handler as EventListenerOrEventListenerObject, options]);
        original(type, handler, options as AddEventListenerOptions);
    });

    return {
        detachAll(): void {
            registered.splice(0, registered.length).forEach(([type, handler, options]) => {
                document.removeEventListener(type, handler, options as EventListenerOptions);
            });
        },
    };
}

/**
 * Freshly imports a module, bypassing the module cache, so module level state
 * (such as the cached matchMedia queries in core/utilities.ts) is re-evaluated.
 */
export async function importFresh<T>(loader: () => Promise<T>): Promise<T> {
    vi.resetModules();
    return loader();
}
