import { CONFIG } from "../core/config.js";
import { $, $$, listen, rafThrottle, type Throttled, type Unsubscribe } from "../core/utilities.js";
import type { Disposable, ScrollDirection } from "../core/types.js";

/**
 * Tracks scroll position to sync the active nav link and the back-to-top
 * button. Section tracking is delegated to IntersectionObserver, and class
 * writes are gated so scrolling never invalidates layout needlessly.
 */
export default class ScrollManager implements Disposable {
    #scrollButton: HTMLElement | null = $(".scroll-top");
    #sections: HTMLElement[] = Array.from($$<HTMLElement>("section[id]"));
    #links: HTMLAnchorElement[] = Array.from($$<HTMLAnchorElement>(".nav-link"));
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
        this.#updateScrollButtonState(window.scrollY);

        // The throttled reference is cached so destroy() can detach the exact handler.
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
            for (const link of this.#links) {
                const isActive = link.getAttribute("href") === `#${sectionId}`;
                if (link.classList.contains("active") === isActive) continue;

                link.classList.toggle("active", isActive);
                link.setAttribute("aria-current", isActive ? "page" : "false");
            }
        });
    }

    /** Single delegated listener handles every in-page anchor. */
    #setupSmoothScrolling(): void {
        this.#teardown.push(
            listen(document, "click", (event) => {
                const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(".nav-link");
                const href = link?.getAttribute("href");
                if (!href?.startsWith("#") || href === "#") return;

                const target = $(href);
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
