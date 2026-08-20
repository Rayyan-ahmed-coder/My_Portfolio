/** Tiny, dependency-free DOM and scheduling helpers shared by every module. */

export type ParentNodeLike = Document | DocumentFragment | Element;

export const $ = <E extends Element = HTMLElement>(
    selector: string,
    parent: ParentNodeLike = document
): E | null => parent.querySelector<E>(selector);

export const $$ = <E extends Element = HTMLElement>(
    selector: string,
    parent: ParentNodeLike = document
): NodeListOf<E> => parent.querySelectorAll<E>(selector);

export const clamp = (value: number, min: number, max: number): number =>
    value < min ? min : value > max ? max : value;

/**
 * matchMedia is missing in non-browser targets and expensive to re-parse, so
 * every query is created at most once and failures degrade to "no match".
 */
const mediaQueryCache = new Map<string, MediaQueryList | null>();

export const mediaQuery = (query: string): MediaQueryList | null => {
    const cached = mediaQueryCache.get(query);
    if (cached !== undefined) return cached;

    const list = typeof window.matchMedia === "function" ? window.matchMedia(query) : null;
    mediaQueryCache.set(query, list);
    return list;
};

export const matchesMedia = (query: string): boolean => mediaQuery(query)?.matches ?? false;

export const MOBILE_QUERY = "(max-width: 850px)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";
export const FINE_POINTER_QUERY = "(pointer: fine)";

export const isMobile = (): boolean => matchesMedia(MOBILE_QUERY);

export const prefersReducedMotion = (): boolean => matchesMedia(REDUCED_MOTION_QUERY);

export const nextFrame = (): Promise<number> =>
    new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Defers non-critical work to browser idle time, falling back to a timeout on
 * engines without requestIdleCallback (Safari).
 */
export const onIdle = (callback: () => void, timeout = 200): void => {
    const idle = window.requestIdleCallback;
    if (typeof idle === "function") {
        idle(() => callback(), { timeout });
        return;
    }
    window.setTimeout(callback, Math.min(timeout, 200));
};

export type Throttled<A extends unknown[]> = ((...args: A) => void) & { cancel(): void };

/** Coalesces bursts of calls (scroll, resize, pointermove) into one per frame. */
export const rafThrottle = <A extends unknown[]>(callback: (...args: A) => void): Throttled<A> => {
    let frameId: number | null = null;
    let scheduled = false;
    let latestArgs: A | null = null;

    const throttled = ((...args: A): void => {
        latestArgs = args;
        if (scheduled) return;
        scheduled = true;

        const id = requestAnimationFrame(() => {
            scheduled = false;
            frameId = null;
            const pending = latestArgs;
            latestArgs = null;
            if (pending) callback(...pending);
        });

        // Guard against a synchronous rAF implementation, where the callback has
        // already run by the time requestAnimationFrame returns its handle.
        if (scheduled) frameId = id;
    }) as Throttled<A>;

    throttled.cancel = (): void => {
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
        scheduled = false;
        latestArgs = null;
    };

    return throttled;
};

export type Debounced<A extends unknown[]> = ((...args: A) => void) & { cancel(): void };

export const debounce = <A extends unknown[]>(
    callback: (...args: A) => void,
    delay = 150
): Debounced<A> => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const debounced = ((...args: A): void => {
        clearTimeout(timeout);
        timeout = setTimeout(() => callback(...args), delay);
    }) as Debounced<A>;

    debounced.cancel = (): void => clearTimeout(timeout);

    return debounced;
};

export interface Unsubscribe {
    (): void;
}

/** addEventListener that hands back its own removal, keeping teardown honest. */
export const listen = <T extends EventTarget, K extends string>(
    target: T,
    type: K,
    handler: (event: Event) => void,
    options?: AddEventListenerOptions
): Unsubscribe => {
    target.addEventListener(type, handler as EventListener, options);
    return () => target.removeEventListener(type, handler as EventListener, options);
};

export const escapeHtml = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>'"]/g, (character) => {
        switch (character) {
            case "&":
                return "&amp;";
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "'":
                return "&#39;";
            default:
                return "&quot;";
        }
    });
};
