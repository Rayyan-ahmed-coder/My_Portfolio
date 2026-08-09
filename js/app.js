import Navigation from "./modules/navigation.js";
import Theme from "./modules/theme.js";
import { reportError, runSafely } from "./core/errors.js";

class Portfolio {
    constructor() {
        this.modules = {};

        // Global handlers must be bound immediately so failures raised before
        // (or outside of) initialize() are still reported.
        window.addEventListener('unhandledrejection', event => {
            reportError('window.unhandledrejection', event.reason);
        });

        window.addEventListener('error', event => {
            reportError('window.error', event.error ?? event.message, {
                source: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        try {
            const themeButton = document.getElementById('theme-toggle');
            const theme = new Theme();

            this.modules.navigation = new Navigation();
            this.modules.theme = theme;

            const idle = window.requestIdleCallback || (cb => setTimeout(cb, 200));
            idle(() => {
                runSafely('app.loadDeferredModules', () => this.#loadDeferredModules());
            });

            this.modules.command = null;
            this._commandLoaderInProgress = false;

            const loadCommandPalette = async () => {
                if (this.modules.command || this._commandLoaderInProgress) return this.modules.command;
                this._commandLoaderInProgress = true;
                try {
                    const mod = await import('./modules/commandPalette.js');
                    this.modules.command = new mod.default();
                    return this.modules.command;
                } catch (err) {
                    reportError('app.loadCommandPalette', err);
                    return null;
                } finally {
                    this._commandLoaderInProgress = false;
                }
            };

            const cmdToggleEl = document.getElementById('command-toggle');
            if (cmdToggleEl) {
                cmdToggleEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    runSafely('app.commandToggleClick', async () => {
                        const cp = await loadCommandPalette();
                        if (cp) cp.open();
                    });
                });
            }

            document.addEventListener('keydown', (ev) => {
                if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
                    ev.preventDefault();
                    runSafely('app.commandToggleShortcut', async () => {
                        const cp = await loadCommandPalette();
                        if (cp) cp.togglePanel();
                    });
                }
            });

            document.addEventListener('content:loaded', () => {
                runSafely('app.observeRevealedContent', () => {
                    this.modules.observer?.observe('[data-reveal]');
                });
            }, { once: true });

            if (themeButton) {
                themeButton.addEventListener('click', () => {
                    runSafely('app.themeToggleClick', () => theme.toggleTheme());
                });
            } else {
                console.warn('Theme toggle button not found.');
            }

            console.log("Portfolio initialized successfully.");
        } catch (error) {
            // Core bootstrap failed: report it and let it reach window.onerror
            // instead of leaving the page in a half-initialized silent state.
            throw reportError('app.initialize', error);
        }
    }

    /**
     * Loads the deferred modules independently so that one failing import or
     * constructor does not take the remaining modules down with it.
     */
    async #loadDeferredModules() {
        const deferred = [
            ['observer', async () => {
                const { default: ObserverManager } = await import('./core/observer.js');
                this.modules.observer = new ObserverManager();
            }],
            ['cursor', async () => {
                const { default: CustomCursor } = await import('./modules/cursor.js');
                this.modules.cursor = new CustomCursor();
            }],
            ['content', async () => {
                const { default: LoadContent } = await import('./core/contentLoader.js');
                this.modules.content = new LoadContent();
            }]
        ];

        const results = await Promise.allSettled(deferred.map(([, load]) => load()));

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                reportError('app.loadDeferredModules', result.reason, { module: deferred[index][0] });
            }
        });

        // ScrollManager is loaded last because it consumes the observer instance.
        try {
            const { default: ScrollManager } = await import('./modules/scroll.js');
            this.modules.scroll = new ScrollManager(this.modules.observer);
        } catch (error) {
            reportError('app.loadDeferredModules', error, { module: 'scroll' });
        }
    }

    destroy() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                runSafely('app.destroy', () => module.destroy());
            }
        });
    }
}

new Portfolio();
