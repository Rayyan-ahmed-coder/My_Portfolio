/**
 * @file types.ts
 * @description Standard common domain type models and system layout specifications.
 * @version 1.0.4
 * @author Rayyan Khan
 */

export type ThemeName = "light" | "dark";
export type ScrollDirection = "up" | "down";

/** Validated schema template for portfolio application project entries. */
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

export type CommandCategory = "Navigation" | "Actions" | "Filters" | "Social" | "Accessibility" | "Tools" | "Other";

/** Command signature parameters for the control center registry matrix. */
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

/** Standard interface contract for lifecycle memory teardown hooks. */
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
