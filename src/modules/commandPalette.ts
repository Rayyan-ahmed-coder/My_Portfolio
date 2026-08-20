import { $, $$, DARK_SCHEME_QUERY, debounce, escapeHtml, listen, matchesMedia, type Debounced, type Unsubscribe } from "../../src/core/utilities.js";
import { reportError, warn } from "../../src/core/logger.js";
import type { AnalyticsData, Command, CommandCategory, Disposable } from "../../src/core/types.js";

const SCOPE = "commandPalette";
const FILTER_DELAY_MS = 120;
const CONTACT_EMAIL_FALLBACK = "rayyan.workhost@gmail.com";

interface PaletteElements {
    panel: HTMLElement;
    toggle: HTMLElement;
    closeButton: HTMLElement;
    input: HTMLInputElement;
    list: HTMLElement;
    resultsTitle: HTMLElement;
    analyticsContainer: HTMLElement;
    summaryContainer: HTMLElement;
    metaContainer: HTMLElement;
}

/** Thrown when the markup the palette needs is absent. */
export class MissingPaletteElementsError extends Error {
    constructor(readonly missing: readonly string[]) {
        super(`Command palette elements are missing: ${missing.join(", ")}`);
        this.name = "MissingPaletteElementsError";
    }
}

const collectElements = (): PaletteElements => {
    const candidates = {
        panel: $("#command-panel"),
        toggle: $("#command-toggle"),
        closeButton: $("#command-close"),
        input: $<HTMLInputElement>("#command-input"),
        list: $("#command-list"),
        resultsTitle: $(".command-panel-results-title"),
        analyticsContainer: $("#command-analytics"),
        summaryContainer: $("#command-summary"),
        metaContainer: $(".command-panel-meta"),
    };

    const missing = Object.entries(candidates)
        .filter(([, element]) => element === null)
        .map(([name]) => name);

    if (missing.length) throw new MissingPaletteElementsError(missing);

    return candidates as PaletteElements;
};

/** Modal palette for global search, quick actions and live site analytics. */
export default class CommandPalette implements Disposable {
    readonly commands: readonly Command[];
    #elements: PaletteElements;
    #searchIndex: readonly string[];
    #shortcutMap = new Map<string, Command>();
    #filteredCommands: Command[];
    #selectedIndex = 0;
    #analyticsCache: AnalyticsData | null = null;
    #debouncedFilter: Debounced<[]>;
    #teardown: Unsubscribe[] = [];

    /** Non-throwing factory: returns null when the palette markup is absent. */
    static create(): CommandPalette | null {
        try {
            return new CommandPalette();
        } catch (error) {
            if (error instanceof MissingPaletteElementsError) {
                warn(SCOPE, error.message);
                return null;
            }
            reportError(SCOPE, "Command palette failed to initialise", error);
            return null;
        }
    }

    constructor() {
        this.#elements = collectElements();
        this.commands = this.#buildCommands();
        this.#filteredCommands = [...this.commands];

        // Search matches against a pre-lowercased index instead of re-normalising
        // every command on each keystroke.
        this.#searchIndex = this.commands.map((command) =>
            `${command.title} ${command.subtitle} ${command.category}`.toLowerCase()
        );

        for (const command of this.commands) {
            if (command.shortcut) this.#shortcutMap.set(command.shortcut.toLowerCase(), command);
        }

        this.#debouncedFilter = debounce(() => this.filterCommands(), FILTER_DELAY_MS);
        this.init();
    }

    #buildCommands(): readonly Command[] {
        const nav = (title: string, subtitle: string, hash: string, shortcut: string): Command => ({
            title,
            subtitle,
            category: "Navigation",
            shortcut,
            action: () => this.navigateTo(hash),
        });
        const filter = (title: string, subtitle: string, value: string, shortcut: string): Command => ({
            title,
            subtitle,
            category: "Filters",
            shortcut,
            action: () => {
                this.dispatchSelector(`[data-filter="${value}"]`);
            },
        });
        const rootFontSize = (): number => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

        return [
            nav("Go to Home", "Jump to the hero section", "#home", "1"),
            nav("Go to Work", "See selected projects", "#work", "2"),
            nav("Go to Features", "Review what sets this portfolio apart", "#features", "3"),
            nav("Go to About", "Learn more about the developer", "#about", "4"),
            nav("Go to Skills", "View the technology toolkit", "#skills", "5"),
            nav("Go to Contact", "Open the contact section", "#contact", "6"),
            nav("Jump to projects", "Open the project gallery", "#work", "7"),
            { title: "Open resume", subtitle: "View or download resume (new tab)", category: "Actions", shortcut: "8", action: () => this.openLink("/resume.pdf") },
            { title: "Open GitHub", subtitle: "Jump to my GitHub profile", category: "Social", shortcut: "9", action: () => this.openLink("https://github.com/") },
            { title: "Open LinkedIn", subtitle: "Jump to my LinkedIn profile", category: "Social", shortcut: "0", action: () => this.openLink("https://www.linkedin.com/") },

            filter("Show all projects", "Reset project filters", "all", "f"),
            filter("Show web projects", "Filter to Web projects", "web", "w"),
            filter("Show JavaScript projects", "Filter to JavaScript projects", "javascript", "j"),
            filter("Show games", "Filter to Game projects", "game", "g"),

            { title: "Toggle theme", subtitle: "Switch between light and dark mode", category: "Actions", shortcut: "Alt+Shift+T", action: () => this.dispatchCommand("theme-toggle") },
            { title: "Open navigation menu", subtitle: "Toggle the mobile navigation", category: "Actions", shortcut: "Alt+Shift+M", action: () => this.dispatchCommand("menu-toggle") },
            { title: "Copy email address", subtitle: "Copy the contact email to clipboard", category: "Actions", shortcut: "Alt+Shift+C", action: () => this.copyEmail() },
            { title: "Copy creator name", subtitle: "Copy my name to clipboard", category: "Actions", shortcut: "Alt+Shift+P", action: () => this.copyText("Rayyan Khan") },
            { title: "Open email client", subtitle: "Create a new message to contact me", category: "Actions", shortcut: "Alt+Shift+E", action: () => this.dispatchSelector(".contact-email") },
            { title: "Copy site URL", subtitle: "Copy the current page URL", category: "Actions", shortcut: "Alt+Shift+U", action: () => this.copyText(window.location.href) },
            { title: "Toggle animations", subtitle: "Enable/disable page motion effects", category: "Actions", shortcut: "Alt+Shift+A", action: () => document.documentElement.classList.toggle("reduced-motion") },
            { title: "Download resume", subtitle: "Download the resume PDF", category: "Actions", shortcut: "Alt+Shift+R", action: () => this.openLink("/resume.pdf") },
            { title: "Focus search", subtitle: "Open command palette and focus the search", category: "Actions", shortcut: "Alt+Shift+S", action: () => this.focusSearch() },

            { title: "Increase text size", subtitle: "Increase base font size for readability", category: "Accessibility", shortcut: "Alt+Shift++", action: () => document.documentElement.style.setProperty("font-size", `${rootFontSize() + 1}px`) },
            { title: "Decrease text size", subtitle: "Decrease base font size", category: "Accessibility", shortcut: "Alt+Shift+-", action: () => document.documentElement.style.setProperty("font-size", `${Math.max(12, rootFontSize() - 1)}px`) },
            { title: "Toggle high contrast", subtitle: "Enable/disable high contrast mode", category: "Accessibility", shortcut: "Alt+Shift+H", action: () => document.documentElement.classList.toggle("high-contrast") },

            { title: "Print page", subtitle: "Open browser print dialog", category: "Tools", shortcut: "p", action: () => window.print() },
            { title: "Open devtools (hint)", subtitle: "Suggestion: use browser devtools", category: "Tools", shortcut: "d", action: () => this.openLink("about:blank") },
            { title: "View source (GitHub)", subtitle: "Open repository source", category: "Tools", shortcut: "v", action: () => this.openLink("https://github.com/") },

            { title: "Scroll to top", subtitle: "Return to the top of the page", category: "Navigation", shortcut: "Home", action: () => window.scrollTo({ top: 0, behavior: "smooth" }) },
            { title: "Scroll to bottom", subtitle: "Jump to bottom of page", category: "Navigation", shortcut: "End", action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }) },
            nav("Open contact links", "Open contact links area", "#contact", "k"),
            { title: "Open projects grid", subtitle: "Focus the projects area", category: "Navigation", shortcut: "x", action: () => this.dispatchSelector("#projects-grid") },
        ];
    }

    init(): void {
        const { toggle, closeButton, input, panel, list } = this.#elements;

        this.#teardown.push(
            listen(toggle, "click", () => this.open()),
            listen(closeButton, "click", () => this.close()),
            listen(input, "input", () => this.#debouncedFilter()),
            listen(input, "keydown", (event) => this.handleKeyDown(event as KeyboardEvent)),
            listen(panel, "click", (event) => {
                if (event.target === panel) this.close();
            }),
            // Delegation keeps one listener alive regardless of how often the list re-renders.
            listen(list, "click", (event) => {
                const index = this.#indexFromEvent(event);
                if (index !== null) this.executeCommand(index);
            }),
            listen(list, "mouseover", (event) => {
                const index = this.#indexFromEvent(event);
                if (index !== null) this.setSelectedIndex(index);
            }),
            listen(document, "keydown", (event) => this.#onDocumentKeyDown(event as KeyboardEvent)),
            // Analytics are derived from the DOM, so the cache is dropped whenever content changes.
            listen(document, "content:loaded", () => this.invalidateAnalytics())
        );

        this.#renderChrome();
        this.renderCommands();
    }

    #indexFromEvent(event: Event): number | null {
        const item = (event.target as Element | null)?.closest<HTMLElement>(".command-item");
        if (!item?.dataset.index) return null;

        const index = Number(item.dataset.index);
        return Number.isInteger(index) ? index : null;
    }

    #onDocumentKeyDown(event: KeyboardEvent): void {
        // The panel's own handler runs first and marks the keys it consumed, so a
        // shortcut is never executed twice on its way up to the document.
        if (event.defaultPrevented) return;

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
            event.preventDefault();
            this.togglePanel();
            return;
        }

        if (this.handleGlobalShortcut(event)) return;

        if (event.key === "Escape" && this.isOpen()) {
            event.preventDefault();
            this.close();
        }
    }

    open(): void {
        const { panel, input } = this.#elements;

        document.body.classList.add("body-locked");
        panel.classList.add("open");
        panel.setAttribute("aria-hidden", "false");
        input.value = "";

        this.invalidateAnalytics();
        this.filterCommands();
        this.#renderChrome();
        input.focus();
    }

    close(): void {
        const { panel, toggle } = this.#elements;

        document.body.classList.remove("body-locked");
        panel.classList.remove("open");
        panel.setAttribute("aria-hidden", "true");
        toggle.focus();
    }

    togglePanel(): void {
        if (this.isOpen()) {
            this.close();
        } else {
            this.open();
        }
    }

    isOpen(): boolean {
        return this.#elements.panel.classList.contains("open");
    }

    get filteredCommands(): readonly Command[] {
        return this.#filteredCommands;
    }

    get selectedIndex(): number {
        return this.#selectedIndex;
    }

    /** Lowercased shortcut to command lookup used by the global key handler. */
    get shortcuts(): ReadonlyMap<string, Command> {
        return this.#shortcutMap;
    }

    filterCommands(): void {
        const query = this.#elements.input.value.trim().toLowerCase();

        this.#filteredCommands = query
            ? this.commands.filter((_, index) => this.#searchIndex[index].includes(query))
            : [...this.commands];
        this.#selectedIndex = 0;
        this.renderCommands();
    }

    renderCommands(): void {
        const { list, resultsTitle } = this.#elements;
        const fragment = document.createDocumentFragment();
        const total = this.#filteredCommands.length;

        if (total === 0) {
            const emptyState = document.createElement("div");
            emptyState.className = "command-item empty";
            emptyState.textContent = "No matching commands";
            fragment.appendChild(emptyState);
            list.replaceChildren(fragment);
            resultsTitle.textContent = "Commands · 0 results";
            return;
        }

        const grouped = new Map<CommandCategory, { command: Command; index: number }[]>();
        this.#filteredCommands.forEach((command, index) => {
            const bucket = grouped.get(command.category);
            if (bucket) {
                bucket.push({ command, index });
            } else {
                grouped.set(command.category, [{ command, index }]);
            }
        });

        for (const [category, entries] of grouped) {
            const categoryLabel = document.createElement("div");
            categoryLabel.className = "command-category";
            categoryLabel.textContent = category;
            fragment.appendChild(categoryLabel);

            for (const { command, index } of entries) {
                fragment.appendChild(this.#createCommandItem(command, index));
            }
        }

        list.replaceChildren(fragment);
        resultsTitle.textContent = `Commands · ${total} result${total === 1 ? "" : "s"}`;
    }

    #createCommandItem(command: Command, index: number): HTMLButtonElement {
        const item = document.createElement("button");
        const isSelected = index === this.#selectedIndex;

        item.type = "button";
        item.className = isSelected ? "command-item selected" : "command-item";
        item.dataset.index = String(index);
        item.setAttribute("role", "option");
        item.setAttribute("aria-selected", String(isSelected));
        item.innerHTML =
            `<div class="command-item-main"><strong>${escapeHtml(command.title)}</strong>` +
            `<span>${escapeHtml(command.subtitle || "Press Enter to execute")}</span></div>` +
            (command.shortcut ? `<kbd class="cmd-shortcut">${escapeHtml(command.shortcut)}</kbd>` : "");

        return item;
    }

    #renderChrome(): void {
        this.renderMeta();
        this.renderAnalytics();
        this.renderSummary();
    }

    renderAnalytics(): void {
        const data = this.getAnalyticsData();
        const fragment = document.createDocumentFragment();
        const order = [
            "projects",
            "categories",
            "techTags",
            "sections",
            "skills",
            "filters",
            "features",
            "commandGroups",
            "actions",
            "topTag",
            "theme",
        ] as const;

        for (const key of order) {
            const stat = data[key];
            if (!stat || stat.value === 0 || stat.value === "None") continue;

            const card = document.createElement("div");
            card.className = "command-stat";
            card.innerHTML = `<strong>${escapeHtml(stat.value)}</strong><span>${escapeHtml(stat.label)}</span>`;
            fragment.appendChild(card);
        }

        this.#elements.analyticsContainer.replaceChildren(fragment);
    }

    renderMeta(): void {
        const data = this.getAnalyticsData();
        const fragment = document.createDocumentFragment();
        const chips = [
            { label: "Open palette", value: "Ctrl + K" },
            { label: "Toggle theme", value: "Alt + Shift + T" },
            { label: "Menu toggle", value: "Alt + Shift + M" },
            { label: "Copy email", value: "Alt + Shift + C" },
            { label: "Commands", value: String(data.commands.value) },
        ];

        for (const chip of chips) {
            const element = document.createElement("span");
            element.className = "command-chip";
            element.textContent = `${chip.value} · ${chip.label}`;
            fragment.appendChild(element);
        }

        this.#elements.metaContainer.replaceChildren(fragment);
    }

    renderSummary(): void {
        const summary = this.getSummaryData();
        this.#elements.summaryContainer.innerHTML =
            `<strong>${escapeHtml(summary.title)}</strong><span>${escapeHtml(summary.description)}</span>`;
    }

    handleGlobalShortcut(event: KeyboardEvent): boolean {
        if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) {
            const command = this.#shortcutMap.get(`alt+shift+${event.key.toLowerCase()}`);
            if (!command) return false;

            event.preventDefault();
            void command.action();
            return true;
        }

        if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) return false;

        const active = document.activeElement;
        const isTyping =
            active instanceof HTMLElement &&
            (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable);
        if (isTyping || !/^[0-9a-z]$/i.test(event.key)) return false;

        const command = this.#shortcutMap.get(event.key.toLowerCase());
        if (!command) return false;

        event.preventDefault();
        void command.action();
        return true;
    }

    getSummaryData(): { title: string; description: string } {
        const data = this.getAnalyticsData();

        return {
            title: `Live portfolio snapshot • ${data.commands.value} commands ready`,
            description: `${data.projects.value} projects · ${data.categories.value} categories · ${data.techTags.value} tech tags · ${data.sections.value} section anchors · ${data.skills.value} skill groups · ${data.theme.value} mode`,
        };
    }

    /** Drops the memoised DOM statistics; the next read recomputes them. */
    invalidateAnalytics(): void {
        this.#analyticsCache = null;
    }

    /**
     * Scans the DOM once per open instead of once per rendered section: meta,
     * summary and stat cards all read from the same memoised snapshot.
     */
    getAnalyticsData(): AnalyticsData {
        if (this.#analyticsCache) return this.#analyticsCache;

        const projects = Array.from($$<HTMLElement>(".project-card"));
        const projectTags = Array.from($$(".project-tags span"))
            .map((tag) => tag.textContent?.trim() ?? "")
            .filter(Boolean);
        const projectCategories = new Set(
            projects.flatMap((project) => (project.dataset.category ?? "").split(" ").filter(Boolean))
        );
        const navLinks = $$(".nav-link").length;
        const activeTheme = this.#activeTheme();
        const tagCounts = new Map<string, number>();
        for (const tag of projectTags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        const topTechTag = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

        this.#analyticsCache = {
            commands: { value: this.commands.length, label: "Commands available" },
            projects: { value: projects.length, label: "Projects featured" },
            categories: { value: projectCategories.size, label: "Project categories" },
            techTags: { value: new Set(projectTags).size, label: "Technology tags" },
            sections: { value: $$("section[id]").length || navLinks, label: "Section anchors" },
            skills: { value: $$(".skill-row").length, label: "Skill rows detected" },
            filters: { value: this.#countByCategory("Filters"), label: "Filter commands" },
            features: { value: $$(".feature-card").length, label: "Feature cards" },
            commandGroups: {
                value: new Set(this.commands.map((command) => command.category)).size,
                label: "Command groups",
            },
            actions: { value: this.#countByCategory("Actions"), label: "Action commands" },
            topTag: { value: topTechTag, label: "Top tech tag" },
            theme: {
                value: `${activeTheme.charAt(0).toUpperCase()}${activeTheme.slice(1)}`,
                label: "Theme mode",
            },
        };

        return this.#analyticsCache;
    }

    #activeTheme(): string {
        return document.documentElement.dataset.theme ?? (matchesMedia(DARK_SCHEME_QUERY) ? "dark" : "light");
    }

    #countByCategory(category: CommandCategory): number {
        return this.commands.filter((command) => command.category === category).length;
    }

    copyEmail(): Promise<unknown> {
        const emailLink = $<HTMLAnchorElement>(".contact-email");
        const emailAddress =
            emailLink?.getAttribute("href")?.replace("mailto:", "") || CONTACT_EMAIL_FALLBACK;
        return this.copyText(emailAddress);
    }

    copyText(value: string): Promise<unknown> {
        const clipboard = navigator.clipboard;
        if (!clipboard?.writeText) {
            warn(SCOPE, "Clipboard API unavailable");
            return Promise.resolve(null);
        }

        return clipboard.writeText(value).catch((error: unknown) => {
            warn(SCOPE, "Clipboard write rejected", error);
            return null;
        });
    }

    focusSearch(): void {
        this.open();
        this.#elements.input.focus();
        this.#elements.input.select();
    }

    handleKeyDown(event: KeyboardEvent): void {
        if (!this.isOpen()) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            this.setSelectedIndex(Math.min(this.#selectedIndex + 1, this.#filteredCommands.length - 1));
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            this.setSelectedIndex(Math.max(this.#selectedIndex - 1, 0));
            return;
        }

        if (
            /^[0-9]$/.test(event.key) &&
            event.target === this.#elements.input &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey
        ) {
            const index = event.key === "0" ? 9 : Number(event.key) - 1;
            if (index < this.#filteredCommands.length) {
                event.preventDefault();
                this.executeCommand(index);
            }
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            this.executeCommand(this.#selectedIndex);
        }
    }

    setSelectedIndex(index: number): void {
        this.#selectedIndex = index;

        for (const item of $$<HTMLElement>(".command-item", this.#elements.list)) {
            const selected = Number(item.dataset.index) === index;
            item.setAttribute("aria-selected", String(selected));
            item.classList.toggle("selected", selected);
        }

        $(`.command-item[data-index="${index}"]`, this.#elements.list)?.scrollIntoView({
            block: "nearest",
            inline: "nearest",
        });
    }

    executeCommand(index: number): void {
        const command = this.#filteredCommands[index];
        if (!command) return;

        try {
            const result = command.action();
            if (result instanceof Promise) {
                result.catch((error: unknown) => reportError(SCOPE, `Command "${command.title}" failed`, error));
            }
        } catch (error) {
            reportError(SCOPE, `Command "${command.title}" failed`, error);
        }

        this.close();
    }

    navigateTo(hash: string): void {
        $(hash)?.scrollIntoView({ behavior: "smooth" });
    }

    dispatchCommand(elementId: string): boolean {
        const element = document.getElementById(elementId);
        if (element) {
            element.click();
            return true;
        }

        warn(SCOPE, `Command target not found: ${elementId}`);
        return false;
    }

    dispatchSelector(selector: string): boolean {
        const element =
            $<HTMLElement>(selector) ??
            (selector.startsWith(".") ? $<HTMLElement>(`a[href*="${selector.slice(1)}"]`) : null);

        if (element) {
            element.click();
            return true;
        }

        warn(SCOPE, `Selector command target not found: ${selector}`);
        return false;
    }

    openLink(url: string): void {
        window.open(url, "_blank", "noopener,noreferrer");
    }

    destroy(): void {
        this.#debouncedFilter.cancel();
        this.#teardown.splice(0).forEach((off) => off());
    }
}
