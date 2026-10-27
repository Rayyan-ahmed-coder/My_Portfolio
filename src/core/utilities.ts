/**
 * @file utilities.ts
 * @description Micro-optimized DOM proxies, scheduling lifecycles, and fast event bridges.
 * @version 1.0.4
 * @author Rayyan Khan
 */

export type ParentNodeLike = Document | DocumentFragment | Element;

/**
 * Fast element interceptor matching a query string selector.
 * @template E Implicit component boundary extension matching concrete HTML elements.
 * @param s Query selector tracking target.
 * @param p Context root parent bounding element.
 * @returns Located element reference matching parameters, or null.
 */
export const $ = <E extends Element = HTMLElement>(s: string, p: ParentNodeLike = document): E | null =>
  p.querySelector<E>(s);

/**
 * Aggregates all layout nodes matching a selector string criteria query.
 * @template E Structural mapping configuration element context.
 * @param s Grouping query selector criteria layout.
 * @param p Context root parent bounding element.
 * @returns Match collection nodelist array.
 */
export const $$ = <E extends Element = HTMLElement>(s: string, p: ParentNodeLike = document): NodeListOf<E> =>
  p.querySelectorAll<E>(s);

/**
 * Confines numeric parameters safely inside explicit min/max thresholds.
 * @param v Value to evaluate.
 * @param min Floor parameter boundary limit.
 * @param max Ceiling parameter boundary limit.
 * @returns Safe mathematically constrained number output.
 */
export const clamp = (v: number, min: number, max: number): number => (v < min ? min : v > max ? max : v);

const mqCache = new Map<string, MediaQueryList | null>();

/**
 * Evaluates system media queries using a local cache buffer to protect RAM.
 * @param q Target CSS Media Query rule layout.
 * @returns Active window media query tracker connection state.
 */
export const mediaQuery = (q: string): MediaQueryList | null => {
  if (typeof window === "undefined" || !window.matchMedia) return null;

  let cached = mqCache.get(q);
  if (cached === undefined) {
    cached = window.matchMedia(q);
    mqCache.set(q, cached);
  }
  return cached;
};

/** Purges the internal media query cache mapping to reclaim memory. */
export const clearMediaQueryCache = (): void => mqCache.clear();

/**
 * Confirms if a specified CSS media layout constraint validates as true.
 * @param q Target media condition match sequence.
 * @returns True if active browser window context conforms to media specification.
 */
export const matchesMedia = (q: string): boolean => mediaQuery(q)?.matches ?? false;

export const MOBILE_QUERY = "(max-width: 850px)";
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";
export const FINE_POINTER_QUERY = "(pointer: fine)";

/** Confirms if the active viewing canvas matches mobile dimensions. */
export const isMobile = (): boolean => matchesMedia(MOBILE_QUERY);

/** Evaluates whether the system configuration dictates reduced motion styles. */
export const prefersReducedMotion = (): boolean => matchesMedia(REDUCED_MOTION_QUERY);

/** Defers asynchronous loops to synchronize smoothly with the next display repaint frame. */
export const nextFrame = (): Promise<number> => new Promise((r) => requestAnimationFrame(r));

/**
 * Postpones low-priority execution routines until the main thread hits an idle state.
 * @param cb Core execution callback function routing line.
 * @param timeout Allocation timeframe cutoff point before forcing task execution.
 */
export const onIdle = (
  cb: (deadline: IdleDeadline | { didTimeout: boolean; timeRemaining: () => number }) => void,
  timeout = 200,
): void => {
  if (typeof window !== "undefined" && window.requestIdleCallback) {
    window.requestIdleCallback(cb, { timeout });
  } else {
    const start = Date.now();
    setTimeout(
      () => cb({ didTimeout: false, timeRemaining: () => Math.max(0, 50 - (Date.now() - start)) }),
      Math.min(timeout, 200),
    );
  }
};

export type Throttled<A extends unknown[]> = ((...args: A) => void) & { cancel(): void };

/**
 * Syncs high-frequency callbacks with monitor paint refresh cycles using requestAnimationFrame.
 * @template A Inferred argument properties array profile mapping.
 * @param cb Method target function payload to restrict.
 * @returns Optimized wrapper setup paired with manual cancel controls.
 */
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

/**
 * Delays functional execution loops until a specific cool-down window has elapsed.
 * @template A Parameter argument checklist signatures sequence tracking map.
 * @param cb Processing callback logic block function.
 * @param delay Timeout window boundary tracker in milliseconds.
 * @returns Clean interface wrapper complete with manual reset triggers.
 */
export const debounce = <A extends unknown[]>(cb: (...args: A) => void, delay = 150): Debounced<A> => {
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

/**
 * Binds type-safe element listeners and returns an automatic subscription cleanup handle.
 * @template T Inferred element context node.
 * @template E Evaluated dynamic structural event schema.
 * @param target Target node context element interface row.
 * @param type Operational browser transaction trigger category.
 * @param handler Structural execution logic loop to process.
 * @param options Priority parameter configuration properties.
 * @returns Automated tracking destruction unsubscribe callback function.
 */
export const listen = <
  T extends EventTarget,
  E extends Event = T extends Window
    ? WindowEventMap[keyof WindowEventMap]
    : T extends Document
      ? DocumentEventMap[keyof DocumentEventMap]
      : T extends HTMLElement
        ? HTMLElementEventMap[keyof HTMLElementEventMap]
        : Event,
>(
  target: T,
  type: string,
  handler: (event: E) => void,
  options?: AddEventListenerOptions | boolean,
): Unsubscribe => {
  target.addEventListener(type, handler as EventListener, options);
  return () => target.removeEventListener(type, handler as EventListener, options);
};

const MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
};

/**
 * Encodes potentially hostile string patterns to shield layouts from XSS vectors.
 * @param v Raw untyped alphanumeric data variable parameter inputs.
 * @returns Escaped text safe to bind into templates.
 */
export const escapeHtml = (v: unknown): string => (v == null ? "" : String(v).replace(/[&<>'"]/g, (c) => MAP[c]));
