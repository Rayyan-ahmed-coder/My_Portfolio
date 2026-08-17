import Navigation from "./modules/navigation.js";
import Theme from "./modules/theme.js";

class Portfolio {
    constructor() {
        this.modules = {};
        
        // FIXED: Global error handlers must be bound immediately in constructor, 
        // not nested inside catch blocks where they will never trigger out-of-box loops.
        window.addEventListener('unhandledrejection', event => {
            console.warn(`Unhandled promise rejection: ${event.reason}`);
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
            idle(async () => {
                try {
                    const [
                        { default: ObserverManager }, 
                        { default: ScrollManager }, 
                        { default: CustomCursor }, 
                        { default: LoadContent }
                    ] = await Promise.all([
                        import('./core/observer.js'),
                        import('./modules/scroll.js'),
                        import('./modules/cursor.js'),
                        import('./core/contentLoader.js')
                    ]);

                    this.modules.observer = new ObserverManager();
                    // Pass the complete instance map if ScrollManager requires theme or nav reference states later
                    this.modules.scroll = new ScrollManager(this.modules.observer);
                    this.modules.cursor = new CustomCursor();
                    this.modules.content = new LoadContent();
                } catch (e) {
                    console.warn('Deferred module init failed', e);
                }
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
                    console.warn('Command palette failed to load', err);
                    return null;
                } finally {
                    this._commandLoaderInProgress = false;
                }
            };

            const cmdToggleEl = document.getElementById('command-toggle');
            if (cmdToggleEl) {
                cmdToggleEl.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const cp = await loadCommandPalette();
                    if (cp) cp.open();
                });
            }

            document.addEventListener('keydown', async (ev) => {
                if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
                    ev.preventDefault();
                    const cp = await loadCommandPalette();
                    if (cp) cp.togglePanel();
                }
            });

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
            console.error("Portfolio initialization failed:", error);
        }
    }

    destroy() {
        Object.values(this.modules).forEach(module => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
    }
}

new Portfolio();