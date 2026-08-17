import { $, $$, rafThrottle } from "../core/utilities.js";
import { CONFIG } from "../core/config.js";

export default class ScrollManager {
    #scrollButton = $(".scroll-top");
    #sections = $$("section[id]");
    #links = $$(".nav-link");
    #lastScrollY = 0;
    #scrollDirection = "down";
    #activeSection = "";
    #observer = null;
    
    // Cache the thinned callback execution reference to fix the memory leak bug
    #throttledScrollHandler = null;

    constructor(observerInstance) {
        this.#observer = observerInstance; 
        this.#initialize();
    }

    #initialize() {
        // Fast initial layout pass reading values instantly
        this.#updateScrollButtonState(window.scrollY);
        
        // FIXED: Cache the throttled reference locally so it can be unmounted safely later
        this.#throttledScrollHandler = rafThrottle(() => this.#onScroll());
        
        // PERFORMANCE WIN: 'passive: true' lets the compositor thread slide immediately 
        // without waiting for JS evaluation pipelines to finish executing.
        window.addEventListener("scroll", this.#throttledScrollHandler, { passive: true });

        this.#setupScrollToTop();
        this.#setupIntersectionObserver();
        this.#setupSmoothScrolling();
    }

    #onScroll() {
        const currentScrollY = window.scrollY;
        
        // Direct, hyper-fast scroll comparison logic
        this.#scrollDirection = currentScrollY > this.#lastScrollY ? "down" : "up";
        this.#lastScrollY = currentScrollY;

        this.#updateScrollButtonState(currentScrollY);
    }

    #updateScrollButtonState(scrollY) {
        if (!this.#scrollButton) return;
        
        // PERFORMANCE WIN: Avoid writing/mutating classList on every single mouse tick.
        // It strictly updates ONLY when crossing the 520px threshold layout gate.
        const shouldBeVisible = scrollY > 520;
        if (this.#scrollButton.classList.contains("visible") !== shouldBeVisible) {
            // requestAnimationFrame guarantees the toggle animation won't interrupt scroll frames
            requestAnimationFrame(() => {
                this.#scrollButton.classList.toggle("visible", shouldBeVisible);
            });
        }
    }

    #setupIntersectionObserver() {
        if (!this.#sections.length) return;
        
        const offsetPct = CONFIG.ACTIVE_SECTION_OFFSET ?? 100; 
        
        // HIGH PERFORMANCE: IntersectionObserver operates natively off the Main Thread.
        // No manual bounding rect mathematics or scroll calculation polling.
        const observerOptions = {
            root: null, 
            rootMargin: `-${offsetPct}px 0px -60% 0px`, 
            threshold: 0
        };

        this.#observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                // HIGH SPEED: Only process active intersection triggers to save CPU overhead
                if (entry.isIntersecting) {
                    this.#updateActiveSection(entry.target.id);
                }
            });
        }, observerOptions);

        this.#sections.forEach((section) => this.#observer.observe(section));
    }

    #updateActiveSection(sectionId) {
        if (sectionId === this.#activeSection) return;
        this.#activeSection = sectionId;

        requestAnimationFrame(() => {
            this.#links.forEach((link) => {
                const isActive = link.getAttribute("href") === `#${sectionId}`;
                
                if (link.classList.contains("active") !== isActive) {
                    link.classList.toggle("active", isActive);
                    link.setAttribute("aria-current", isActive ? "page" : "false");
                }
            });
        });
    }

    #setupSmoothScrolling() {
        this.#links.forEach((link) => {
            link.addEventListener("click", (event) => {
                const href = link.getAttribute("href");
                if (!href?.startsWith("#")) return;
                event.preventDefault();
                const target = $(href); 
                if (!target) return;

                target.setAttribute('tabindex', '-1');
                target.focus({ preventScroll: true });

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });
        });
    }

    #setupScrollToTop() {
        if (!this.#scrollButton) return;
        this.#scrollButton.addEventListener("click", () => {
            window.scrollTo({ 
                top: 0, 
                behavior: "smooth" 
            });
        });
    }

    destroy() {
        if (this.#throttledScrollHandler) {
            window.removeEventListener("scroll", this.#throttledScrollHandler);
        }
        if (this.#observer) {
            this.#observer.disconnect();
        }
    }
}