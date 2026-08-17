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

            expect($('.a').textContent).toBe('one');
            expect($$('.a')).toHaveLength(2);
        });

        it('scopes the query to the given parent', async () => {
            document.body.innerHTML = '<div id="outside"><span>no</span></div><div id="scope"><span>yes</span></div>';
            const { $, $$ } = await loadUtilities();
            const scope = document.getElementById('scope');

            expect($('span', scope).textContent).toBe('yes');
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
    });

    describe('nextFrame', () => {
        it('resolves on the next animation frame', async () => {
            vi.stubGlobal('requestAnimationFrame', (cb) => {
                cb(123);
                return 1;
            });
            const { nextFrame } = await loadUtilities();

            await expect(nextFrame()).resolves.toBe(123);
        });
    });

    describe('rafThrottle', () => {
        it('collapses bursts of calls into a single frame', async () => {
            const frames = [];
            vi.stubGlobal('requestAnimationFrame', (cb) => frames.push(cb));
            const { rafThrottle } = await loadUtilities();

            const spy = vi.fn();
            const throttled = rafThrottle(spy);
            throttled();
            throttled();
            throttled();

            expect(spy).not.toHaveBeenCalled();
            expect(frames).toHaveLength(1);

            frames.shift()();
            expect(spy).toHaveBeenCalledTimes(1);
        });

        it('allows a new call once the frame has run', async () => {
            const frames = [];
            vi.stubGlobal('requestAnimationFrame', (cb) => frames.push(cb));
            const { rafThrottle } = await loadUtilities();

            const spy = vi.fn();
            const throttled = rafThrottle(spy);
            throttled();
            frames.shift()();
            throttled();
            frames.shift()();

            expect(spy).toHaveBeenCalledTimes(2);
        });

        it('preserves the `this` context and arguments', async () => {
            const frames = [];
            vi.stubGlobal('requestAnimationFrame', (cb) => frames.push(cb));
            const { rafThrottle } = await loadUtilities();

            const context = {
                calls: [],
                handler: null,
            };
            context.handler = rafThrottle(function (...args) {
                this.calls.push(args);
            });

            context.handler('a', 1);
            frames.shift()();

            expect(context.calls).toEqual([['a', 1]]);
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

        it('preserves the `this` context', async () => {
            vi.useFakeTimers();
            const { debounce } = await loadUtilities();
            const target = { value: 0 };
            target.bump = debounce(function (amount) {
                this.value += amount;
            }, 10);

            target.bump(5);
            vi.advanceTimersByTime(10);

            expect(target.value).toBe(5);
            vi.useRealTimers();
        });
    });
});
