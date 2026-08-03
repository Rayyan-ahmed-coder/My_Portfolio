import { $, $$ } from "../core/utilities.js";
import { CONFIG } from "../core/config.js";

export default class Navigation {
    // True private encapsulation for safety and better optimization
    #header = $(".site-header");
    #menuButton = $("#menu-toggle");
    #navigation = $("#navigation-menu");
    #links = $$(".nav-link");
    #isOpen = false;
    #focusableElements = [];

    constructor() {
        if (!this.#menuButton || !this.#navigation) return;
        this.#initialize();
    }

    #initialize() {
        this.#setupIntersectionObserver();
        this.#setupEventListeners();
    }

    #setupEventListeners() {
        // Core click handlers
        this.#menuButton.addEventListener("click", () => this.toggle());

        this.#links.forEach(link => {
            link.addEventListener("click", () => this.close());
        });

        // Safe dynamic keyboard focus mapping
        const focusSelectors = 'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
        this.#focusableElements = Array.from(this.#navigation.querySelectorAll(focusSelectors));
    }

    /**
     * Blasing Fast Performance: Replaced scroll listeners with an intersection anchor
     * This triggers header styling shifts with 0% scroll events or layout thrashing.
     */
    #setupIntersectionObserver() {
        if (!this.#header) return;

        // Create an invisible 1px trigger point right below the top header zone
        const scrollTrigger = document.createElement("div");
        scrollTrigger.className = "scroll-trigger-anchor";
        scrollTrigger.style.cssText = "position:absolute; top:20px; left:0; width:1px; height:1px; pointer-events:none; visibility:hidden;";
        document.body.prepend(scrollTrigger);

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            // If the 20px trigger point leaves the screen, add the class. Otherwise, remove it.
            this.#header.classList.toggle("scrolled", !entry.isIntersecting);
        }, { root: null, threshold: 0 });

        observer.observe(scrollTrigger);
    }

    toggle() {
        this.#isOpen ? this.close() : this.open();
    }

    open() {
        if (this.#isOpen) return;
        this.#isOpen = true;

        // 1. Structural DOM Updates
        this.#navigation.classList.add("open");
        this.#menuButton.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden"; // Prevent background body scrolling

        // 2. Performance & Security: Attach event listeners ONLY when open
        document.addEventListener("keydown", this.#handleKeyDown);
        document.addEventListener("click", this.#handleOutsideClick, { passive: true });

        // 3. Accessibility: Focus the first focusable interactive link inside the menu
        if (this.#focusableElements.length > 0) {
            requestAnimationFrame(() => this.#focusableElements[0].focus());
        }
    }

    close() {
        if (!this.#isOpen) return;
        this.#isOpen = false;

        // 1. Structural DOM Updates
        this.#navigation.classList.remove("open");
        this.#menuButton.setAttribute("aria-expanded", "false");
        document.body.style.overflow = ""; // Restore scrolling cleanly

        // 2. Resource Cleanup: Instantly detach listeners to save processing power
        document.removeEventListener("keydown", this.#handleKeyDown);
        document.removeEventListener("click", this.#handleOutsideClick);

        // 3. Accessibility: Return focus back to the menu toggle trigger element
        requestAnimationFrame(() => this.#menuButton.focus());
    }

    // Arrow functions maintain execution context explicitly
    #handleKeyDown = (event) => {
        if (event.key === "Escape") {
            this.close();
            return;
        }

        if (event.key === "Tab") {
            this.#handleFocusTrap(event);
        }
    }

    /**
     * High Security Accessibility: Locks keyboard navigation inside the open side drawer
     */
    #handleFocusTrap(event) {
        if (this.#focusableElements.length === 0) return;

        const firstEl = this.#focusableElements[0];
        const lastEl = this.#focusableElements[this.#focusableElements.length - 1];

        if (event.shiftKey) {
            // If pressing Shift + Tab and on the first element, loop around to the last item
            if (document.activeElement === firstEl) {
                lastEl.focus();
                event.preventDefault();
            }
        } else {
            // If pressing Tab and on the last element, loop around back to the first item
            if (document.activeElement === lastEl) {
                firstEl.focus();
                event.preventDefault();
            }
        }
    }

    #handleOutsideClick = (event) => {
        const target = event.target;
        // Optimization: Quick pointer comparison matches before complex DOM tree traversal paths
        if (this.#navigation.contains(target) || this.#menuButton.contains(target)) {
            return;
        }
        this.close();
    }
}
