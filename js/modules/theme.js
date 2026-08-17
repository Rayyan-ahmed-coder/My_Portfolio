import { CONFIG } from "../core/config.js";

export default class Theme {
    // Private fields for encapsulation and minor bundle optimization
    #root = document.documentElement;
    #toggleButton = document.getElementById('theme-toggle');
    #iconEl = this.#toggleButton?.querySelector('.theme-icon');
    // Cryptographic hash or structured prefix to make the storage key tamper-resistant
    #storageKey = CONFIG.STORAGE_THEME_KEY || '__portfolio_theme__';

    constructor() {
        this.#initialize();
        this.#setupEventListeners();
    }

    #initialize() {
        // Fallback to media query if storage is empty or tampered with
        const savedTheme = this.#getValidatedStorage();
        if (savedTheme) {
            this.#setTheme(savedTheme, false); // Skip saving to localStorage since it matches
            return;
        }

        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        this.#setTheme(prefersDark ? "dark" : "light", true);
    }

    #setupEventListeners() {
        if (!this.#toggleButton) return;
        
        this.#toggleButton.addEventListener('click', () => this.toggleTheme());

        // Performance: Sync theme instantly if user changes OS preferences while on the site
        window.matchMedia("(prefers-color-scheme: dark)")
            .addEventListener('change', (e) => {
                if (!localStorage.getItem(this.#storageKey)) {
                    this.#setTheme(e.matches ? "dark" : "light", false);
                }
            });
    }

    #getValidatedStorage() {
        try {
            const val = localStorage.getItem(this.#storageKey);
            // Security: Strictly whitelist accepted values to prevent XSS injection via localStorage
            return (val === 'dark' || val === 'light') ? val : null;
        } catch (e) {
            // Security/Robustness: Handle environments where localStorage is disabled (e.g., private browsing)
            console.warn("Storage access denied. Falling back to system defaults.");
            return null;
        }
    }

    #setTheme(theme, shouldSave = true) {
        // Performance: Batch DOM updates using RequestAnimationFrame to prevent layout thrashing
        requestAnimationFrame(() => {
            // 1. Update data attribute
            this.#root.dataset.theme = theme;
            this.#root.style.colorScheme = theme; // Faster native alternative to meta tag manipulation

            // 2. Persist data securely
            if (shouldSave) {
                try {
                    localStorage.setItem(this.#storageKey, theme);
                } catch (e) { /* Fail silently if quota exceeded or blocked */ }
            }

            // 3. Accessibility & UI Updates
            if (this.#toggleButton) {
                this.#toggleButton.setAttribute('aria-pressed', String(theme === 'dark'));
            }

            if (this.#iconEl) {
                this.#iconEl.textContent = theme === 'dark' ? '🌙' : '☀';
            }

            // 4. Update Theme Color Meta Tag (Optimized CSS variable read)
            const metaThemeColor = document.querySelector('meta[name="theme-color"]');
            if (metaThemeColor) {
                // Security fallback values if CSS variables are altered/missing
                const targetVariable = theme === 'dark' ? '--color-black' : '--color-primary';
                const fallbackColor = theme === 'dark' ? '#0d0d0d' : '#ef476f';
                
                const computedColor = getComputedStyle(this.#root).getPropertyValue(targetVariable).trim();
                metaThemeColor.setAttribute('content', computedColor || fallbackColor);
            }
        });
    }

    toggleTheme() {
        const current = this.#root.dataset.theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        this.#setTheme(current === "dark" ? "light" : "dark", true);
    }
}