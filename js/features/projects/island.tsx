import { render } from "preact";
import { ProjectGrid } from "./ProjectGrid.tsx";
import { $, onIdle } from "../../core/utilities.js";
import { reportError } from "../../core/logger.js";
import type { Disposable } from "../../core/types.js";

const SCOPE = "projects";

/**
 * Preact island for the project grid: nothing is downloaded or rendered until
 * the section approaches the viewport, and the rest of the page stays plain DOM.
 */
export default class ProjectsIsland implements Disposable {
    readonly #grid: HTMLElement | null;
    #observer: IntersectionObserver | null = null;
    #mounted = false;

    constructor() {
        this.#grid = $("#projects-grid");
        this.init();
    }

    init(): void {
        const grid = this.#grid;
        if (!grid) {
            reportError(SCOPE, "Target #projects-grid element not found in DOM", new Error("missing-grid"));
            return;
        }

        const hydrate = (): void => onIdle(() => this.mount(), 50);

        if (!("IntersectionObserver" in window)) {
            hydrate();
            return;
        }

        this.#observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                this.#observer?.disconnect();
                this.#observer = null;
                hydrate();
            },
            { rootMargin: "240px 0px", threshold: 0.01 }
        );
        this.#observer.observe(grid.closest("section") ?? grid);
    }

    mount(): void {
        const grid = this.#grid;
        if (!grid || this.#mounted) return;

        try {
            render(<ProjectGrid />, grid);
            this.#mounted = true;
        } catch (error) {
            reportError(SCOPE, "Project grid failed to render", error);
        }
    }

    get mounted(): boolean {
        return this.#mounted;
    }

    destroy(): void {
        this.#observer?.disconnect();
        this.#observer = null;

        if (this.#grid && this.#mounted) {
            render(null, this.#grid);
            this.#mounted = false;
        }
    }
}
