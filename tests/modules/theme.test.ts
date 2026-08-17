import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CONFIG } from '../../js/core/config.js';
import { importFresh, stubMatchMedia, stubAnimationFrame, deferAnimationFrame } from '../helpers.js';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const toggleMarkup = '<button id="theme-toggle"><span class="theme-icon"></span></button>';

/**
 * Theme is imported per test: core/utilities caches its MediaQueryList objects,
 * so a fresh module graph is what makes a new matchMedia stub take effect.
 */
const loadTheme = async () => (await importFresh(() => import('../../js/modules/theme.js'))).default;

const themeAttr = (): string | undefined => document.documentElement.dataset.theme;
const toggleButton = (): HTMLElement => document.getElementById('theme-toggle') as HTMLElement;
const el = (selector: string): HTMLElement => document.querySelector(selector) as HTMLElement;

describe('modules/theme', () => {
    beforeEach(() => {
        stubMatchMedia(false);
        stubAnimationFrame();
    });

    describe('initialization', () => {
        it('restores a saved theme without re-writing storage', async () => {
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'dark');
            const setItem = vi.spyOn(Storage.prototype, 'setItem');
            const Theme = await loadTheme();

            new Theme();

            expect(themeAttr()).toBe('dark');
            expect(setItem).not.toHaveBeenCalled();
        });

        it('follows the OS dark preference and persists it when storage is empty', async () => {
            stubMatchMedia({ [DARK_QUERY]: true });
            const Theme = await loadTheme();

            new Theme();

            expect(themeAttr()).toBe('dark');
            expect(localStorage.getItem(CONFIG.STORAGE_THEME_KEY)).toBe('dark');
        });

        it('defaults to light when the OS has no dark preference', async () => {
            const Theme = await loadTheme();

            new Theme();

            expect(themeAttr()).toBe('light');
            expect(localStorage.getItem(CONFIG.STORAGE_THEME_KEY)).toBe('light');
        });

        it('ignores tampered storage values', async () => {
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, '"><script>alert(1)</script>');
            const Theme = await loadTheme();

            new Theme();

            expect(themeAttr()).toBe('light');
        });

        it('falls back to system defaults when storage access throws', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('denied');
            });
            stubMatchMedia({ [DARK_QUERY]: true });
            const Theme = await loadTheme();

            new Theme();

            expect(warn).toHaveBeenCalled();
            expect(themeAttr()).toBe('dark');
        });

        it('survives a storage write failure', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('quota exceeded');
            });
            const Theme = await loadTheme();

            expect(() => new Theme()).not.toThrow();
            expect(themeAttr()).toBe('light');
        });
    });

    describe('DOM side effects', () => {
        it('mirrors the theme onto colorScheme and the toggle button state', async () => {
            document.body.innerHTML = toggleMarkup;
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'dark');
            const Theme = await loadTheme();

            new Theme();

            expect(document.documentElement.style.colorScheme).toBe('dark');
            expect(toggleButton().getAttribute('aria-pressed')).toBe('true');
            expect(el('.theme-icon').textContent).toBe('🌙');
        });

        it('uses the sun icon and aria-pressed=false in light mode', async () => {
            document.body.innerHTML = toggleMarkup;
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'light');
            const Theme = await loadTheme();

            new Theme();

            expect(toggleButton().getAttribute('aria-pressed')).toBe('false');
            expect(el('.theme-icon').textContent).toBe('☀');
        });

        it('writes the computed brand color into the theme-color meta tag', async () => {
            document.head.innerHTML = '<meta name="theme-color" content="#ffffff">';
            vi.spyOn(window, 'getComputedStyle').mockReturnValue({
                getPropertyValue: (name: string) => (name === '--color-primary' ? ' #123456 ' : ''),
            } as unknown as CSSStyleDeclaration);
            const Theme = await loadTheme();

            new Theme();

            expect(el('meta[name="theme-color"]').getAttribute('content')).toBe('#123456');
        });

        it('falls back to a hardcoded color when the CSS variable is missing', async () => {
            document.head.innerHTML = '<meta name="theme-color" content="#ffffff">';
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'dark');
            vi.spyOn(window, 'getComputedStyle').mockReturnValue({
                getPropertyValue: () => '',
            } as unknown as CSSStyleDeclaration);
            const Theme = await loadTheme();

            new Theme();

            expect(el('meta[name="theme-color"]').getAttribute('content')).toBe('#0d0d0d');
        });

        it('batches DOM writes inside an animation frame', async () => {
            const frames = deferAnimationFrame();
            const Theme = await loadTheme();

            new Theme();
            expect(themeAttr()).toBeUndefined();

            frames.flush();
            expect(themeAttr()).toBe('light');
        });
    });

    describe('toggleTheme()', () => {
        it('flips light to dark and persists the choice', async () => {
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'light');
            const Theme = await loadTheme();
            const theme = new Theme();

            theme.toggleTheme();

            expect(themeAttr()).toBe('dark');
            expect(localStorage.getItem(CONFIG.STORAGE_THEME_KEY)).toBe('dark');
        });

        it('flips dark back to light', async () => {
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'dark');
            const Theme = await loadTheme();
            const theme = new Theme();

            theme.toggleTheme();

            expect(themeAttr()).toBe('light');
        });

        it('derives the starting theme from the OS when no attribute is set', async () => {
            stubMatchMedia({ [DARK_QUERY]: true });
            const Theme = await loadTheme();
            const theme = new Theme();
            document.documentElement.removeAttribute('data-theme');

            theme.toggleTheme();

            expect(themeAttr()).toBe('light');
        });

        it('is wired to a click on the toggle button', async () => {
            document.body.innerHTML = toggleMarkup;
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'light');
            const Theme = await loadTheme();
            new Theme();

            toggleButton().click();

            expect(themeAttr()).toBe('dark');
        });
    });

    describe('OS preference changes', () => {
        it('follows the OS while the user has no explicit preference', async () => {
            const media = stubMatchMedia(false);
            document.body.innerHTML = toggleMarkup;
            const Theme = await loadTheme();
            new Theme();
            localStorage.clear();

            media.emitChange(DARK_QUERY, true);

            expect(themeAttr()).toBe('dark');
            expect(localStorage.getItem(CONFIG.STORAGE_THEME_KEY)).toBeNull();
        });

        it('respects a stored preference over the OS change', async () => {
            const media = stubMatchMedia(false);
            document.body.innerHTML = toggleMarkup;
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'light');
            const Theme = await loadTheme();
            new Theme();

            media.emitChange(DARK_QUERY, true);

            expect(themeAttr()).toBe('light');
        });

        it('still follows the OS when no toggle button exists', async () => {
            const media = stubMatchMedia(false);
            const Theme = await loadTheme();
            new Theme();
            localStorage.clear();

            media.emitChange(DARK_QUERY, true);

            expect(themeAttr()).toBe('dark');
        });
    });

    describe('destroy()', () => {
        it('detaches the toggle click and OS preference listeners', async () => {
            const media = stubMatchMedia(false);
            document.body.innerHTML = toggleMarkup;
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'light');
            const Theme = await loadTheme();
            const theme = new Theme();

            theme.destroy();
            toggleButton().click();
            localStorage.clear();
            media.emitChange(DARK_QUERY, true);

            expect(themeAttr()).toBe('light');
        });
    });
});
