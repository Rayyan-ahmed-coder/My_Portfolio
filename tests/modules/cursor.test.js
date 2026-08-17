import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CustomCursor from '../../js/modules/cursor.js';
import { stubMatchMedia, deferAnimationFrame } from '../helpers.js';

const FINE_POINTER = '(pointer: fine)';

const move = (clientX, clientY) =>
    window.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY }));

const hover = (target) => {
    const event = new MouseEvent('mouseover', { bubbles: true });
    target.dispatchEvent(event);
};

describe('modules/cursor', () => {
    let frames;
    let instances;

    // The cursor binds window listeners, so every instance is torn down between
    // tests to keep the shared jsdom window clean.
    const createCursor = () => {
        const cursor = new CustomCursor();
        instances.push(cursor);
        return cursor;
    };

    beforeEach(() => {
        stubMatchMedia({ [FINE_POINTER]: true });
        frames = deferAnimationFrame();
        instances = [];
    });

    afterEach(() => {
        instances.forEach((cursor) => cursor.destroy());
    });

    describe('pointer capability gate', () => {
        it('creates a hidden cursor element for fine pointers', () => {
            createCursor();

            const cursor = document.querySelector('.cursor');
            expect(cursor).not.toBeNull();
            expect(cursor.style.position).toBe('fixed');
            expect(cursor.style.display).toBe('none');
            expect(cursor.style.pointerEvents).toBe('none');
        });

        it('does nothing on coarse pointer devices', () => {
            stubMatchMedia(false);

            createCursor();
            move(10, 10);

            expect(document.querySelector('.cursor')).toBeNull();
            expect(frames.pending).toBe(0);
        });
    });

    describe('mouse tracking', () => {
        it('shows the cursor and schedules the glide loop on first move', () => {
            createCursor();

            move(100, 200);

            const cursor = document.querySelector('.cursor');
            expect(cursor.style.display).toBe('block');
            expect(frames.pending).toBe(1);
        });

        it('eases the cursor toward the pointer on each frame', () => {
            createCursor();
            move(100, 100);

            frames.flush(0);
            // closeness 0.55 => 55px of the 100px distance, minus the 10px hotspot offset
            expect(document.querySelector('.cursor').style.transform).toBe('translate3d(45px, 45px, 0)');

            frames.flush(0);
            expect(document.querySelector('.cursor').style.transform).toBe('translate3d(70px, 70px, 0)');
        });

        it('keeps requesting frames while the pointer keeps moving', () => {
            createCursor();
            move(100, 100);

            frames.flush(0);

            expect(frames.pending).toBe(1);
        });

        it('hides the cursor once it settles and the pointer has been idle', () => {
            createCursor();
            move(0, 0);

            // Idle for longer than the 1200ms timeout with no distance left to travel.
            frames.flush(5000);

            const cursor = document.querySelector('.cursor');
            expect(cursor.style.display).toBe('none');
            expect(frames.pending).toBe(0);
        });

        it('restarts the loop after the cursor has been hidden', () => {
            createCursor();
            move(0, 0);
            frames.flush(5000);

            move(50, 50);

            expect(document.querySelector('.cursor').style.display).toBe('block');
            expect(frames.pending).toBe(1);
        });
    });

    describe('interactive targets', () => {
        beforeEach(() => {
            document.body.innerHTML = `
                <a href="#x" id="link"><span id="inside">text</span></a>
                <button id="button"></button>
                <div id="custom" class="interactive"></div>
                <p id="plain">plain</p>
            `;
            createCursor();
        });

        it.each(['link', 'button', 'custom', 'inside'])('activates over #%s', (id) => {
            hover(document.getElementById(id));

            expect(document.querySelector('.cursor').classList.contains('active')).toBe(true);
        });

        it('deactivates when leaving interactive content', () => {
            hover(document.getElementById('link'));

            hover(document.getElementById('plain'));

            expect(document.querySelector('.cursor').classList.contains('active')).toBe(false);
        });

        it('does not touch the class list when the state is unchanged', () => {
            const cursor = document.querySelector('.cursor');
            hover(document.getElementById('link'));
            const add = vi.spyOn(cursor.classList, 'add');

            hover(document.getElementById('button'));

            expect(add).not.toHaveBeenCalled();
        });
    });

    describe('destroy()', () => {
        it('removes the element, listeners and pending frame', () => {
            const cancel = vi.fn();
            vi.stubGlobal('cancelAnimationFrame', cancel);
            window.cancelAnimationFrame = cancel;
            const cursor = createCursor();
            move(10, 10);
            frames.flush(0);

            cursor.destroy();

            expect(document.querySelector('.cursor')).toBeNull();
            expect(cancel).toHaveBeenCalled();
            expect(() => move(20, 20)).not.toThrow();
        });
    });
});
