import { CONFIG } from "../../src/core/config.js";
import { $, $$, listen, type Unsubscribe } from "../core/utilities.js";
import type { Disposable, ScrollDirection } from "../core/types.js";

export function getSectionScrollTop(
    target: HTMLElement,
    cachedHeaderHeight = 76,
    currentScrollY = typeof window === "undefined" ? 0 : window.scrollY
): number {
    const targetTop = target.getBoundingClientRect().top + currentScrollY - cachedHeaderHeight;
    const maxScroll = typeof document === "undefined" ? 0 : Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(Math.max(0, targetTop), maxScroll);
}

export default class ScrollManager implements Disposable {
    #scrollBtn = $(".scroll-top");
    #header = $(".site-header");
    #sections = Array.from($$("section[id]"));     
    #links = Array.from($$(".nav-link"));

    #lastScrollY = 0;
    #scrollDirection: ScrollDirection = "down";
    #activeSection = "";
    #isManualScrolling = false;
    #manualTimeout = 0;
    #cachedHeaderHeight = 76; // Caching avoids continuous layout thrashing

    #observer: IntersectionObserver | null = null;
    #teardown: Unsubscribe[] = [];

    constructor() {
        this.#init();
    }

    #init(): void {
        this.#measureAndSync();

        // High-performance scroll tracking (zero layout recalculations)
        this.#teardown.push(
            listen(window, "scroll", () => {
                const y = window.scrollY;
                this.#scrollDirection = y > this.#lastScrollY ? "down" : "up";
                this.#lastScrollY = y;
                this.#scrollBtn?.classList.toggle("visible", y > CONFIG.SCROLL_TOP_THRESHOLD);
            }, { passive: true }),

            // Throttled to the next available browser paint frame
            listen(window, "resize", () => {
                requestAnimationFrame(() => this.#measureAndSync());
            }, { passive: true }),

            listen(document, "click", (e) => this.#handleClick(e))
        );

        if ("onscrollend" in window) {
            this.#teardown.push(
                listen(window, "scrollend", () => this.#unlockScroll(), { passive: true })
            );
        }

        this.#setupObserver();
        if (this.#scrollBtn) {
            this.#teardown.push(listen(this.#scrollBtn, "click", () => this.#scrollTo("#home")));
        }
    }

    get direction(): ScrollDirection { return this.#scrollDirection; }
    get activeSection(): string { return this.#activeSection; }

    /** Reads dimensions and batches style updates to rule out forced reflows */
    #measureAndSync(): void {
        if (typeof document === "undefined") return;
        this.#cachedHeaderHeight = Math.max(this.#header?.offsetHeight ?? 0, 76);
        requestAnimationFrame(() => {
            document.documentElement.style.setProperty(
                "--scroll-padding", 
                `${this.#cachedHeaderHeight + 12}px`
            );
        });
    }

    /** IntersectionObserver offloads section detection to the browser compositor thread */
    #setupObserver(): void {
        if (!this.#sections.length || !("IntersectionObserver" in window)) return;
        this.#observer = new IntersectionObserver(
            (entries) => {
                if (this.#isManualScrolling) return;

                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        this.#setActive(entry.target.id);
                        break;
                    }
                }
            },
            {
                rootMargin: `-${this.#cachedHeaderHeight + 20}px 0px -55% 0px`,
                threshold: 0
            }
        );

        for (const s of this.#sections) this.#observer.observe(s);
    }

    #setActive(id: string): void {
        const cleanId = id.replace(/^#/, "");
        if (cleanId === this.#activeSection) return;
        this.#activeSection = cleanId;

        // Optimized Batch execution for link DOM updates
        requestAnimationFrame(() => {
            const totalLinks = this.#links.length;
            for (let i = 0; i < totalLinks; i++) {
                const link = this.#links[i];
                const href = link.getAttribute("href");
                const isActive = href === `#${cleanId}` || (cleanId === "home" && href === "#");
                
                link.classList.toggle("active", isActive);
                link.setAttribute("aria-current", isActive ? "page" : "false");
            }
        });
    }

    #lockScroll(targetId: string): void {
        this.#isManualScrolling = true;
        clearTimeout(this.#manualTimeout);
        this.#setActive(targetId);
        this.#manualTimeout = window.setTimeout(() => this.#unlockScroll(), 800);
    }

    #unlockScroll(): void {
        this.#isManualScrolling = false;
        clearTimeout(this.#manualTimeout);
    }

    #scrollTo(targetSelector: string): void {
        const cleanId = targetSelector.replace(/^#/, "") || "home";
        this.#lockScroll(cleanId);

        if (window.location.hash !== targetSelector) {
            window.history.pushState(null, "", targetSelector);
        }

        if (targetSelector === "#home" || targetSelector === "#") {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        const target = $(targetSelector);
        if (target) {
            target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
            const top = getSectionScrollTop(target, this.#cachedHeaderHeight);
            window.scrollTo({ top, behavior: "smooth" });
        }
    }

    #handleClick(e: Event): void {
        const link = (e.target as Element | null)?.closest<HTMLAnchorElement>(".nav-link");
        const href = link?.getAttribute("href");
        if (!href?.startsWith("#")) return;

        e.preventDefault();
        this.#scrollTo(href === "#" ? "#home" : href);
    }

    destroy(): void {
        this.#unlockScroll();
        this.#observer?.disconnect();
        this.#teardown.forEach((off) => off());
        this.#teardown = [];
    }
}