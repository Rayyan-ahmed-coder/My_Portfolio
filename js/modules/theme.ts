import { CONFIG } from "../core/config.js";
import { $, DARK_SCHEME_QUERY, listen, mediaQuery, matchesMedia, type Unsubscribe } from "../core/utilities.js";
import { warn } from "../core/logger.js";
import type { Disposable, ThemeName } from "../core/types.js";

const SCOPE = "theme";
const FALLBACK_COLORS: Record<ThemeName, string> = { dark: "#0d0d0d", light: "#ef476f" };
const THEME_VARIABLES: Record<ThemeName, string> = { dark: "--color-black", light: "--color-primary" };

const isThemeName = (value: unknown): value is ThemeName => value === "dark" || value === "light";

/** System-aware light/dark manager with tamper-resistant persistence. */
export default class Theme implements Disposable {
    #root: HTMLElement = document.documentElement;
    #toggleButton: HTMLElement | null = $("#theme-toggle");
    #iconEl: HTMLElement | null;
    #storageKey: string = CONFIG.STORAGE_THEME_KEY;
    #teardown: Unsubscribe[] = [];

    constructor() {
        this.#iconEl = this.#toggleButton ? $(".theme-icon", this.#toggleButton) : null;
        this.#initialize();
        this.#setupEventListeners();
    }

    #initialize(): void {
        const savedTheme = this.#readStoredTheme();
        if (savedTheme) {
            this.#setTheme(savedTheme, false);
            return;
        }

        this.#setTheme(matchesMedia(DARK_SCHEME_QUERY) ? "dark" : "light", true);
    }

    #setupEventListeners(): void {
        if (this.#toggleButton) {
            this.#teardown.push(listen(this.#toggleButton, "click", () => this.toggleTheme()));
        }

        const darkScheme = mediaQuery(DARK_SCHEME_QUERY);
        if (!darkScheme?.addEventListener) return;

        // Follow OS changes only while the visitor has not made an explicit choice.
        this.#teardown.push(
            listen(darkScheme, "change", (event) => {
                if (this.#readStoredTheme()) return;
                this.#setTheme((event as MediaQueryListEvent).matches ? "dark" : "light", false);
            })
        );
    }

    #readStoredTheme(): ThemeName | null {
        try {
            const value = localStorage.getItem(this.#storageKey);
            return isThemeName(value) ? value : null;
        } catch (error) {
            warn(SCOPE, "Storage access denied; falling back to system preference", error);
            return null;
        }
    }

    #setTheme(theme: ThemeName, shouldSave: boolean): void {
        // Batched in a single frame so attribute, style and meta writes share one paint.
        requestAnimationFrame(() => {
            this.#root.dataset.theme = theme;
            this.#root.style.colorScheme = theme;

            if (shouldSave) {
                try {
                    localStorage.setItem(this.#storageKey, theme);
                } catch (error) {
                    warn(SCOPE, "Could not persist theme preference", error);
                }
            }

            this.#toggleButton?.setAttribute("aria-pressed", String(theme === "dark"));

            if (this.#iconEl) this.#iconEl.textContent = theme === "dark" ? "🌙" : "☀";

            const metaThemeColor = $<HTMLMetaElement>('meta[name="theme-color"]');
            if (!metaThemeColor) return;

            const computedColor = getComputedStyle(this.#root)
                .getPropertyValue(THEME_VARIABLES[theme])
                .trim();
            metaThemeColor.setAttribute("content", computedColor || FALLBACK_COLORS[theme]);
        });
    }

    get current(): ThemeName {
        const active = this.#root.dataset.theme;
        if (isThemeName(active)) return active;
        return matchesMedia(DARK_SCHEME_QUERY) ? "dark" : "light";
    }

    toggleTheme(): void {
        this.#setTheme(this.current === "dark" ? "light" : "dark", true);
    }

    destroy(): void {
        this.#teardown.splice(0).forEach((off) => off());
    }
}
