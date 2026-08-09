import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScrollManager from '../../js/modules/scroll.js';
import { CONFIG } from '../../js/core/config.js';
import { stubIntersectionObserver, stubAnimationFrame } from '../helpers.js';

const pageMarkup = `
    <a class="nav-link" href="#home">Home</a>
    <a class="nav-link" href="#work">Work</a>
    <section id="home"></section>
    <section id="work"></section>
    <button class="scroll-top">Top</button>
`;

function scrollTo(y) {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
}

describe('modules/scroll', () => {
    let observers;

    beforeEach(() => {
        document.body.innerHTML = pageMarkup;
        observers = stubIntersectionObserver();
        stubAnimationFrame();
        Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
    });

    it('keeps a reference to the observer manager it is constructed with', () => {
        const manager = { observe: vi.fn() };
        expect(() => new ScrollManager(manager)).not.toThrow();
    });

    it('toggles the scroll-top button around the 520px threshold', () => {
        new ScrollManager(null);
        const button = document.querySelector('.scroll-top');

        scrollTo(519);
        expect(button.classList.contains('visible')).toBe(false);

        scrollTo(521);
        expect(button.classList.contains('visible')).toBe(true);

        scrollTo(0);
        expect(button.classList.contains('visible')).toBe(false);
    });

    it('scrolls to the top when the button is clicked', () => {
        const scrollToSpy = vi.fn();
        window.scrollTo = scrollToSpy;
        new ScrollManager(null);

        document.querySelector('.scroll-top').click();

        expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('tolerates a page without a scroll-top button', () => {
        document.querySelector('.scroll-top').remove();

        expect(() => new ScrollManager(null)).not.toThrow();
        expect(() => scrollTo(600)).not.toThrow();
    });

    it('observes every section with the configured offset', () => {
        new ScrollManager(null);

        expect(observers.last.options).toEqual({
            root: null,
            rootMargin: `-${CONFIG.ACTIVE_SECTION_OFFSET}px 0px -60% 0px`,
            threshold: 0,
        });
        expect(observers.last.observed.map((el) => el.id)).toEqual(['home', 'work']);
    });

    it('skips observer setup when there are no sections', () => {
        document.body.innerHTML = '<button class="scroll-top"></button>';
        observers.instances.length = 0;

        new ScrollManager(null);

        expect(observers.instances).toHaveLength(0);
    });

    it('syncs the active nav link with the intersecting section', () => {
        new ScrollManager(null);

        observers.last.trigger([
            { target: document.getElementById('work') },
            { target: document.getElementById('home'), isIntersecting: false },
        ]);

        const [home, work] = document.querySelectorAll('.nav-link');
        expect(work.classList.contains('active')).toBe(true);
        expect(work.getAttribute('aria-current')).toBe('page');
        expect(home.getAttribute('aria-current')).toBe('false');
    });

    it('smooth-scrolls and focuses in-page anchor targets', () => {
        new ScrollManager(null);
        const target = document.getElementById('home');
        target.scrollIntoView = vi.fn();
        const event = new MouseEvent('click', { cancelable: true, bubbles: true });

        document.querySelector('.nav-link[href="#home"]').dispatchEvent(event);

        expect(event.defaultPrevented).toBe(true);
        expect(target.getAttribute('tabindex')).toBe('-1');
        expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    it('exposes a destroy hook that does not throw', () => {
        const scroll = new ScrollManager(null);
        expect(() => scroll.destroy()).not.toThrow();
    });
});
