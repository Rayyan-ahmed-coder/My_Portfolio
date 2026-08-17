import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type CustomCursor from '../../js/modules/cursor.js';
import { importFresh, stubMatchMedia, deferAnimationFrame } from '../helpers.js';

/**
 * core/utilities caches MediaQueryList objects, so the module graph is
 * re-imported after the matchMedia stub for the test is in place.
 */
const loadCursor = async (): Promise<typeof CustomCursor> =>
    (await importFresh(() => import('../../js/modules/cursor.js'))).default;

const FINE_POINTER = '(pointer: fine)';

const move = (clientX: number, clientY: number): void => {
    window.dispatchEvent(new MouseEvent('mousemove', { clientX, clientY }));
};

const hover = (target: Element): void => {
    target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
};

const cursorElement = (): HTMLElement | null => document.querySelector<HTMLElement>('.cursor');
const requireCursor = (): HTMLElement => cursorElement() as HTMLElement;
const byId = (id: string): Element => document.getElementById(id) as Element;

describe('modules/cursor', () => {
    let frames: ReturnType<typeof deferAnimationFrame>;
    let instances: CustomCursor[] = [];

    // The cursor binds window listeners, so every instance is torn down between
    // tests to keep the shared jsdom window clean.
    const createCursor = async (): Promise<CustomCursor> => {
        const Cursor = await loadCursor();
        const cursor = new Cursor();
        instances.push(cursor);
        return cursor;
    };

    beforeEach(() => {
        document.body.innerHTML = '';
        stubMatchMedia({ [FINE_POINTER]: true });
        frames = deferAnimationFrame();
        instances = [];
    });

    afterEach(() => {
        instances.splice(0).forEach((cursor) => cursor.destroy());
    });

    describe('pointer capability gate', () => {
        it('creates a hidden cursor element for fine pointers', async () => {
            await createCursor();

            const cursor = requireCursor();
            expect(cursor).not.toBeNull();
            expect(cursor.style.position).toBe('fixed');
            expect(cursor.style.display).toBe('none');
            expect(cursor.style.pointerEvents).toBe('none');
            expect(cursor.getAttribute('aria-hidden')).toBe('true');
        });

        it('does nothing on coarse pointer devices', async () => {
            stubMatchMedia(false);

            const cursor = await createCursor();
            move(10, 10);

            expect(cursorElement()).toBeNull();
            expect(cursor.element).toBeNull();
            expect(frames.pending).toBe(0);
        });
    });

    describe('mouse tracking', () => {
        it('shows the cursor and schedules the glide loop on first move', async () => {
            await createCursor();

            move(100, 200);

            expect(requireCursor().style.display).toBe('block');
            expect(frames.pending).toBe(1);
        });

        it('eases the cursor toward the pointer on each frame', async () => {
            await createCursor();
            move(100, 100);

            frames.flush(0);
            // glide 0.55 => 55px of the 100px distance, minus the 10px hotspot offset
            expect(requireCursor().style.transform).toBe('translate3d(45px, 45px, 0)');

            frames.flush(0);
            expect(requireCursor().style.transform).toBe('translate3d(70px, 70px, 0)');
        });

        it('keeps requesting frames while the pointer keeps moving', async () => {
            await createCursor();
            move(100, 100);

            frames.flush(0);

            expect(frames.pending).toBe(1);
        });

        it('hides the cursor once it settles and the pointer has been idle', async () => {
            await createCursor();
            move(0, 0);

            // Idle for longer than the 1200ms timeout with no distance left to travel.
            frames.flush(5000);

            expect(requireCursor().style.display).toBe('none');
            expect(frames.pending).toBe(0);
        });

        it('restarts the loop after the cursor has been hidden', async () => {
            await createCursor();
            move(0, 0);
            frames.flush(5000);

            move(50, 50);

            expect(requireCursor().style.display).toBe('block');
            expect(frames.pending).toBe(1);
        });

        it('tracks the pointer without interpolation when motion is reduced', async () => {
            stubMatchMedia({ [FINE_POINTER]: true, '(prefers-reduced-motion: reduce)': true });

            await createCursor();
            move(100, 100);

            expect(requireCursor().style.transform).toBe('translate3d(90px, 90px, 0)');
            expect(frames.pending).toBe(0);
        });
    });

    describe('interactive targets', () => {
        beforeEach(async () => {
            document.body.innerHTML = `
                <a href="#x" id="link"><span id="inside">text</span></a>
                <button id="button"></button>
                <div id="custom" class="interactive"></div>
                <p id="plain">plain</p>
            `;
            await createCursor();
        });

        it.each(['link', 'button', 'custom', 'inside'])('activates over #%s', (id) => {
            hover(byId(id));

            expect(requireCursor().classList.contains('active')).toBe(true);
        });

        it('deactivates when leaving interactive content', async () => {
            hover(byId('link'));

            hover(byId('plain'));

            expect(requireCursor().classList.contains('active')).toBe(false);
        });

        it('does not touch the class list when the state is unchanged', async () => {
            hover(byId('link'));
            const toggle = vi.spyOn(requireCursor().classList, 'toggle');

            hover(byId('button'));

            expect(toggle).not.toHaveBeenCalled();
        });
    });

    describe('destroy()', () => {
        it('removes the element, listeners and pending frame', async () => {
            const cancel = vi.fn();
            vi.stubGlobal('cancelAnimationFrame', cancel);
            window.cancelAnimationFrame = cancel as unknown as typeof window.cancelAnimationFrame;
            const cursor = await createCursor();
            move(10, 10);
            frames.flush(0);

            cursor.destroy();

            expect(cursorElement()).toBeNull();
            expect(cancel).toHaveBeenCalled();
            expect(() => move(20, 20)).not.toThrow();
        });
    });
});
