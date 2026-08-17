import { $, $$, escapeHtml, onIdle } from "./utilities.js";
import { reportError, warn } from "./logger.js";
import type { ContentLoadedDetail, Disposable, Project } from "./types.js";

const SCOPE = "contentLoader";
const MAX_ATTEMPTS = 2;

/** Served from public/, so the path stays stable and same-origin under the CSP. */
export const PROJECTS_URL = `${import.meta.env.BASE_URL}data/projects.json`;

const asString = (value: unknown, fallback: string): string =>
    typeof value === "string" && value.trim() !== "" ? value : fallback;

/** Normalises one raw JSON entry, or rejects it when the shape is unusable. */
const parseProject = (raw: unknown, index: number): Project | null => {
    if (typeof raw !== "object" || raw === null) {
        warn(SCOPE, `Skipping project #${index}: not an object`);
        return null;
    }

    const record = raw as Record<string, unknown>;
    const content = (record.content ?? {}) as Record<string, unknown>;
    const preview = Array.isArray(record.preview) ? record.preview : [];
    const parsedNumber = Number.parseInt(String(record.number ?? ""), 10);
    const target = asString(record.target, "_blank").toLowerCase();

    return {
        main: record.main === true,
        number: Number.isFinite(parsedNumber) ? parsedNumber : 0,
        preview: [asString(preview[0], "Not Defined"), asString(preview[1], "Not Defined")],
        type: asString(record.type, "Type Value not set"),
        heading: asString(content.heading, "Untitled Project"),
        description: asString(content.description, "Description not set"),
        category: asString(record.category, "unknown").toLowerCase().trim(),
        tags: Array.isArray(record.tags) ? record.tags.filter((tag): tag is string => typeof tag === "string") : [],
        link: asString(record.link, "#"),
        openInNewTab: target.includes("blank"),
        preFetch: record.preFetch === true,
    };
};

export const parseProjects = (payload: unknown): Project[] => {
    if (!Array.isArray(payload)) {
        warn(SCOPE, "Projects payload is not an array");
        return [];
    }

    return payload
        .map((raw, index) => parseProject(raw, index))
        .filter((project): project is Project => project !== null);
};

/**
 * Lazily fetches and renders the project grid: nothing is requested until the
 * section approaches the viewport, and rendering happens in a single DOM write.
 */
export default class LoadContent implements Disposable {
    #projectsGrid: HTMLElement | null;
    #abortController: AbortController | null = null;
    #cards: HTMLElement[] = [];
    #filterButtons: HTMLElement[] = [];
    #observer: IntersectionObserver | null = null;
    #detachFilters: (() => void) | null = null;
    #loading = false;
    #loaded = false;

    constructor() {
        this.#projectsGrid = $("#projects-grid");
        this.init();
    }

    init(): void {
        const grid = this.#projectsGrid;
        if (!grid) {
            reportError(SCOPE, "Target #projects-grid element not found in DOM", new Error("missing-grid"));
            return;
        }

        const triggerLoad = (): void => onIdle(() => void this.loadProjects(), 50);

        if (!("IntersectionObserver" in window)) {
            triggerLoad();
            return;
        }

        const observerTarget = grid.closest("section") ?? grid;
        this.#observer = new IntersectionObserver(
            (entries) => {
                if (!entries.some((entry) => entry.isIntersecting)) return;
                this.#observer?.disconnect();
                this.#observer = null;
                triggerLoad();
            },
            { rootMargin: "240px 0px", threshold: 0.01 }
        );
        this.#observer.observe(observerTarget);
    }

    /** Fetches the manifest, retrying once on transient network failures. */
    async loadProjects(attempt = 1): Promise<void> {
        const grid = this.#projectsGrid;
        if (!grid || this.#loading) return;
        this.#loading = true;

        this.#abortController?.abort();
        const controller = new AbortController();
        this.#abortController = controller;

        try {
            const response = await fetch(PROJECTS_URL, {
                cache: "force-cache",
                signal: controller.signal,
                headers: { Accept: "application/json" },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status} while loading projects`);
            }

            const projects = parseProjects((await response.json()) as unknown);
            if (!projects.length) {
                this.#renderStaticMessage('<p class="error-msg">No Projects Found.</p>');
                return;
            }

            this.#render(grid, projects);
            this.#loaded = true;
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") return;

            if (attempt < MAX_ATTEMPTS) {
                warn(SCOPE, `Project load attempt ${attempt} failed; retrying`, error);
                this.#loading = false;
                await this.loadProjects(attempt + 1);
                return;
            }

            reportError(SCOPE, "Failed to load projects", error);
            this.#renderStaticMessage('<p class="error-msg">Failed to Load Projects.</p>');
        } finally {
            this.#loading = false;
        }
    }

    get loaded(): boolean {
        return this.#loaded;
    }

    #render(grid: HTMLElement, projects: readonly Project[]): void {
        const template = document.createElement("template");
        template.innerHTML = projects.map((project) => this.#cardHTML(project)).join("");

        grid.replaceChildren(template.content);
        this.#attachProjectFilterEvents(grid);

        document.dispatchEvent(
            new CustomEvent<ContentLoadedDetail>("content:loaded", { detail: { count: projects.length } })
        );
    }

    #cardHTML(project: Project): string {
        const displayNumber = String(project.number).padStart(2, "0");
        const heading = escapeHtml(project.heading);
        const tags = project.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
        const linkTarget = project.openInNewTab
            ? 'target="_blank" rel="noopener noreferrer"'
            : 'target="_self"';
        const cardClass = project.main ? "project-card project-card-large" : "project-card";

        return `
        <article class="${cardClass}" data-category="${escapeHtml(project.category)}" data-reveal>
            <div class="project-preview">
                <div class="project-number" aria-hidden="true">${displayNumber}</div>
                <div class="project-preview-content">
                    <span>${escapeHtml(project.preview[0])}</span>
                    <strong>${escapeHtml(project.preview[1])}</strong>
                </div>
            </div>

            <div class="project-content">
                <div>
                    <p class="project-type">${escapeHtml(project.type)}</p>
                    <h3 id="project-title-${displayNumber}">${heading}</h3>
                    <p>${escapeHtml(project.description)}</p>
                </div>

                <div class="project-footer">
                    <div class="project-tags" role="list" aria-label="Project technologies">${tags}</div>
                    <a class="project-link"
                       href="${escapeHtml(encodeURI(project.link))}"
                       title="Explore ${heading}"
                       ${linkTarget}
                       ${project.preFetch ? "" : 'prefetch="false"'}
                       aria-describedby="project-title-${displayNumber}">
                        View <span class="link-arrow" aria-hidden="true">↗</span>
                    </a>
                </div>
            </div>
        </article>`;
    }

    #renderStaticMessage(htmlString: string): void {
        if (this.#projectsGrid) this.#projectsGrid.innerHTML = htmlString;
    }

    /**
     * One delegated listener drives every filter button, so re-rendering the
     * grid can never accumulate duplicate handlers.
     */
    #attachProjectFilterEvents(grid: HTMLElement): void {
        this.#detachFilters?.();

        this.#filterButtons = Array.from($$<HTMLElement>(".filter-button"));
        this.#cards = Array.from($$<HTMLElement>(".project-card", grid));
        if (!this.#filterButtons.length) return;

        const container = this.#filterButtons[0].closest(".project-filters") ?? document;
        const onClick = (event: Event): void => {
            const button = (event.target as Element | null)?.closest<HTMLElement>(".filter-button");
            if (button && this.#filterButtons.includes(button)) this.#handleProjectFilter(button);
        };

        container.addEventListener("click", onClick);
        this.#detachFilters = () => container.removeEventListener("click", onClick);
    }

    #handleProjectFilter(button: HTMLElement): void {
        const filterValue = (button.dataset.filter ?? "").trim().toLowerCase();

        requestAnimationFrame(() => {
            for (const card of this.#cards) {
                const matches = filterValue === "all" || (card.dataset.category ?? "").includes(filterValue);
                card.classList.toggle("is-hidden", !matches);
            }

            for (const candidate of this.#filterButtons) {
                const isSelected = candidate === button;
                candidate.classList.toggle("active", isSelected);
                candidate.setAttribute("aria-pressed", String(isSelected));
            }
        });
    }

    destroy(): void {
        this.#abortController?.abort();
        this.#abortController = null;
        this.#observer?.disconnect();
        this.#observer = null;
        this.#detachFilters?.();
        this.#detachFilters = null;
        this.#cards = [];
        this.#filterButtons = [];
    }
}
