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
  command?: Disposable;
}

/**
 * Boots the site in three tiers: critical modules synchronously, secondary
 * modules during idle time, and the command palette via decoupled hardware broadcasts.
 */
export default class Portfolio implements Disposable {
  readonly modules: Modules = {};
  #teardown: Unsubscribe[] = [];
  #initialized = false;
  #commandTriggersBound = false;

  constructor() {
    if (typeof window === "undefined" || typeof document === "undefined") {
      this.#initialized = true;
      return;
    }

    this.#teardown.push(installGlobalErrorHandlers());

    if (document.readyState === "loading") {
      this.#teardown.push(
        listen(document, "DOMContentLoaded", () => this.initialize(), {
          once: true,
        }),
      );
      return;
    }

    this.initialize();
  }

  initialize(): void {
    if (this.#initialized) return;
    this.#initialized = true;

    this.#start("theme", () => new Theme());
    this.#start("navigation", () => new NavigationManager());

    onIdle(() => void this.#initializeDeferredModules());
    this.#registerCommandPaletteTriggers();
  }

  #start<K extends keyof Modules>(name: K, factory: () => NonNullable<Modules[K]>): void {
    if (this.modules[name]) return;

    try {
      this.modules[name] = factory();
    } catch (error) {
      reportError(SCOPE, `Module "${name}" failed to initialise`, error);
    }
  }

  async #initializeDeferredModules(): Promise<void> {
    const [observer, scroll, cursor] = await Promise.all([
      this.#importModule("observer", () => import("./core/observer")),
      this.#importModule("scroll", () => import("./modules/scroll")),
      this.#importModule("cursor", () => import("./modules/cursor")),
    ]);

    if (observer) this.#start("observer", () => new observer());
    if (scroll) this.#start("scroll", () => new scroll());
    if (cursor) this.#start("cursor", () => new cursor());

    const observerInstance = this.modules.observer;
    if (!observerInstance || !("observe" in observerInstance)) return;

    this.#teardown.push(
      listen(
        document,
        "content:loaded",
        () => (observerInstance as { observe(selector: string): void }).observe("[data-reveal]"),
        { once: true },
      ),
    );
  }

  async #importModule<T>(name: string, loader: () => Promise<{ default: new () => T }>): Promise<(new () => T) | null> {
    try {
      return (await loader()).default;
    } catch (error) {
      reportError(SCOPE, `Deferred module "${name}" failed to load`, error);
      return null;
    }
  }

  #registerCommandPaletteTriggers(): void {
    if (this.#commandTriggersBound) return;
    this.#commandTriggersBound = true;

    const toggle = document.getElementById("command-toggle");
    if (toggle) {
      this.#teardown.push(
        listen(toggle, "click", (event) => {
          event.preventDefault();
          this.broadcastPaletteTrigger();
        }),
      );
    } else {
      warn(SCOPE, "Command palette toggle button not found");
    }

    this.#teardown.push(
      listen(document, "keydown", (event) => {
        const keyboardEvent = event as KeyboardEvent;
        if (!(keyboardEvent.ctrlKey || keyboardEvent.metaKey)) return;
        if (keyboardEvent.key.toLowerCase() !== "k") return;

        keyboardEvent.preventDefault();
        this.broadcastPaletteTrigger();
      }),
    );
  }

  /**
   * 📡 MAXIMUM OPTIMIZED EVENT BRIDGE: Fires a wireless, native browser signal.
   * This completely detaches React code layouts from your clean TypeScript orchestrator!
   */
  broadcastPaletteTrigger(): void {
    window.dispatchEvent(new CustomEvent("core-engine:toggle-palette"));
  }

  destroy(): void {
    this.#teardown.splice(0).forEach((off) => off());
    this.#initialized = false;
    this.#commandTriggersBound = false;

    // Fetch the active module keys to iterate and mutate the dictionary safely
    const moduleKeys = Object.keys(this.modules) as Array<keyof Modules>;
    const totalKeys = moduleKeys.length;

    for (let i = 0; i < totalKeys; i++) {
      const key = moduleKeys[i];
      const m = this.modules[key];

      if (m && typeof m.destroy === "function") {
        try {
          m.destroy();
        } catch (error) {
          reportError(SCOPE, `Module "${key}" teardown failed`, error);
        }
      }

      delete this.modules[key];
    }
  }
}
