import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importFresh, stubMatchMedia } from '../helpers.js';

const loadUtilities = () => importFresh(() => import('../../js/core/utilities.js'));

describe('core/utilities', () => {
    beforeEach(() => {
        stubMatchMedia(false);
    });

    describe('$ / $$', () => {
        it('queries the document by default', async () => {
            document.body.innerHTML = '<p class="a">one</p><p class="a">two</p>';
            const { $, $$ } = await loadUtilities();

            expect($('.a')?.textContent).toBe('one');
            expect($$('.a')).toHaveLength(2);
        });

        it('scopes the query to the given parent', async () => {
            document.body.innerHTML = '<div id="outside"><span>no</span></div><div id="scope"><span>yes</span></div>';
            const { $, $$ } = await loadUtilities();
            const scope = document.getElementById('scope') as HTMLElement;

            expect($('span', scope)?.textContent).toBe('yes');
            expect($$('span', scope)).toHaveLength(1);
        });

        it('returns null for a missing element', async () => {
            const { $ } = await loadUtilities();
            expect($('.missing')).toBeNull();
        });
    });

    describe('clamp', () => {
        it.each([
            [5, 0, 10, 5],
            [-3, 0, 10, 0],
            [42, 0, 10, 10],
            [0, 0, 10, 0],
            [10, 0, 10, 10],
            [-7, -10, -5, -7],
        ])('clamp(%i, %i, %i) === %i', async (value, min, max, expected) => {
            const { clamp } = await loadUtilities();
            expect(clamp(value, min, max)).toBe(expected);
        });
    });

    describe('media query helpers', () => {
        it('reports mobile when the width query matches', async () => {
            stubMatchMedia({ '(max-width: 850px)': true });
            const { isMobile, prefersReducedMotion } = await loadUtilities();

            expect(isMobile()).toBe(true);
            expect(prefersReducedMotion()).toBe(false);
        });

        it('reports reduced motion when the motion query matches', async () => {
            stubMatchMedia({ '(prefers-reduced-motion: reduce)': true });
            const { isMobile, prefersReducedMotion } = await loadUtilities();

            expect(isMobile()).toBe(false);
            expect(prefersReducedMotion()).toBe(true);
        });

        it('caches the media query lists instead of re-parsing per call', async () => {
            const { matchMedia } = stubMatchMedia(false);
            const { isMobile, prefersReducedMotion } = await loadUtilities();

            isMobile();
            isMobile();
            prefersReducedMotion();

            expect(matchMedia).toHaveBeenCalledTimes(2);
        });

        it('degrades to "no match" when matchMedia is unavailable', async () => {
            vi.stubGlobal('matchMedia', undefined);
            (window as { matchMedia?: unknown }).matchMedia = undefined;
            const { matchesMedia, mediaQuery } = await loadUtilities();

            expect(mediaQuery('(max-width: 850px)')).toBeNull();
            expect(matchesMedia('(max-width: 850px)')).toBe(false);
        });
    });

    describe('nextFrame', () => {
        it('resolves on the next animation frame', async () => {
            vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
                cb(123);
                return 1;
            });
            const { nextFrame } = await loadUtilities();

            await expect(nextFrame()).resolves.toBe(123);
        });
    });

    describe('onIdle', () => {
        it('uses requestIdleCallback when the browser provides it', async () => {
            const idle = vi.fn((callback: () => void) => {
                callback();
                return 1;
            });
            vi.stubGlobal('requestIdleCallback', idle);
            const { onIdle } = await loadUtilities();

            const spy = vi.fn();
            onIdle(spy);

            expect(idle).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('falls back to a timeout on engines without requestIdleCallback', async () => {
            vi.useFakeTimers();
            vi.stubGlobal('requestIdleCallback', undefined);
            const { onIdle } = await loadUtilities();

            const spy = vi.fn();
            onIdle(spy, 50);
            expect(spy).not.toHaveBeenCalled();

            vi.advanceTimersByTime(50);
            expect(spy).toHaveBeenCalledTimes(1);
            vi.useRealTimers();
        });
    });

    describe('rafThrottle', () => {
        it('collapses bursts of calls into a single frame', async () => {
            const frames: FrameRequestCallback[] = [];
            vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
            const { rafThrottle } = await loadUtilities();

            const spy = vi.fn();
            const throttled = rafThrottle(spy);
            throttled();
            throttled();
            throttled();

            expect(spy).not.toHaveBeenCalled();
            expect(frames).toHaveLength(1);

            frames.shift()?.(0);
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('allows a new call once the frame has run', async () => {
            const frames: FrameRequestCallback[] = [];
            vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
            const { rafThrottle } = await loadUtilities();

            const spy = vi.fn();
            const throttled = rafThrottle(spy);
            throttled();
            frames.shift()?.(0);
            throttled();
            frames.shift()?.(0);

            expect(spy).toHaveBeenCalledTimes(2);
        });

        it('forwards the latest arguments of a burst', async () => {
            const frames: FrameRequestCallback[] = [];
            vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
            const { rafThrottle } = await loadUtilities();

            const spy = vi.fn();
            const throttled = rafThrottle(spy);
            throttled('a', 1);
            throttled('b', 2);
            frames.shift()?.(0);

            expect(spy).toHaveBeenCalledExactlyOnceWith('b', 2);
        });

        it('cancel() drops the pending frame so teardown leaves nothing running', async () => {
            const frames: FrameRequestCallback[] = [];
            const caf = vi.fn();
            vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => frames.push(cb));
            vi.stubGlobal('cancelAnimationFrame', caf);
            const { rafThrottle } = await loadUtilities();

            const spy = vi.fn();
            const throttled = rafThrottle(spy);
            throttled();
            throttled.cancel();
            frames.shift()?.(0);

            expect(caf).toHaveBeenCalledTimes(1);
            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('debounce', () => {
        it('runs only the trailing call after the delay', async () => {
            vi.useFakeTimers();
            const { debounce } = await loadUtilities();
            const spy = vi.fn();
            const debounced = debounce(spy, 100);

            debounced('first');
            vi.advanceTimersByTime(50);
            debounced('second');
            vi.advanceTimersByTime(99);
            expect(spy).not.toHaveBeenCalled();

            vi.advanceTimersByTime(1);
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith('second');
            vi.useRealTimers();
        });

        it('defaults to a 150ms delay', async () => {
            vi.useFakeTimers();
            const { debounce } = await loadUtilities();
            const spy = vi.fn();
            const debounced = debounce(spy);

            debounced();
            vi.advanceTimersByTime(149);
            expect(spy).not.toHaveBeenCalled();
            vi.advanceTimersByTime(1);
            expect(spy).toHaveBeenCalledTimes(1);
            vi.useRealTimers();
        });

        it('cancel() prevents the trailing call', async () => {
            vi.useFakeTimers();
            const { debounce } = await loadUtilities();
            const spy = vi.fn();
            const debounced = debounce(spy, 10);

            debounced();
            debounced.cancel();
            vi.advanceTimersByTime(50);

            expect(spy).not.toHaveBeenCalled();
            vi.useRealTimers();
        });
    });

    describe('listen', () => {
        it('returns a remover that detaches the listener', async () => {
            const { listen } = await loadUtilities();
            const spy = vi.fn();
            const off = listen(document, 'custom:ping', spy);

            document.dispatchEvent(new Event('custom:ping'));
            off();
            document.dispatchEvent(new Event('custom:ping'));

            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('escapeHtml', () => {
        it('escapes every character that could break out of markup', async () => {
            const { escapeHtml } = await loadUtilities();

            expect(escapeHtml('<img src=x onerror="y">')).toBe('&lt;img src=x onerror=&quot;y&quot;&gt;');
            expect(escapeHtml("a & b 'c'")).toBe('a &amp; b &#39;c&#39;');
            expect(escapeHtml(null)).toBe('');
            expect(escapeHtml(undefined)).toBe('');
        });
    });
});
