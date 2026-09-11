import { CONFIG } from "../../src/core/config.js";
import { $, $$, listen, rafThrottle, type Throttled, type Unsubscribe } from "../../src/core/utilities.js";
import type { Disposable, ScrollDirection } from "../../src/core/types.js";

export default class ScrollManager implements Disposable {
    #scrollButton: HTMLElement | null = null;
    #sections: HTMLElement[] = [];
    #links: HTMLAnchorElement[] = [];
    #lastScrollY = 0;
    #scrollDirection: ScrollDirection = "down";
    #activeSection = "";
    #sectionObserver: IntersectionObserver | null = null;
    #throttledScroll: Throttled<[]> | null = null;
    #teardown: Unsubscribe[] = [];

    constructor() {
        this.#initialize();
    }

    #initialize(): void {
        this.#scrollButton = $(".scroll-top");
        this.#sections = Array.from($$<HTMLElement>("section[id]"));
        this.#links = Array.from($$<HTMLAnchorElement>(".nav-link"));

        this.#updateScrollButtonState(window.scrollY);

        this.#throttledScroll = rafThrottle(() => this.#onScroll());
        this.#teardown.push(
            listen(window, "scroll", this.#throttledScroll, { passive: true })
        );

        this.#setupScrollToTop();
        this.#setupSectionObserver();
        this.#setupSmoothScrolling();
    }

    get direction(): ScrollDirection {
        return this.#scrollDirection;
    }

    get activeSection(): string {
        return this.#activeSection;
    }

    #onScroll(): void {
        const currentScrollY = window.scrollY;
        this.#scrollDirection = currentScrollY > this.#lastScrollY ? "down" : "up";
        this.#lastScrollY = currentScrollY;
        this.#updateScrollButtonState(currentScrollY);
    }

    #updateScrollButtonState(scrollY: number): void {
        const button = this.#scrollButton;
        if (!button) return;
        const shouldBeVisible = scrollY > CONFIG.SCROLL_TOP_THRESHOLD;
        if (button.classList.contains("visible") === shouldBeVisible) return;
        button.classList.toggle("visible", shouldBeVisible);
    }

    #setupSectionObserver(): void {
        if (!this.#sections.length || !("IntersectionObserver" in window)) return;
        this.#sectionObserver = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) this.#updateActiveSection(entry.target.id);
                }
            },
            {
                root: null,
                rootMargin: `-${CONFIG.ACTIVE_SECTION_OFFSET}px 0px -60% 0px`,
                threshold: 0,
            }
        );

        for (const section of this.#sections) this.#sectionObserver.observe(section);
    }

    #updateActiveSection(sectionId: string): void {
        if (sectionId === this.#activeSection) return;
        this.#activeSection = sectionId;

        requestAnimationFrame(() => {
            if (!this.#links.length) {
                this.#links = Array.from($$<HTMLAnchorElement>(".nav-link"));
            }

            for (const link of this.#links) {
                const href = link.getAttribute("href");
                const isActive = href === `#${sectionId}` || (sectionId === "home" && href === "#");
                
                if (link.classList.contains("active") === isActive) continue;

                link.classList.toggle("active", isActive);
                link.setAttribute("aria-current", isActive ? "page" : "false");
            }
        });
    }

    #setupSmoothScrolling(): void {
        this.#teardown.push(
            listen(document, "click", (event) => {
                const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(".nav-link");
                const href = link?.getAttribute("href");
                if (!href?.startsWith("#")) return;

                const targetId = href === "#" ? "#home" : href;
                const target = $(targetId);
                if (!target) return;

                event.preventDefault();
                target.setAttribute("tabindex", "-1");
                target.focus({ preventScroll: true });
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            })
        );
    }

    #setupScrollToTop(): void {
        const button = this.#scrollButton;
        if (!button) return;

        this.#teardown.push(
            listen(button, "click", () => window.scrollTo({ top: 0, behavior: "smooth" }))
        );
    }

    destroy(): void {
        this.#throttledScroll?.cancel();
        this.#throttledScroll = null;
        this.#sectionObserver?.disconnect();
        this.#sectionObserver = null;
        this.#teardown.splice(0).forEach((off) => off());
    }
}