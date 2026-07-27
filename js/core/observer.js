import { $$ } from "./utilities.js";

export default class ObserverManager {
    /**
     * @param {Object} [config] - Optional custom observer configurations
     */
    constructor(config = {}) {
        this.config =  { ...config };
        this.elements = $$("[data-reveal]");
        this.observer = null;
        
        this.initialize();
    }

    initialize() {
        if (!this.elements.length) return;

        // Fallback for older browsers
        if (!("IntersectionObserver" in window)) {
            this.revealAll();
            return;
        }

        this.observer = new IntersectionObserver(this.handleReveal, {
            threshold: 0.35,
            rootMargin: "0px 0px -50px 0px"
        });

        this.elements.forEach(element => this.observer.observe(element));
    }

    // Arrow function preserves 'this' context perfectly
    handleReveal = (entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            
            entry.target.classList.add("revealed");
            this.observer.unobserve(entry.target);
        });
    };

    revealAll() {
        this.elements.forEach(element => element.classList.add("revealed"));
    }

    observe(selector) {
        document.querySelectorAll(selector).forEach((el) => {
			el.classList.add('hidden');
			if (this.observer) {
				this.observer.observe(el);
			} else {
				el.classList.add('revealed');
			}
		});
    }

    /**
     * Clean up observers to prevent memory leaks when component unmounts
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}