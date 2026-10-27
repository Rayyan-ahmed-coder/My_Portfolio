/**
 * @file observer.ts
 * @description Viewport Intersection Management Engine for declarative layouts.
 * @version 1.0.4
 * @author Rayyan Khan
 */

import { $$ } from "./utilities.js";
import { warn } from "./logger.js";
import type { Disposable } from "./types.js";

export type ObserveTarget = string | Element | Iterable<Element>;

/** Coordinates responsive element reveal sequences as nodes enter the viewport. */
export default class ObserverManager implements Disposable {
  #elements = new Set<Element>();
  #observer: IntersectionObserver | null = null;

  static readonly defaultConfig: IntersectionObserverInit = {
    threshold: 0.2,
    rootMargin: "0px 0px -50px 0px",
  };

  /**
   * Initializes structural Intersection Observers with default options fallback.
   * @param customConfig Tailored overrides for viewport intersections bounds.
   */
  constructor(customConfig: IntersectionObserverInit = {}) {
    if (!("IntersectionObserver" in window)) {
      warn("observer", "IntersectionObserver unsupported; revealing elements eagerly");
      this.#revealFallback();
      return;
    }

    this.#observer = new IntersectionObserver((entries) => this.#handleReveal(entries), {
      ...ObserverManager.defaultConfig,
      ...customConfig,
    });

    this.observe("[data-reveal]");
  }

  /**
   * Evaluates intersections and cleans queues to prevent memory accumulation.
   * @param entries Active intersection updates batch list.
   */
  #handleReveal(entries: IntersectionObserverEntry[]): void {
    const len = entries.length;
    for (let i = 0; i < len; i++) {
      const entry = entries[i];
      if (!entry.isIntersecting) continue;

      const { target } = entry;
      target.classList.add("revealed");
      this.#observer?.unobserve(target);
      this.#elements.delete(target);
    }
  }

  /**
   * Registers targets for automatic viewport reveal observation tracking.
   * @param target DOM selector text, direct node element, or iterable group.
   */
  observe(target: ObserveTarget): void {
    const targets = this.#resolveTargets(target);
    const len = targets.length;
    if (!len) return;

    if (!this.#observer) {
      this.#reveal(targets);
      return;
    }

    for (let i = 0; i < len; i++) {
      const el = targets[i];
      if (this.#elements.has(el)) continue;
      this.#elements.add(el);
      this.#observer.observe(el);
    }
  }

  /**
   * Normalizes dynamic text selectors, items, or iterables into element arrays.
   * @param target Dynamic incoming structural mapping to parse.
   * @returns Clean parsed element list array ready for subscription tracking.
   */
  #resolveTargets(target: ObserveTarget): Element[] {
    if (typeof target === "string") return Array.from($$(target));
    if (target instanceof Element) return [target];

    if (target === null || typeof target !== "object" || !(Symbol.iterator in target)) {
      warn("observer", "Ignoring unsupported observe target layout");
      return [];
    }

    return Array.from(target).filter((el): el is Element => el instanceof Element);
  }

  /**
   * Instantly reveals elements if intersection observation tools are missing.
   * @param target Fallback selector query path.
   */
  #revealFallback(target: ObserveTarget = "[data-reveal]"): void {
    this.#reveal(this.#resolveTargets(target));
  }

  /**
   * Appends layout classes directly to clear element transitions.
   * @param elements Array collection of elements matching structural bounds.
   */
  #reveal(elements: readonly Element[]): void {
    const len = elements.length;
    for (let i = 0; i < len; i++) {
      elements[i].classList.add("revealed");
    }
  }

  /** Shuts down the observer network and purges residual memory items. */
  destroy(): void {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#elements.clear();
  }
}
