import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navigation from '../../js/modules/navigation.js';
import { CONFIG } from '../../js/core/config.js';
import { stubIntersectionObserver, stubAnimationFrame } from '../helpers.js';

const pageMarkup = `
    <nav>
        <a class="nav-link" href="#home">Home</a>
        <a class="nav-link" href="#work">Work</a>
        <a class="nav-link" href="https://example.com">External</a>
    </nav>
    <section id="home"></section>
    <section id="work"></section>
    <button class="scroll-top">Top</button>
`;

/** Sets window.scrollY and fires a scroll event. */
function scrollTo(y) {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
}

describe('modules/navigation', () => {
    let observers;

    beforeEach(() => {
        document.body.innerHTML = pageMarkup;
        observers = stubIntersectionObserver();
        stubAnimationFrame();
        Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
    });

    describe('scroll-to-top button', () => {
        it('stays hidden until the page is scrolled past the threshold', () => {
            new Navigation();
            const button = document.querySelector('.scroll-top');
            expect(button.classList.contains('visible')).toBe(false);

            scrollTo(521);
            expect(button.classList.contains('visible')).toBe(true);
        });

        it('hides again when scrolling back up', () => {
            new Navigation();
            const button = document.querySelector('.scroll-top');

            scrollTo(900);
            scrollTo(100);

            expect(button.classList.contains('visible')).toBe(false);
        });

        it('is visible immediately when the page loads already scrolled', () => {
            Object.defineProperty(window, 'scrollY', { value: 1000, configurable: true, writable: true });

            new Navigation();

            expect(document.querySelector('.scroll-top').classList.contains('visible')).toBe(true);
        });

        it('scrolls smoothly to the top when clicked', () => {
            const scrollToSpy = vi.fn();
            vi.stubGlobal('scrollTo', scrollToSpy);
            window.scrollTo = scrollToSpy;
            new Navigation();

            document.querySelector('.scroll-top').click();

            expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
        });

        it('initializes without a scroll-top button present', () => {
            document.querySelector('.scroll-top').remove();

            expect(() => new Navigation()).not.toThrow();
            expect(() => scrollTo(800)).not.toThrow();
        });

        it('only writes classList when the threshold is crossed', () => {
            new Navigation();
            const button = document.querySelector('.scroll-top');
            const toggle = vi.spyOn(button.classList, 'toggle');

            scrollTo(600);
            scrollTo(700);
            scrollTo(800);

            expect(toggle).toHaveBeenCalledTimes(1);
        });
    });

    describe('active section tracking', () => {
        it('configures the observer from CONFIG.ACTIVE_SECTION_OFFSET', () => {
            new Navigation();

            expect(observers.last.options).toEqual({
                root: null,
                rootMargin: `-${CONFIG.ACTIVE_SECTION_OFFSET}px 0px -60% 0px`,
                threshold: 0,
            });
            expect(observers.last.observed.map((el) => el.id)).toEqual(['home', 'work']);
        });

        it('marks the matching nav link active and updates aria-current', () => {
            new Navigation();

            observers.last.trigger([{ target: document.getElementById('work') }]);

            const [home, work] = document.querySelectorAll('.nav-link');
            expect(work.classList.contains('active')).toBe(true);
            expect(work.getAttribute('aria-current')).toBe('page');
            expect(home.classList.contains('active')).toBe(false);
        });

        it('moves the active state as new sections intersect', () => {
            new Navigation();
            observers.last.trigger([{ target: document.getElementById('work') }]);

            observers.last.trigger([{ target: document.getElementById('home') }]);

            const [home, work] = document.querySelectorAll('.nav-link');
            expect(home.classList.contains('active')).toBe(true);
            expect(work.classList.contains('active')).toBe(false);
            expect(work.getAttribute('aria-current')).toBe('false');
        });

        it('ignores non-intersecting entries and repeated sections', () => {
            new Navigation();
            observers.last.trigger([{ target: document.getElementById('home'), isIntersecting: false }]);
            expect(document.querySelector('.nav-link').classList.contains('active')).toBe(false);

            observers.last.trigger([{ target: document.getElementById('home') }]);
            const toggle = vi.spyOn(document.querySelector('.nav-link').classList, 'toggle');
            observers.last.trigger([{ target: document.getElementById('home') }]);

            expect(toggle).not.toHaveBeenCalled();
        });

        it('skips observer setup when the page has no sections', () => {
            document.body.innerHTML = '<a class="nav-link" href="#home">Home</a>';
            observers.instances.length = 0;

            new Navigation();

            expect(observers.instances).toHaveLength(0);
        });
    });

    describe('smooth anchor scrolling', () => {
        it('focuses and scrolls to the targeted section', () => {
            new Navigation();
            const target = document.getElementById('work');
            target.scrollIntoView = vi.fn();
            const focus = vi.spyOn(target, 'focus');

            document.querySelector('.nav-link[href="#work"]').click();

            expect(target.getAttribute('tabindex')).toBe('-1');
            expect(focus).toHaveBeenCalledWith({ preventScroll: true });
            expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
        });

        it('prevents the default jump for in-page links', () => {
            new Navigation();
            document.getElementById('work').scrollIntoView = vi.fn();
            const event = new MouseEvent('click', { cancelable: true, bubbles: true });

            document.querySelector('.nav-link[href="#work"]').dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
        });

        it('leaves external links untouched', () => {
            new Navigation();
            let preventedByModule = null;
            // Swallow the click afterwards so jsdom does not attempt a real navigation.
            document.addEventListener('click', (event) => {
                preventedByModule = event.defaultPrevented;
                event.preventDefault();
            });

            document
                .querySelector('.nav-link[href="https://example.com"]')
                .dispatchEvent(new MouseEvent('click', { cancelable: true, bubbles: true }));

            expect(preventedByModule).toBe(false);
        });

        it('does nothing when the anchor target does not exist', () => {
            document.body.innerHTML = '<a class="nav-link" href="#ghost">Ghost</a><section id="home"></section>';
            new Navigation();
            const event = new MouseEvent('click', { cancelable: true, bubbles: true });

            expect(() => document.querySelector('.nav-link').dispatchEvent(event)).not.toThrow();
        });
    });

    describe('destroy()', () => {
        it('detaches the scroll listener and disconnects the observer', () => {
            const removeSpy = vi.spyOn(window, 'removeEventListener');
            const nav = new Navigation();
            const instance = observers.last;

            nav.destroy();

            expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
            expect(instance.disconnected).toBe(true);

            const button = document.querySelector('.scroll-top');
            scrollTo(900);
            expect(button.classList.contains('visible')).toBe(false);
        });
    });
});
