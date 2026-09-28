/** Tiny, dependency-free DOM and scheduling helpers shared by every module. */

export type ParentNodeLike = Document | DocumentFragment | Element;

export const $ = <E extends Element = HTMLElement>(
    s: string,
    p: ParentNodeLike = document
): E | null => p.querySelector<E>(s);

export const $$ = <E extends Element = HTMLElement>(
    s: string,
    p: ParentNodeLike = document
): NodeListOf<E> => p.querySelectorAll<E>(s);

export const clamp = (v: number, min: number, max: number): number =>
    v < min ? min : v > max ? max : v;

const mqCache = new Map<string, MediaQueryList | null>();

export const mediaQuery = (q: string): MediaQueryList | null => {
    if (typeof window === "undefined" || !window.matchMedia) return null;
    if (!mqCache.has(q)) mqCache.set(q, window.matchMedia(q));
    return mqCache.get(q)!;
};

export const clearMediaQueryCache = (): void => mqCache.clear();
export const matchesMedia = (q: string): boolean => mediaQuery(q)?.matches ?? false;

export const MOBILE_QUERY = "(max-width: 850px)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";
export const FINE_POINTER_QUERY = "(pointer: fine)";

export const isMobile = (): boolean => matchesMedia(MOBILE_QUERY);
export const prefersReducedMotion = (): boolean => matchesMedia(REDUCED_MOTION_QUERY);

export const nextFrame = (): Promise<number> =>
    new Promise((r) => requestAnimationFrame(r));

export const onIdle = (
    cb: (deadline: IdleDeadline | { didTimeout: boolean; timeRemaining: () => number }) => void,
    timeout = 200
): void => {
    if (typeof window !== "undefined" && window.requestIdleCallback) {
        window.requestIdleCallback(cb, { timeout });
    } else {
        const start = Date.now();
        setTimeout(() => cb({ didTimeout: false, timeRemaining: () => Math.max(0, 50 - (Date.now() - start)) }), Math.min(timeout, 200));
    }
};

export type Throttled<A extends unknown[]> = ((...args: A) => void) & { cancel(): void };

export const rafThrottle = <A extends unknown[]>(cb: (...args: A) => void): Throttled<A> => {
    let id: number | null = null;
    let lastArgs: A | null = null;

    const fn = ((...args: A): void => {
        lastArgs = args;
        if (id !== null) return;
        id = requestAnimationFrame(() => {
            id = null;
            if (lastArgs) {
                const a = lastArgs;
                lastArgs = null;
                cb(...a);
            }
        });
    }) as Throttled<A>;

    fn.cancel = (): void => {
        if (id !== null) cancelAnimationFrame(id);
        id = lastArgs = null;
    };

    return fn;
};

export type Debounced<A extends unknown[]> = ((...args: A) => void) & { cancel(): void };

export const debounce = <A extends unknown[]>(
    cb: (...args: A) => void,
    delay = 150
): Debounced<A> => {
    let t: ReturnType<typeof setTimeout> | undefined;

    const fn = ((...args: A): void => {
        if (t !== undefined) clearTimeout(t);
        t = setTimeout(() => cb(...args), delay);
    }) as Debounced<A>;

    fn.cancel = (): void => {
        if (t !== undefined) clearTimeout(t);
        t = undefined;
    };

    return fn;
};

export type Unsubscribe = () => void;

/** Strongly-typed event listener with automatic cleanup. */
export const listen = <
    T extends EventTarget,
    E extends Event = T extends Window
        ? WindowEventMap[keyof WindowEventMap]
        : T extends Document
        ? DocumentEventMap[keyof DocumentEventMap]
        : T extends HTMLElement
        ? HTMLElementEventMap[keyof HTMLElementEventMap]
        : Event
>(
    target: T,
    type: string,
    handler: (event: E) => void,
    options?: AddEventListenerOptions | boolean
): Unsubscribe => {
    target.addEventListener(type, handler as EventListener, options);
    return () => target.removeEventListener(type, handler as EventListener, options);
};

const MAP: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };

export const escapeHtml = (v: unknown): string =>
    v == null ? "" : String(v).replace(/[&<>'"]/g, (c) => MAP[c]);