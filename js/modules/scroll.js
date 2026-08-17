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

    constructor(observerInstance) {
        this.#observer = observerInstance; 
        this.#initialize();
    }

    #initialize() {
        this.#updateScrollButtonState(window.scrollY);

        window.addEventListener("scroll", rafThrottle(() => this.#onScroll()), { passive: true });

        this.#setupScrollToTop();
        this.#setupIntersectionObserver();
        this.#setupSmoothScrolling();
    }

    #onScroll() {
        const currentScrollY = window.scrollY;
        
        // 1. Detect scroll direction instantly via bitwise comparison
        this.#scrollDirection = currentScrollY > this.#lastScrollY?"down":"up";
        this.#lastScrollY = currentScrollY;

        // 2. Update toggle button visibility
        this.#updateScrollButtonState(currentScrollY);
    }

    #updateScrollButtonState(scrollY) {
        if (!this.#scrollButton) return;
        const shouldBeVisible = scrollY > 520;
        if (this.#scrollButton.classList.contains("visible") !== shouldBeVisible) {
            this.#scrollButton.classList.toggle("visible", shouldBeVisible);
        }
    }

    #setupIntersectionObserver() {
        if (!this.#sections.length) return;
        const offsetPct = CONFIG.ACTIVE_SECTION_OFFSET ?? 140; 
        const observerOptions = {
            root: null, // Viewport boundary mapping
            rootMargin: `-${offsetPct}px 0px -60% 0px`, 
            threshold: 0
        };

        const activeObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.#updateActiveSection(entry.target.id);
                }
            });
        }, observerOptions);
        this.#sections.forEach((section) => activeObserver.observe(section));
    }

    #updateActiveSection(sectionId) {
        if (sectionId === this.#activeSection) return;
        this.#activeSection = sectionId;

        requestAnimationFrame(() => {
            this.#links.forEach((link) => {
                const isActive = link.getAttribute("href") === `#${sectionId}`;
                link.classList.toggle("active", isActive);
                // Accessibility tracking updates
                link.setAttribute("aria-current", isActive ?"page":"false");
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

                // Use native browser engine smooth scrolling curves
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

    // Lifecycle cleaning script hook to keep modules leak-free
    destroy() {
        window.removeEventListener("scroll", this.#onScroll);
    }
}