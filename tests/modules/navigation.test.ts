import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importFresh, stubMatchMedia } from '../helpers.js';

const MOBILE_QUERY = '(max-width: 850px)';

const navMarkup = `
    <button class="menu-toggle" id="menu-toggle" aria-controls="navigation-menu">Menu</button>
    <div class="nav-wrapper" id="navigation-menu">
        <a class="nav-link" href="#home">Home</a>
        <a class="nav-link" href="#work">Work</a>
    </div>
`;

/**
 * Navigation is imported per test because core/utilities caches its
 * MediaQueryList objects for the lifetime of the module graph.
 */
const loadNavigation = async () =>
    (await importFresh(() => import('../../js/modules/navigation.js'))).default;

const toggleButton = (): HTMLElement => document.getElementById('menu-toggle') as HTMLElement;
const menu = (): HTMLElement => document.getElementById('navigation-menu') as HTMLElement;

describe('modules/navigation', () => {
    beforeEach(() => {
        document.body.innerHTML = navMarkup;
        stubMatchMedia(false);
    });

    it('marks the toggle button as collapsed on startup', async () => {
        const Navigation = await loadNavigation();
        new Navigation();

        expect(toggleButton().getAttribute('aria-expanded')).toBe('false');
        expect(menu().classList.contains('open')).toBe(false);
    });

    it('warns and stays inert when the menu markup is missing', async () => {
        document.body.innerHTML = '<a class="nav-link" href="#home">Home</a>';
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const Navigation = await loadNavigation();

        const nav = new Navigation();

        expect(warn).toHaveBeenCalled();
        expect(nav.isOpen).toBe(false);
        expect(() => nav.toggle()).not.toThrow();
    });

    describe('opening and closing', () => {
        it('opens on the first click and closes on the second', async () => {
            const Navigation = await loadNavigation();
            const nav = new Navigation();

            toggleButton().click();
            expect(nav.isOpen).toBe(true);
            expect(menu().classList.contains('open')).toBe(true);
            expect(toggleButton().classList.contains('active')).toBe(true);
            expect(toggleButton().getAttribute('aria-expanded')).toBe('true');
            expect(toggleButton().getAttribute('aria-label')).toBe('Close navigation menu');
            expect(document.body.classList.contains('body-locked')).toBe(true);

            toggleButton().click();
            expect(nav.isOpen).toBe(false);
            expect(menu().classList.contains('open')).toBe(false);
            expect(toggleButton().getAttribute('aria-expanded')).toBe('false');
            expect(document.body.classList.contains('body-locked')).toBe(false);
        });

        it('moves focus to the first link when opening', async () => {
            const Navigation = await loadNavigation();
            const nav = new Navigation();
            const firstLink = document.querySelector('.nav-link') as HTMLAnchorElement;
            const focus = vi.spyOn(firstLink, 'focus');

            nav.open();

            expect(focus).toHaveBeenCalledWith({ preventScroll: true });
        });

        it('closes when a navigation link is clicked', async () => {
            const Navigation = await loadNavigation();
            const nav = new Navigation();
            nav.open();

            (document.querySelector('.nav-link[href="#work"]') as HTMLAnchorElement).click();

            expect(nav.isOpen).toBe(false);
        });

        it('closes on Escape only while open', async () => {
            const Navigation = await loadNavigation();
            const nav = new Navigation();

            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(nav.isOpen).toBe(false);

            nav.open();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            expect(nav.isOpen).toBe(false);
            expect(menu().classList.contains('open')).toBe(false);
        });

        it('closes when the viewport leaves the mobile breakpoint', async () => {
            const media = stubMatchMedia({ [MOBILE_QUERY]: true });
            const Navigation = await loadNavigation();
            const nav = new Navigation();
            nav.open();

            media.emitChange(MOBILE_QUERY, false);

            expect(nav.isOpen).toBe(false);
            expect(document.body.classList.contains('body-locked')).toBe(false);
        });

        it('never releases a scroll lock it did not take', async () => {
            document.body.classList.add('body-locked');
            const Navigation = await loadNavigation();
            const nav = new Navigation();

            nav.open();
            nav.close();

            expect(document.body.classList.contains('body-locked')).toBe(true);
        });

        it('ignores repeated open and close calls', async () => {
            const Navigation = await loadNavigation();
            const nav = new Navigation();

            nav.open();
            nav.open();
            expect(nav.isOpen).toBe(true);

            nav.close();
            nav.close();
            expect(nav.isOpen).toBe(false);
        });
    });

    describe('destroy()', () => {
        it('closes the menu and detaches every listener', async () => {
            const Navigation = await loadNavigation();
            const nav = new Navigation();
            nav.open();

            nav.destroy();
            expect(nav.isOpen).toBe(false);
            expect(document.body.classList.contains('body-locked')).toBe(false);

            toggleButton().click();
            expect(nav.isOpen).toBe(false);
        });
    });
});
