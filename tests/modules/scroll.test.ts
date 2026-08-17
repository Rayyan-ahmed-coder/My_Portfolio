import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ScrollManager from '../../js/modules/scroll.js';
import { CONFIG } from '../../js/core/config.js';
import { stubIntersectionObserver, stubAnimationFrame, type IntersectionObserverStub } from '../helpers.js';

const pageMarkup = `
    <a class="nav-link" href="#home">Home</a>
    <a class="nav-link" href="#work">Work</a>
    <a class="nav-link" href="https://example.com">External</a>
    <section id="home"></section>
    <section id="work"></section>
    <button class="scroll-top">Top</button>
`;

/** Sets window.scrollY and fires a scroll event. */
function scrollTo(y: number): void {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
}

const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
const q = <E extends Element = HTMLElement>(selector: string): E => document.querySelector<E>(selector) as E;

describe('modules/scroll', () => {
    let observers: IntersectionObserverStub;
    let instances: ScrollManager[] = [];

    /** ScrollManager binds document-level listeners, so every instance is torn down. */
    const createScrollManager = (): ScrollManager => {
        const instance = new ScrollManager();
        instances.push(instance);
        return instance;
    };

    beforeEach(() => {
        document.body.innerHTML = pageMarkup;
        observers = stubIntersectionObserver();
        stubAnimationFrame();
        Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
    });

    afterEach(() => {
        instances.splice(0).forEach((instance) => instance.destroy());
    });

    describe('scroll-to-top button', () => {
        it('toggles visibility around the configured threshold', () => {
            createScrollManager();
            const button = q('.scroll-top');

            scrollTo(CONFIG.SCROLL_TOP_THRESHOLD - 1);
            expect(button.classList.contains('visible')).toBe(false);

            scrollTo(CONFIG.SCROLL_TOP_THRESHOLD + 1);
            expect(button.classList.contains('visible')).toBe(true);

            scrollTo(0);
            expect(button.classList.contains('visible')).toBe(false);
        });

        it('is visible immediately when the page loads already scrolled', () => {
            Object.defineProperty(window, 'scrollY', { value: 1000, configurable: true, writable: true });

            createScrollManager();

            expect(q('.scroll-top').classList.contains('visible')).toBe(true);
        });

        it('only writes classList when the threshold is crossed', () => {
            createScrollManager();
            const toggle = vi.spyOn(q('.scroll-top').classList, 'toggle');

            scrollTo(600);
            scrollTo(700);
            scrollTo(800);

            expect(toggle).toHaveBeenCalledTimes(1);
        });

        it('scrolls smoothly to the top when clicked', () => {
            const scrollToSpy = vi.fn();
            vi.stubGlobal('scrollTo', scrollToSpy);
            window.scrollTo = scrollToSpy;
            createScrollManager();

            q<HTMLButtonElement>('.scroll-top').click();

            expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
        });

        it('tolerates a page without a scroll-top button', () => {
            q('.scroll-top').remove();

            expect(() => createScrollManager()).not.toThrow();
            expect(() => scrollTo(600)).not.toThrow();
        });
    });

    describe('scroll direction', () => {
        it('reports the direction of the latest scroll', () => {
            const scroll = createScrollManager();

            scrollTo(400);
            expect(scroll.direction).toBe('down');

            scrollTo(100);
            expect(scroll.direction).toBe('up');
        });
    });

    describe('active section tracking', () => {
        it('observes every section with the configured offset', () => {
            createScrollManager();

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

            createScrollManager();

            expect(observers.instances).toHaveLength(0);
        });

        it('syncs the active nav link with the intersecting section', () => {
            const scroll = createScrollManager();

            observers.last.trigger([
                { target: byId('work') },
                { target: byId('home'), isIntersecting: false },
            ]);

            const [home, work] = [...document.querySelectorAll('.nav-link')];
            expect(scroll.activeSection).toBe('work');
            expect(work?.classList.contains('active')).toBe(true);
            expect(work?.getAttribute('aria-current')).toBe('page');
            expect(home?.classList.contains('active')).toBe(false);
        });

        it('moves the active state as new sections intersect', () => {
            createScrollManager();
            observers.last.trigger([{ target: byId('work') }]);

            observers.last.trigger([{ target: byId('home') }]);

            const [home, work] = [...document.querySelectorAll('.nav-link')];
            expect(home?.classList.contains('active')).toBe(true);
            expect(work?.classList.contains('active')).toBe(false);
            expect(work?.getAttribute('aria-current')).toBe('false');
        });

        it('ignores repeated notifications for the already active section', () => {
            createScrollManager();
            observers.last.trigger([{ target: byId('home') }]);
            const toggle = vi.spyOn(q('.nav-link').classList, 'toggle');

            observers.last.trigger([{ target: byId('home') }]);

            expect(toggle).not.toHaveBeenCalled();
        });
    });

    describe('smooth anchor scrolling', () => {
        it('focuses and scrolls to the targeted section', () => {
            createScrollManager();
            const target = byId('work');
            target.scrollIntoView = vi.fn();
            const focus = vi.spyOn(target, 'focus');
            const event = new MouseEvent('click', { cancelable: true, bubbles: true });

            q('.nav-link[href="#work"]').dispatchEvent(event);

            expect(event.defaultPrevented).toBe(true);
            expect(target.getAttribute('tabindex')).toBe('-1');
            expect(focus).toHaveBeenCalledWith({ preventScroll: true });
            expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
        });

        it('leaves external links untouched', () => {
            createScrollManager();
            let preventedByModule: boolean | null = null;
            // Swallow the click afterwards so jsdom does not attempt a real navigation.
            const stopNavigation = (event: Event): void => {
                preventedByModule = event.defaultPrevented;
                event.preventDefault();
            };
            document.addEventListener('click', stopNavigation);

            q('.nav-link[href="https://example.com"]').dispatchEvent(
                new MouseEvent('click', { cancelable: true, bubbles: true })
            );
            document.removeEventListener('click', stopNavigation);

            expect(preventedByModule).toBe(false);
        });

        it('does nothing when the anchor target does not exist', () => {
            document.body.innerHTML = '<a class="nav-link" href="#ghost">Ghost</a><section id="home"></section>';
            createScrollManager();
            const event = new MouseEvent('click', { cancelable: true, bubbles: true });

            expect(() => q('.nav-link').dispatchEvent(event)).not.toThrow();
            expect(event.defaultPrevented).toBe(false);
        });
    });

    describe('destroy()', () => {
        it('detaches the scroll listener, cancels frames and disconnects the observer', () => {
            const removeSpy = vi.spyOn(window, 'removeEventListener');
            const scroll = createScrollManager();
            const instance = observers.last;

            scroll.destroy();

            expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
            expect(instance.disconnected).toBe(true);

            scrollTo(900);
            expect(q('.scroll-top').classList.contains('visible')).toBe(false);
        });

        it('stops handling anchor clicks after teardown', () => {
            const scroll = createScrollManager();
            const target = byId('work');
            target.scrollIntoView = vi.fn();

            scroll.destroy();
            q('.nav-link[href="#work"]').dispatchEvent(new MouseEvent('click', { cancelable: true, bubbles: true }));

            expect(target.scrollIntoView).not.toHaveBeenCalled();
        });
    });
});
