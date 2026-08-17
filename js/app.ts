import NavigationManager from "./modules/navigation.js";
import Theme from "./modules/theme.js";
import { installGlobalErrorHandlers, reportError, warn } from "./core/logger.js";
import { listen, onIdle, type Unsubscribe } from "./core/utilities.js";
import type { Disposable } from "./core/types.js";

const SCOPE = "app";

interface Modules {
    navigation?: NavigationManager;
    theme?: Theme;
    observer?: Disposable;
    scroll?: Disposable;
    cursor?: Disposable;
    content?: Disposable;
    command?: Disposable;
}

type CommandPaletteInstance = {
    open(): void;
    togglePanel(): void;
} & Disposable;

/**
 * Boots the site in three tiers: critical modules synchronously, secondary
 * modules during idle time, and the command palette only when first requested.
 * Every tier is isolated so a single failing module cannot break the page.
 */
export class Portfolio implements Disposable {
    readonly modules: Modules = {};
    #teardown: Unsubscribe[] = [];
    #commandPalette: CommandPaletteInstance | null = null;
    #commandLoader: Promise<CommandPaletteInstance | null> | null = null;

    constructor() {
        this.#teardown.push(installGlobalErrorHandlers());

        if (document.readyState === "loading") {
            this.#teardown.push(
                listen(document, "DOMContentLoaded", () => this.initialize(), { once: true })
            );
            return;
        }

        this.initialize();
    }

    initialize(): void {
        this.#start("theme", () => new Theme());
        this.#start("navigation", () => new NavigationManager());

        onIdle(() => void this.#initializeDeferredModules());
        this.#registerCommandPaletteTriggers();
    }

    /** Instantiates one module, reporting instead of aborting the rest of the boot. */
    #start<K extends keyof Modules>(name: K, factory: () => NonNullable<Modules[K]>): void {
        try {
            this.modules[name] = factory();
        } catch (error) {
            reportError(SCOPE, `Module "${name}" failed to initialise`, error);
        }
    }

    async #initializeDeferredModules(): Promise<void> {
        const [observer, scroll, cursor, content] = await Promise.all([
            this.#importModule("observer", () => import("./core/observer.js")),
            this.#importModule("scroll", () => import("./modules/scroll.js")),
            this.#importModule("cursor", () => import("./modules/cursor.js")),
            this.#importModule("content", () => import("./features/projects/island.tsx")),
        ]);

        if (observer) this.#start("observer", () => new observer());
        if (scroll) this.#start("scroll", () => new scroll());
        if (cursor) this.#start("cursor", () => new cursor());
        if (content) this.#start("content", () => new content());

        const observerInstance = this.modules.observer;
        if (!observerInstance || !("observe" in observerInstance)) return;

        // Cards are injected after load, so they are handed to the reveal observer once ready.
        this.#teardown.push(
            listen(
                document,
                "content:loaded",
                () => (observerInstance as { observe(selector: string): void }).observe("[data-reveal]"),
                { once: true }
            )
        );
    }

    async #importModule<T>(
        name: string,
        loader: () => Promise<{ default: new () => T }>
    ): Promise<(new () => T) | null> {
        try {
            return (await loader()).default;
        } catch (error) {
            reportError(SCOPE, `Deferred module "${name}" failed to load`, error);
            return null;
        }
    }

    #registerCommandPaletteTriggers(): void {
        const toggle = document.getElementById("command-toggle");
        if (toggle) {
            this.#teardown.push(
                listen(toggle, "click", (event) => {
                    event.preventDefault();
                    void this.loadCommandPalette().then((palette) => palette?.open());
                })
            );
        } else {
            warn(SCOPE, "Command palette toggle button not found");
        }

        // Ctrl/Cmd+K only bootstraps the palette here; once loaded the palette owns
        // the shortcut itself, so the two handlers never both toggle it.
        this.#teardown.push(
            listen(document, "keydown", (event) => {
                const keyboardEvent = event as KeyboardEvent;
                if (!(keyboardEvent.ctrlKey || keyboardEvent.metaKey)) return;
                if (keyboardEvent.key.toLowerCase() !== "k" || this.#commandPalette) return;

                keyboardEvent.preventDefault();
                void this.loadCommandPalette().then((palette) => palette?.open());
            })
        );
    }

    /** Idempotent lazy loader: concurrent triggers share a single import. */
    loadCommandPalette(): Promise<CommandPaletteInstance | null> {
        if (this.#commandPalette) return Promise.resolve(this.#commandPalette);

        this.#commandLoader ??= import("./modules/commandPalette.js")
            .then(({ default: CommandPalette }) => {
                this.#commandPalette = CommandPalette.create();
                if (this.#commandPalette) this.modules.command = this.#commandPalette;
                return this.#commandPalette;
            })
            .catch((error: unknown) => {
                reportError(SCOPE, "Command palette failed to load", error);
                this.#commandLoader = null;
                return null;
            });

        return this.#commandLoader;
    }

    destroy(): void {
        this.#teardown.splice(0).forEach((off) => off());

        for (const module of Object.values(this.modules)) {
            if (module && typeof module.destroy === "function") {
                try {
                    module.destroy();
                } catch (error) {
                    reportError(SCOPE, "Module teardown failed", error);
                }
            }
        }
    }
}

export default new Portfolio();
