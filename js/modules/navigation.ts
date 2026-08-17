import { $, $$, MOBILE_QUERY, listen, mediaQuery, type Unsubscribe } from "../core/utilities.js";
import { warn } from "../core/logger.js";
import type { Disposable } from "../core/types.js";

const SCOPE = "navigation";

/**
 * Owns the mobile navigation overlay: the burger button, the `.nav-wrapper.open`
 * state, scroll locking and the accessibility attributes that go with them.
 * Scroll-position tracking lives in modules/scroll.ts.
 */
export default class NavigationManager implements Disposable {
    #toggleButton: HTMLElement | null = $("#menu-toggle");
    #menu: HTMLElement | null = $("#navigation-menu");
    #links: HTMLAnchorElement[];
    #teardown: Unsubscribe[] = [];
    #open = false;
    #lockedBody = false;

    constructor() {
        this.#links = Array.from($$<HTMLAnchorElement>(".nav-link"));

        if (!this.#toggleButton || !this.#menu) {
            warn(SCOPE, "Menu toggle or navigation container missing; mobile menu disabled");
            return;
        }

        this.#initialize(this.#toggleButton, this.#menu);
    }

    #initialize(toggleButton: HTMLElement, menu: HTMLElement): void {
        toggleButton.setAttribute("aria-expanded", "false");

        this.#teardown.push(
            listen(toggleButton, "click", (event) => {
                event.preventDefault();
                this.toggle();
            })
        );

        // One delegated listener closes the overlay for every current and future link.
        this.#teardown.push(
            listen(menu, "click", (event) => {
                const link = (event.target as Element | null)?.closest("a");
                if (link) this.close();
            })
        );

        this.#teardown.push(
            listen(document, "keydown", (event) => {
                if ((event as KeyboardEvent).key === "Escape" && this.#open) this.close();
            })
        );

        const mobile = mediaQuery(MOBILE_QUERY);
        if (mobile?.addEventListener) {
            // Leaving the mobile breakpoint must not leave the page scroll-locked.
            this.#teardown.push(
                listen(mobile, "change", (event) => {
                    if (!(event as MediaQueryListEvent).matches) this.close();
                })
            );
        }
    }

    get isOpen(): boolean {
        return this.#open;
    }

    get links(): readonly HTMLAnchorElement[] {
        return this.#links;
    }

    open(): void {
        if (this.#open || !this.#menu || !this.#toggleButton) return;
        this.#open = true;

        this.#menu.classList.add("open");
        this.#toggleButton.classList.add("active");
        this.#toggleButton.setAttribute("aria-expanded", "true");
        this.#toggleButton.setAttribute("aria-label", "Close navigation menu");

        // Scroll locking is a mobile-overlay concern, and the class is shared with
        // the command palette, so only the owner of the lock releases it.
        if (!document.body.classList.contains("body-locked")) {
            document.body.classList.add("body-locked");
            this.#lockedBody = true;
        }

        this.#links[0]?.focus({ preventScroll: true });
    }

    close(): void {
        if (!this.#open || !this.#menu || !this.#toggleButton) return;
        this.#open = false;

        this.#menu.classList.remove("open");
        this.#toggleButton.classList.remove("active");
        this.#toggleButton.setAttribute("aria-expanded", "false");
        this.#toggleButton.setAttribute("aria-label", "Open navigation menu");

        if (this.#lockedBody) {
            document.body.classList.remove("body-locked");
            this.#lockedBody = false;
        }
    }

    toggle(): void {
        if (this.#open) {
            this.close();
        } else {
            this.open();
        }
    }

    destroy(): void {
        this.close();
        this.#teardown.splice(0).forEach((off) => off());
    }
}
