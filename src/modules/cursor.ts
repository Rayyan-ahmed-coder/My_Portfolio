import { FINE_POINTER_QUERY, listen, matchesMedia, type Unsubscribe } from "../../src/core/utilities.js";
import type { Disposable } from "../../src/core/types.js";

const CURSOR_SIZE_OFFSET = 10;
const IDLE_HIDE_DELAY_MS = 1200;
const INTERACTIVE_SELECTOR = "a, button, .interactive, [role='button']";

/** Smoothed custom cursor, active only for fine pointers and motion-enabled visitors. */
export default class CustomCursor implements Disposable {
    #cursor: HTMLElement | null = null;
    #mouseX = 0;
    #mouseY = 0;
    #currentX = 0;
    #currentY = 0;
    #isAnimating = false;
    #rafId: number | null = null;
    #hideTimeout: number | null = null;
    #lastMoveTime = 0;
    #isActiveState = false;
    #glide = 0.55;
    #teardown: Unsubscribe[] = [];

    constructor() {
        if (!matchesMedia(FINE_POINTER_QUERY)) return;

        this.#createCursorElement();
        this.#init();
    }

    get element(): HTMLElement | null {
        return this.#cursor;
    }

    #createCursorElement(): void {
        const cursor = document.createElement("div");
        cursor.className = "cursor";
        cursor.setAttribute("aria-hidden", "true");
        Object.assign(cursor.style, {
            position: "fixed",
            top: "0",
            left: "0",
            pointerEvents: "none",
            display: "none",
            willChange: "transform",
        } satisfies Partial<CSSStyleDeclaration>);

        document.documentElement.classList.add("cursor-enabled");
        document.body.appendChild(cursor);
        this.#cursor = cursor;
    }

    #init(): void {
        this.#lastMoveTime = performance.now();
        this.#teardown.push(
            listen(window, "mousemove", (event) => this.#onMouseMove(event as MouseEvent), { passive: true }),
            listen(window, "mouseover", (event) => this.#handleInteractivity(event as MouseEvent), { passive: true }),
        );
    }

    #onMouseMove(event: MouseEvent): void {
        const cursor = this.#cursor;
        if (!cursor) return;
        this.#mouseX = event.clientX;
        this.#mouseY = event.clientY;
        this.#lastMoveTime = performance.now();
        if (this.#hideTimeout !== null) {
            window.clearTimeout(this.#hideTimeout);
            this.#hideTimeout = null;
        }
        if (this.#isAnimating) return;
        this.#isAnimating = true;
        cursor.style.display = "block";
        this.#rafId ??= requestAnimationFrame((timestamp) => this.#tick(timestamp));
    }

    #tick(timestamp: number): void {
        const cursor = this.#cursor;
        if (!cursor) return;
        this.#currentX += (this.#mouseX - this.#currentX) * this.#glide;
        this.#currentY += (this.#mouseY - this.#currentY) * this.#glide;
        this.#paint(this.#currentX, this.#currentY);
        const deltaX = this.#mouseX - this.#currentX;
        const deltaY = this.#mouseY - this.#currentY;
        if (deltaX * deltaX + deltaY * deltaY < 0.01) {
            this.#isAnimating = false;
            this.#rafId = null;
            const hideDelay = Math.max(0, IDLE_HIDE_DELAY_MS - (timestamp - this.#lastMoveTime));
            this.#hideTimeout = window.setTimeout(() => {
                if (!this.#isAnimating && this.#cursor) this.#cursor.style.display = "none";
                this.#hideTimeout = null;
            }, hideDelay);
            return;
        }
        this.#rafId = requestAnimationFrame((next) => this.#tick(next));
    }

    #paint(x: number, y: number): void {
        const scale = this.#isActiveState ? 1.6 : 1;
        this.#cursor?.style.setProperty(
            "transform",
            `translate3d(${Math.round(x - CURSOR_SIZE_OFFSET)}px, ${Math.round(y - CURSOR_SIZE_OFFSET)}px, 0) scale(${scale})`
        );
    }

    #handleInteractivity(event: MouseEvent): void {
        const target = event.target;
        if (!this.#cursor || !(target instanceof Element)) return;
        const isInteractive = target.closest(INTERACTIVE_SELECTOR) !== null;
        if (isInteractive === this.#isActiveState) return;
        this.#isActiveState = isInteractive;
        this.#cursor.classList.toggle("active", isInteractive);
    }

    destroy(): void {
        if (this.#rafId !== null) cancelAnimationFrame(this.#rafId);
        if (this.#hideTimeout !== null) window.clearTimeout(this.#hideTimeout);
        this.#rafId = null;
        this.#hideTimeout = null;
        this.#isAnimating = false;
        this.#teardown.splice(0).forEach((off) => off());
        this.#cursor?.remove();
        this.#cursor = null;
    }
}
