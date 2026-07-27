import { CONFIG } from "../core/config.js";

export default class Theme {
    constructor() {
        this.root = document.documentElement;
        this.initialize();
    }

    initialize() {
        const savedTheme = localStorage.getItem(
            CONFIG.STORAGE_THEME_KEY
        );

        if (savedTheme) {
            this.setTheme(savedTheme);
            return;

        }

        const prefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

        this.setTheme(
            prefersDark ? "dark" : "light"
        );

    }

    setTheme(theme) {
        this.root.dataset.theme = theme;
        localStorage.setItem(CONFIG.STORAGE_THEME_KEY, theme);

    }

    toggleTheme() {
        const current = this.root.dataset.theme;
        this.setTheme(
            current === "dark"? "light" : "dark"
        );
    }
}