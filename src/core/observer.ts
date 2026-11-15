/**
 * @file observer.ts
 * @description Viewport reveal observer for declarative layouts.
 * @version 1.0.5
 */

import { $$ } from "./utilities.js";
import { warn } from "./logger.js";
import type { Disposable } from "./types.js";

export type ObserveTarget = string | Element | Iterable<Element>;

const REVEAL_SELECTOR = "[data-reveal]";

/** Reveals elements as they approach the viewport without continuous scroll work. */
export default class ObserverManager implements Disposable {
  #elements = new Set<Element>();
  #observer: IntersectionObserver | null = null;
  #rootObserver: MutationObserver | null = null;
  #revealImmediately = false;
  #destroyed = false;

  static readonly defaultConfig: IntersectionObserverInit = {
    threshold: 0,
    rootMargin: "0px 0px 160px 0px",
  };

  constructor(customConfig: IntersectionObserverInit = {}) {
    if (typeof window === "undefined" || typeof document === "undefined") {
      this.#revealImmediately = true;
      return;
    }

    const prefersReducedMotion =
      typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const IntersectionObserverConstructor = window.IntersectionObserver;
    const supportsIntersectionObserver = typeof IntersectionObserverConstructor === "function";

    this.#revealImmediately = prefersReducedMotion || !supportsIntersectionObserver;

    if (!supportsIntersectionObserver && !prefersReducedMotion) {
      warn("observer", "IntersectionObserver unsupported; revealing elements eagerly");
    }

    if (!this.#revealImmediately) {
      this.#observer = new IntersectionObserverConstructor((entries) => this.#handleReveal(entries), {
        ...ObserverManager.defaultConfig,
        ...customConfig,
      });
    }

    this.observe(REVEAL_SELECTOR);
    this.#observeRoot();
  }

  #handleReveal(entries: IntersectionObserverEntry[]): void {
    if (this.#destroyed) return;

    for (const entry of entries) {
      const { target } = entry;
      if (!this.#elements.has(target)) continue;
      if (!target.isConnected) {
        this.#untrack(target);
        continue;
      }
      if (!entry.isIntersecting) continue;

      target.classList.add("revealed");
      this.#untrack(target);
    }
  }

  observe(target: ObserveTarget): void {
    if (this.#destroyed) return;

    if (typeof target === "string") {
      this.#observeElements($$(target));
      return;
    }

    if (typeof Element !== "undefined" && target instanceof Element) {
      this.#observeElement(target);
      return;
    }

    if (target !== null && typeof target === "object" && Symbol.iterator in target) {
      for (const element of target as Iterable<Element>) this.#observeElement(element);
      return;
    }

    warn("observer", "Ignoring unsupported observe target");
  }

  #observeElements(elements: Iterable<Element>): void {
    for (const element of elements) this.#observeElement(element);
  }

  #observeElement(element: Element): void {
    if (typeof Element === "undefined" || !(element instanceof Element)) return;

    if (this.#revealImmediately) {
      element.classList.add("revealed");
      return;
    }

    if (!element.isConnected || element.classList.contains("revealed") || this.#elements.has(element)) return;
    this.#elements.add(element);
    this.#observer?.observe(element);
  }

  #observeRoot(): void {
    const MutationObserverConstructor = window.MutationObserver;
    if (typeof MutationObserverConstructor !== "function") return;

    const root = document.getElementById("root") ?? document.body;
    if (!root) return;

    this.#rootObserver = new MutationObserverConstructor((records) => {
      if (this.#destroyed) return;

      const added = new Set<Element>();

      for (const record of records) {
        for (const node of record.removedNodes) {
          if (!(node instanceof Element)) continue;
          this.#untrackSubtree(node);
        }

        for (const node of record.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (node.matches(REVEAL_SELECTOR)) added.add(node);
          for (const descendant of node.querySelectorAll(REVEAL_SELECTOR)) added.add(descendant);
        }
      }

      if (added.size) this.observe(added);
    });

    this.#rootObserver.observe(root, { childList: true, subtree: true });
  }

  #untrackSubtree(root: Element): void {
    for (const element of this.#elements) {
      if (element === root || root.contains(element)) this.#untrack(element);
    }
  }

  #untrack(element: Element): void {
    if (!this.#elements.delete(element)) return;
    this.#observer?.unobserve(element);
  }

  destroy(): void {
    if (this.#destroyed) return;

    this.#destroyed = true;
    this.#observer?.disconnect();
    this.#rootObserver?.disconnect();
    this.#observer = null;
    this.#rootObserver = null;
    this.#elements.clear();
  }
}
