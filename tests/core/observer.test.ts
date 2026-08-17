import { describe, it, expect, beforeEach } from 'vitest';
import ObserverManager, { type ObserveTarget } from '../../js/core/observer.js';
import { stubIntersectionObserver, type IntersectionObserverStub } from '../helpers.js';

const revealMarkup = `
    <div data-reveal id="a"></div>
    <div data-reveal id="b"></div>
    <div id="plain"></div>
`;

const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

describe('core/observer', () => {
    let observers: IntersectionObserverStub;

    beforeEach(() => {
        observers = stubIntersectionObserver();
    });

    it('observes every existing [data-reveal] element on construction', () => {
        document.body.innerHTML = revealMarkup;
        new ObserverManager();

        expect(observers.last.observed.map((el) => el.id)).toEqual(['a', 'b']);
    });

    it('merges custom config over the defaults', () => {
        document.body.innerHTML = revealMarkup;
        new ObserverManager({ threshold: 0.9 });

        expect(observers.last.options).toEqual({
            threshold: 0.9,
            rootMargin: '0px 0px -50px 0px',
        });
    });

    it('uses the default config when none is supplied', () => {
        document.body.innerHTML = revealMarkup;
        new ObserverManager();

        expect(observers.last.options).toEqual({
            threshold: 0.2,
            rootMargin: '0px 0px -50px 0px',
        });
    });

    it('does not create an observer subscription when nothing is revealable', () => {
        document.body.innerHTML = '<div id="plain"></div>';
        new ObserverManager();

        expect(observers.last.observed).toEqual([]);
    });

    it('reveals intersecting elements once and stops tracking them', () => {
        document.body.innerHTML = revealMarkup;
        new ObserverManager();
        const a = byId('a');
        const b = byId('b');

        observers.last.trigger([
            { target: a, isIntersecting: true },
            { target: b, isIntersecting: false },
        ]);

        expect(a.classList.contains('revealed')).toBe(true);
        expect(b.classList.contains('revealed')).toBe(false);
        expect(observers.last.unobserved).toEqual([a]);
        expect(observers.last.observed).toEqual([b]);
    });

    describe('observe()', () => {
        it('accepts a selector string', () => {
            document.body.innerHTML = '<div class="late" id="x"></div><div class="late" id="y"></div>';
            const manager = new ObserverManager();

            manager.observe('.late');

            expect(observers.last.observed.map((el) => el.id)).toEqual(['x', 'y']);
        });

        it('accepts a single element', () => {
            document.body.innerHTML = '<div id="single"></div>';
            const manager = new ObserverManager();

            manager.observe(byId('single'));

            expect(observers.last.observed.map((el) => el.id)).toEqual(['single']);
        });

        it('accepts a NodeList and an array of elements', () => {
            document.body.innerHTML = '<div class="n" id="n1"></div><div class="n" id="n2"></div><div id="n3"></div>';
            const manager = new ObserverManager();

            manager.observe(document.querySelectorAll('.n'));
            manager.observe([byId('n3')]);

            expect(observers.last.observed.map((el) => el.id)).toEqual(['n1', 'n2', 'n3']);
        });

        it('ignores elements that are already tracked', () => {
            document.body.innerHTML = revealMarkup;
            const manager = new ObserverManager();

            manager.observe('[data-reveal]');

            expect(observers.last.observed.map((el) => el.id)).toEqual(['a', 'b']);
        });

        it('re-observes an element after it was revealed', () => {
            document.body.innerHTML = revealMarkup;
            const manager = new ObserverManager();
            const a = byId('a');
            observers.last.trigger([{ target: a }]);

            manager.observe(a);

            expect(observers.last.observed).toContain(a);
        });

        it('does nothing for unsupported or empty targets', () => {
            document.body.innerHTML = revealMarkup;
            const manager = new ObserverManager();
            const initial = observers.last.observed.length;

            manager.observe('.does-not-exist');
            manager.observe(42 as unknown as ObserveTarget);

            expect(observers.last.observed).toHaveLength(initial);
        });
    });

    describe('without IntersectionObserver support', () => {
        beforeEach(() => {
            delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;
            delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;
        });

        it('reveals all static elements immediately', () => {
            document.body.innerHTML = revealMarkup;
            new ObserverManager();

            expect(byId('a').classList.contains('revealed')).toBe(true);
            expect(byId('b').classList.contains('revealed')).toBe(true);
            expect(byId('plain').classList.contains('revealed')).toBe(false);
        });

        it('reveals dynamically observed selectors and elements immediately', () => {
            document.body.innerHTML = '<div class="late" id="x"></div><div id="single"></div>';
            const manager = new ObserverManager();

            manager.observe('.late');
            manager.observe(byId('single'));

            expect(byId('x').classList.contains('revealed')).toBe(true);
            expect(byId('single').classList.contains('revealed')).toBe(true);
        });

        it('skips non-element targets in the fallback path', () => {
            const manager = new ObserverManager();
            expect(() => manager.observe(['not-an-element'] as unknown as ObserveTarget)).not.toThrow();
        });
    });

    describe('destroy()', () => {
        it('disconnects the observer and clears tracked elements', () => {
            document.body.innerHTML = revealMarkup;
            const manager = new ObserverManager();
            const instance = observers.last;

            manager.destroy();

            expect(instance.disconnected).toBe(true);

            // A destroyed manager falls back to revealing directly instead of throwing.
            manager.observe('[data-reveal]');
            expect(byId('a').classList.contains('revealed')).toBe(true);
        });

        it('is safe to call twice', () => {
            document.body.innerHTML = revealMarkup;
            const manager = new ObserverManager();

            manager.destroy();
            expect(() => manager.destroy()).not.toThrow();
        });
    });
});
