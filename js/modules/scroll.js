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

    constructor() {
        this.#initialize();
    }

    #initialize() {
        // Fast initial layout check
        this.#updateScrollButtonState(window.scrollY);
        
        // Performance: Passive listener prevents scroll blocking/jank
        window.addEventListener("scroll", rafThrottle(() => this.#onScroll()), { passive: true });

        this.#setupScrollToTop();
        this.#setupIntersectionObserver();
        this.#setupSmoothScrolling();
    }

    #onScroll() {
        const currentScrollY = window.scrollY;
        
        // 1. Detect scroll direction
        this.#scrollDirection = currentScrollY > this.#lastScrollY ? "down" : "up";
        this.#lastScrollY = currentScrollY;

        // 2. Update toggle button visibility
        this.#updateScrollButtonState(currentScrollY);
    }

    #updateScrollButtonState(scrollY) {
        if (!this.#scrollButton) return;
        // Performance: Only modify DOM class list when state changes
        const shouldBeVisible = scrollY > 520;
        this.#scrollButton.classList.toggle("visible", shouldBeVisible);
    }

    #setupIntersectionObserver() {
        if (!this.#sections.length) return;
        // Convert offset pixel config into a top/bottom CSS margin percentage
        const offsetPct = CONFIG.ACTIVE_SECTION_OFFSET?? 100; 
        
        // High Performance: IntersectionObserver offloads scroll math to the browser engine
        const observerOptions = {
            root: null, // Viewport
            rootMargin: `-${offsetPct}px 0px -60% 0px`, // Creates an active 'hit box' near top/mid screen
            threshold: 0
        };

        this.#observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                // We only change focus if the section is actively crossing into our viewing zone
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

        // Performance: Single-pass DOM update batching via requestAnimationFrame
        requestAnimationFrame(() => {
            this.#links.forEach((link) => {
                const isActive = link.getAttribute("href") === `#${sectionId}`;
                link.classList.toggle("active", isActive);
                
                // Accessibility: Tell screen readers which link is visually active
                link.setAttribute("aria-current", isActive ? "page" : "false");
            });
        });
    }

    #setupSmoothScrolling() {
        this.#links.forEach((link) => {
            link.addEventListener("click", (event) => {
                const href = link.getAttribute("href");
                if (!href?.startsWith("#")) return;

                event.preventDefault();

                const target = $(href); // Reuse your helper utility
                if (!target) return;

                // Security: Move focus to the section for keyboard/screen reader users
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
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // Lifecycle cleanup method to prevent memory leaks if components unmount
    destroy() {
        if (this.#observer) {
            this.#observer.disconnect();
        }
    }
}
