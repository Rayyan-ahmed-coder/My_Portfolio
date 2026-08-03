import Navigation from "./modules/navigation.js";
import Theme from "./modules/theme.js";
// Other UI modules are deferred to improve startup performance

// Upgraded app.js
class Portfolio {
    constructor() {
        this.modules = {};
        // Ensure DOM is ready before initializing
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
            // Store instances in a map for debugging/access
            // Critical UI modules initialized immediately
            this.modules.navigation = new Navigation();
            this.modules.theme = theme;

            // Defer non-critical modules to idle time to improve initial paint
            const idle = window.requestIdleCallback || (cb => setTimeout(cb, 200));
            idle(async () => {
                try {
                    const [{ default: ObserverManager }, { default: ScrollManager }, { default: CustomCursor }, { default: LoadContent }] = await Promise.all([
                        import('./core/observer.js'),
                        import('./modules/scroll.js'),
                        import('./modules/cursor.js'),
                        import('./core/contentLoader.js')
                    ]);

                    this.modules.observer = new ObserverManager();
                    this.modules.scroll = new ScrollManager(this.modules.observer);
                    this.modules.cursor = new CustomCursor();
                    this.modules.content = new LoadContent();
                } catch (e) {
                    console.warn('Deferred module init failed', e);
                }
            });

            // Defer loading the Command Palette until user interaction (click or Ctrl+K)
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
                    console.warn('Command palette failed to load', err);
                    return null;
                } finally {
                    this._commandLoaderInProgress = false;
                }
            };

            // Lazy init on command toggle click
            const cmdToggleEl = document.getElementById('command-toggle');
            if (cmdToggleEl) {
                cmdToggleEl.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const cp = await loadCommandPalette();
                    if (cp) cp.open();
                });
            }

            // Lazy init on global shortcut (Ctrl/Cmd + K)
            document.addEventListener('keydown', async (ev) => {
                if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
                    ev.preventDefault();
                    const cp = await loadCommandPalette();
                    if (cp) cp.togglePanel();
                }
            });
            // When dynamic content is loaded, attach observers for reveal animations
            document.addEventListener('content:loaded', () => {
                try {
                    this.modules.observer?.observe('[data-reveal]');
                } catch (e) {
                    // silent catch
                }
            }, { once: true });

            if (themeButton) {
                themeButton.addEventListener('click', () => theme.toggleTheme());
            } else {
                console.warn('Theme toggle button not found.');
            }
            
            console.log("Portfolio initialized successfully.");
        } catch (error) {
            window.addEventListener('unhandledrejection', event => {
                console.warn(`Unhandled promise rejection: ${event.reason}`);
            });
            console.error("Portfolio initialization failed:", error);
        }
    }

    destroy() {
        Object.values(this.modules).forEach(module => {
            if (typeof module.destroy === 'function') {
                module.destroy();
            }
        });
    }
}

new Portfolio();