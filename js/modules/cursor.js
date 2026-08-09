import { createEl, toggleClass } from "../core/utilities.js";

export default class CustomCursor {
    // Private properties for fast engine execution
    #cursor = null;
    #mouseX = 0;
    #mouseY = 0;
    #currentX = 0;
    #currentY = 0;
    #isMoving = false;
    #rafId = null;
    #lastMoveTime = 0;
    #closeness = 0.55;

    #boundMouseMove = null;
    #boundMouseOver = null;

    constructor() {
        if (window.matchMedia('(pointer: fine)').matches) {
            this.#createCursorElement();
            this.#init();
        }
    }

    #createCursorElement() {
        this.#cursor = createEl('div', 'cursor');
        
        Object.assign(this.#cursor.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            pointerEvents: 'none',
            display: 'none',
            willChange: 'transform'
        });
        document.body.appendChild(this.#cursor);
    }

    #init() {
        this.#lastMoveTime = performance.now();
        this.#boundMouseMove = (e) => this.#onMouseMove(e);
        this.#boundMouseOver = (e) => this.#handleInteractivity(e);

        window.addEventListener('mousemove', this.#boundMouseMove, { passive: true });
        window.addEventListener('mouseover', this.#boundMouseOver, { passive: true });
    }

    #onMouseMove(e) {
        this.#mouseX = e.clientX;
        this.#mouseY = e.clientY;
        this.#lastMoveTime = performance.now(); 

        if (this.#closeness >= 1) {
            this.#cursor.style.display = 'block';
            this.#applyPosition(this.#mouseX, this.#mouseY);
            return;
        }

        // Standard fallback path for tracking fluid drag values below 1
        if (!this.#isMoving) {
            this.#isMoving = true;
            this.#cursor.style.display = 'block';
            
            if (!this.#rafId) {
                this.#rafId = requestAnimationFrame((timestamp) => this.#tick(timestamp));
            }
        }
    }

    #tick(timestamp) {
        // This loop handles smooth glide physics tracking ONLY if closeness is less than 1
        this.#currentX += (this.#mouseX - this.#currentX) * this.#closeness;
        this.#currentY += (this.#mouseY - this.#currentY) * this.#closeness;

        this.#applyPosition(this.#currentX, this.#currentY);

        const deltaX = this.#mouseX - this.#currentX;
        const deltaY = this.#mouseY - this.#currentY;
        const distanceSquared = (deltaX * deltaX) + (deltaY * deltaY);

        if (distanceSquared < 0.01 && timestamp - this.#lastMoveTime > 1200) {
            this.#cursor.style.display = 'none';
            this.#isMoving = false;
            this.#rafId = null; 
            return;
        }

        this.#rafId = requestAnimationFrame((t) => this.#tick(t));
    }

    #applyPosition(x, y) {
        this.#cursor.style.transform = `translate3d(${Math.round(x - 10)}px, ${Math.round(y - 10)}px, 0)`;
    }

    #handleInteractivity(e) {
        const target = e.target;
        if (!target) return;

        const isInteractive = 
            target.tagName === 'A' || 
            target.tagName === 'BUTTON' || 
            target.classList.contains('interactive') || 
            target.closest('a, button, .interactive');

        toggleClass(this.#cursor, 'active', Boolean(isInteractive));
    }

    destroy() {
        if (this.#rafId) cancelAnimationFrame(this.#rafId);
        window.removeEventListener('mousemove', this.#boundMouseMove);
        window.removeEventListener('mouseover', this.#boundMouseOver);
        if (this.#cursor) this.#cursor.remove();
    }
}