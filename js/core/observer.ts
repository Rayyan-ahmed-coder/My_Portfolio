import { $$ } from "./utilities.js";
import { warn } from "./logger.js";
import type { Disposable } from "./types.js";

export type ObserveTarget = string | Element | Iterable<Element>;

/**
 * Reveals `[data-reveal]` elements as they enter the viewport and unobserves
 * them straight away, so the observer set shrinks as the page is consumed.
 */
export default class ObserverManager implements Disposable {
    #elements = new Set<Element>();
    #observer: IntersectionObserver | null = null;

    static readonly defaultConfig: IntersectionObserverInit = {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px",
    };

    constructor(customConfig: IntersectionObserverInit = {}) {
        if (!("IntersectionObserver" in window)) {
            warn("observer", "IntersectionObserver unsupported; revealing everything eagerly");
            this.#revealFallback();
            return;
        }

        this.#observer = new IntersectionObserver(
            (entries) => this.#handleReveal(entries),
            { ...ObserverManager.defaultConfig, ...customConfig }
        );

        this.observe("[data-reveal]");
    }

    #handleReveal(entries: IntersectionObserverEntry[]): void {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue;

            const { target } = entry;
            target.classList.add("revealed");
            this.#observer?.unobserve(target);
            this.#elements.delete(target);
        }
    }

    /** Tracks elements injected after construction; duplicates are ignored. */
    observe(target: ObserveTarget): void {
        const targets = this.#resolveTargets(target);
        if (!targets.length) return;

        if (!this.#observer) {
            this.#reveal(targets);
            return;
        }

        for (const element of targets) {
            if (this.#elements.has(element)) continue;
            this.#elements.add(element);
            this.#observer.observe(element);
        }
    }

    #resolveTargets(target: ObserveTarget): Element[] {
        if (typeof target === "string") return Array.from($$(target));
        if (target instanceof Element) return [target];

        // Callers reach this from untyped code (JSON payloads, event handlers),
        // so a non-iterable value must not throw inside the observer.
        if (target === null || typeof target !== "object" || !(Symbol.iterator in target)) {
            warn("observer", "Ignoring unsupported observe() target");
            return [];
        }

        return Array.from(target).filter((element): element is Element => element instanceof Element);
    }

    #revealFallback(target: ObserveTarget = "[data-reveal]"): void {
        this.#reveal(this.#resolveTargets(target));
    }

    #reveal(elements: readonly Element[]): void {
        for (const element of elements) element.classList.add("revealed");
    }

    destroy(): void {
        this.#observer?.disconnect();
        this.#observer = null;
        this.#elements.clear();
    }
}
