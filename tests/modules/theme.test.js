import { describe, it, expect, vi, beforeEach } from 'vitest';
import Theme from '../../js/modules/theme.js';
import { CONFIG } from '../../js/core/config.js';
import { stubMatchMedia, stubAnimationFrame, deferAnimationFrame } from '../helpers.js';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const toggleMarkup = '<button id="theme-toggle"><span class="theme-icon"></span></button>';

describe('modules/theme', () => {
    beforeEach(() => {
        stubMatchMedia(false);
        stubAnimationFrame();
    });

    describe('initialization', () => {
        it('restores a saved theme without re-writing storage', () => {
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'dark');
            const setItem = vi.spyOn(Storage.prototype, 'setItem');

            new Theme();

            expect(document.documentElement.dataset.theme).toBe('dark');
            expect(setItem).not.toHaveBeenCalled();
        });

        it('follows the OS dark preference and persists it when storage is empty', () => {
            stubMatchMedia({ [DARK_QUERY]: true });

            new Theme();

            expect(document.documentElement.dataset.theme).toBe('dark');
            expect(localStorage.getItem(CONFIG.STORAGE_THEME_KEY)).toBe('dark');
        });

        it('defaults to light when the OS has no dark preference', () => {
            new Theme();

            expect(document.documentElement.dataset.theme).toBe('light');
            expect(localStorage.getItem(CONFIG.STORAGE_THEME_KEY)).toBe('light');
        });

        it('ignores tampered storage values', () => {
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, '"><script>alert(1)</script>');

            new Theme();

            expect(document.documentElement.dataset.theme).toBe('light');
        });

        it('falls back to system defaults when storage access throws', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('denied');
            });
            stubMatchMedia({ [DARK_QUERY]: true });

            new Theme();

            expect(warn).toHaveBeenCalled();
            expect(document.documentElement.dataset.theme).toBe('dark');
        });

        it('survives a storage write failure', () => {
            vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('quota exceeded');
            });

            expect(() => new Theme()).not.toThrow();
            expect(document.documentElement.dataset.theme).toBe('light');
        });
    });

    describe('DOM side effects', () => {
        it('mirrors the theme onto colorScheme and the toggle button state', () => {
            document.body.innerHTML = toggleMarkup;
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'dark');

            new Theme();

            expect(document.documentElement.style.colorScheme).toBe('dark');
            expect(document.getElementById('theme-toggle').getAttribute('aria-pressed')).toBe('true');
            expect(document.querySelector('.theme-icon').textContent).toBe('🌙');
        });

        it('uses the sun icon and aria-pressed=false in light mode', () => {
            document.body.innerHTML = toggleMarkup;
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'light');

            new Theme();

            expect(document.getElementById('theme-toggle').getAttribute('aria-pressed')).toBe('false');
            expect(document.querySelector('.theme-icon').textContent).toBe('☀');
        });

        it('writes the computed brand color into the theme-color meta tag', () => {
            document.head.innerHTML = '<meta name="theme-color" content="#ffffff">';
            vi.spyOn(window, 'getComputedStyle').mockReturnValue({
                getPropertyValue: (name) => (name === '--color-primary' ? ' #123456 ' : ''),
            });

            new Theme();

            expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#123456');
        });

        it('falls back to a hardcoded color when the CSS variable is missing', () => {
            document.head.innerHTML = '<meta name="theme-color" content="#ffffff">';
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'dark');
            vi.spyOn(window, 'getComputedStyle').mockReturnValue({ getPropertyValue: () => '' });

            new Theme();

            expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe('#0d0d0d');
        });

        it('batches DOM writes inside an animation frame', () => {
            const frames = deferAnimationFrame();

            new Theme();
            expect(document.documentElement.dataset.theme).toBeUndefined();

            frames.flush();
            expect(document.documentElement.dataset.theme).toBe('light');
        });
    });

    describe('toggleTheme()', () => {
        it('flips light to dark and persists the choice', () => {
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'light');
            const theme = new Theme();

            theme.toggleTheme();

            expect(document.documentElement.dataset.theme).toBe('dark');
            expect(localStorage.getItem(CONFIG.STORAGE_THEME_KEY)).toBe('dark');
        });

        it('flips dark back to light', () => {
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'dark');
            const theme = new Theme();

            theme.toggleTheme();

            expect(document.documentElement.dataset.theme).toBe('light');
        });

        it('derives the starting theme from the OS when no attribute is set', () => {
            stubMatchMedia({ [DARK_QUERY]: true });
            const theme = new Theme();
            document.documentElement.removeAttribute('data-theme');

            theme.toggleTheme();

            expect(document.documentElement.dataset.theme).toBe('light');
        });

        it('is wired to a click on the toggle button', () => {
            document.body.innerHTML = toggleMarkup;
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'light');
            new Theme();

            document.getElementById('theme-toggle').click();

            expect(document.documentElement.dataset.theme).toBe('dark');
        });
    });

    describe('OS preference changes', () => {
        it('follows the OS while the user has no explicit preference', () => {
            const media = stubMatchMedia(false);
            document.body.innerHTML = toggleMarkup;
            new Theme();
            localStorage.clear();

            media.emitChange(DARK_QUERY, true);

            expect(document.documentElement.dataset.theme).toBe('dark');
            expect(localStorage.getItem(CONFIG.STORAGE_THEME_KEY)).toBeNull();
        });

        it('respects a stored preference over the OS change', () => {
            const media = stubMatchMedia(false);
            document.body.innerHTML = toggleMarkup;
            localStorage.setItem(CONFIG.STORAGE_THEME_KEY, 'light');
            new Theme();

            media.emitChange(DARK_QUERY, true);

            expect(document.documentElement.dataset.theme).toBe('light');
        });

        it('registers no OS listener when the toggle button is absent', () => {
            const media = stubMatchMedia(false);
            new Theme();
            localStorage.clear();

            media.emitChange(DARK_QUERY, true);

            expect(document.documentElement.dataset.theme).toBe('light');
        });
    });
});
