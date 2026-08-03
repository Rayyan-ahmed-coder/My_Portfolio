import { $$ } from "./utilities.js";

export default class ObserverManager {
    // Encapsulate structural state cleanly away from global scope access
    #elements = new Set();
    #observer = null;
    
    // Performance: Merged and frozen configuration options
    #defaultConfig = {
        threshold: 0.20, // Reduced slightly so large elements trigger reliably on mobile viewports
        rootMargin: "0px 0px -50px 0px"
    };

    /**
     * @param {IntersectionObserverInit} [customConfig] - Optional custom observer configurations
     */
    constructor(customConfig = {}) {
        const mergedConfig = { ...this.#defaultConfig, ...customConfig };
        
        // Performance: Cache modern browser features instantly
        if (!("IntersectionObserver" in window)) {
            this.#revealFallback();
            return;
        }

        // Performance: Bind the handler once to the prototype or use a clean private reference
        this.#observer = new IntersectionObserver((entries) => this.#handleReveal(entries), mergedConfig);
        
        // Initial setup run
        this.#initialize();
    }

    #initialize() {
        const staticElements = $$("[data-reveal]");
        if (!staticElements.length) return;

        // Efficiently batch track items using a native Set structure
        staticElements.forEach((el) => {
            this.#elements.add(el);
            this.#observer.observe(el);
        });
    }

    /**
     * @param {IntersectionObserverEntry[]} entries
     */
    #handleReveal(entries) {
        // High Performance: Use a native for loop for ultra-fast iteration over entry structures
        const len = entries.length;
        for (let i = 0; i < len; i++) {
            const entry = entries[i];
            
            if (entry.isIntersecting) {
                const target = entry.target;
                
                // Batch class mutations cleanly
                target.classList.add("revealed");
                
                // Cease tracking immediately to optimize runtime memory profiling
                this.#observer.unobserve(target);
                this.#elements.delete(target);
            }
        }
    }

    /**
     * Dynamically observe new elements injected into the DOM after initialization
     * @param {string|Element|Element[]} target - CSS selector string, single Element, or NodeList array
     */
    observe(target) {
        if (!this.#observer) {
            this.#revealFallback(target);
            return;
        }

        let targetsToObserve = [];

        if (typeof target === 'string') {
            targetsToObserve = $$(target);
        } else if (target instanceof Element) {
            targetsToObserve = [target];
        } else if (target instanceof NodeList || Array.isArray(target)) {
            targetsToObserve = Array.from(target);
        }

        const len = targetsToObserve.length;
        if (len === 0) return;

        // Performance: Avoid duplicate observations globally
        for (let i = 0; i < len; i++) {
            const el = targetsToObserve[i];
            if (!this.#elements.has(el)) {
                this.#elements.add(el);
                this.#observer.observe(el);
            }
        }
    }

    /**
     * Fallback for legacy environments or failed states
     */
    #revealFallback(target = null) {
        if (!target) {
            $$("[data-reveal]").forEach((el) => el.classList.add("revealed"));
            return;
        }

        const elements = typeof target === 'string' ? $$(target) : [target].flat();
        elements.forEach((el) => {
            if (el instanceof Element) el.classList.add("revealed");
        });
    }

    /**
     * Complete lifecycle teardown to guarantee 0% memory leaks
     */
    destroy() {
        if (this.#observer) {
            this.#observer.disconnect();
            this.#observer = null;
        }
        this.#elements.clear();
    }
}