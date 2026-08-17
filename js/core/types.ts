/** Shared domain types for the portfolio runtime. */

export type ThemeName = "light" | "dark";

export type ScrollDirection = "up" | "down";

/** Shape of a single entry in js/JSON/projects.json after validation. */
export interface Project {
    main: boolean;
    number: number;
    preview: readonly [string, string];
    type: string;
    heading: string;
    description: string;
    category: string;
    tags: readonly string[];
    link: string;
    openInNewTab: boolean;
    preFetch: boolean;
}

export type CommandCategory =
    | "Navigation"
    | "Actions"
    | "Filters"
    | "Social"
    | "Accessibility"
    | "Tools"
    | "Other";

export interface Command {
    readonly title: string;
    readonly subtitle: string;
    readonly category: CommandCategory;
    readonly shortcut?: string;
    readonly action: () => void | Promise<unknown>;
}

export interface AnalyticsStat {
    readonly value: number | string;
    readonly label: string;
}

export type AnalyticsKey =
    | "commands"
    | "projects"
    | "categories"
    | "techTags"
    | "sections"
    | "skills"
    | "filters"
    | "features"
    | "commandGroups"
    | "actions"
    | "topTag"
    | "theme";

export type AnalyticsData = Record<AnalyticsKey, AnalyticsStat>;

/** Every long-lived module exposes a teardown hook so listeners never leak. */
export interface Disposable {
    destroy(): void;
}

export interface ContentLoadedDetail {
    count: number;
}

declare global {
    interface DocumentEventMap {
        "content:loaded": CustomEvent<ContentLoadedDetail>;
    }
}
