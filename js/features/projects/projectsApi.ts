import { warn } from "../../core/logger.js";
import type { Project } from "../../core/types.js";

const SCOPE = "projects";
const MAX_ATTEMPTS = 2;

/** Served from public/, so the path stays stable and same-origin under the CSP. */
export const PROJECTS_URL = `${import.meta.env.BASE_URL}data/projects.json`;

export type ProjectLoader = (signal: AbortSignal) => Promise<readonly Project[]>;

export const isAbortError = (error: unknown): boolean =>
    error instanceof Error && error.name === "AbortError";

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
        tags: Array.isArray(record.tags)
            ? record.tags.filter((tag): tag is string => typeof tag === "string")
            : [],
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

const requestProjects = async (signal: AbortSignal): Promise<Project[]> => {
    const response = await fetch(PROJECTS_URL, {
        cache: "force-cache",
        signal,
        headers: { Accept: "application/json" },
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} while loading projects`);
    }

    return parseProjects((await response.json()) as unknown);
};

/** Fetches the manifest, retrying once on transient network failures. */
export const fetchProjects: ProjectLoader = async (signal) => {
    for (let attempt = 1; ; attempt += 1) {
        try {
            return await requestProjects(signal);
        } catch (error) {
            if (isAbortError(error) || attempt >= MAX_ATTEMPTS) throw error;
            warn(SCOPE, `Project load attempt ${attempt} failed; retrying`, error);
        }
    }
};

export const matchesFilter = (project: Project, filter: string): boolean =>
    filter === "all" || project.category.includes(filter);
