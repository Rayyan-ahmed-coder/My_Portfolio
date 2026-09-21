import React, { useState } from "react";
import type { Project } from "../core/types.js";
import projectsData from "../data/projects.json";

const FILTERS = ["all", "web", "javascript", "game"] as const;
type FilterValue = (typeof FILTERS)[number];
const LABELS: Record<FilterValue, string> = { all: "All", web: "Web", javascript: "JavaScript", game: "Games" };

const asString = (value: unknown, fallback: string): string =>
    typeof value === "string" && value.trim() !== "" ? value : fallback;

const parseProjects = (payload: unknown): Project[] => {
    if (!Array.isArray(payload)) return [];

    const projects: Project[] = [];
    for (const [index, raw] of payload.entries()) {
        if (typeof raw !== "object" || raw === null) continue;

        const record = raw as Record<string, unknown>;
        const content = (record.content ?? {}) as Record<string, unknown>;
        const preview = Array.isArray(record.preview) ? record.preview : [];
        const number = Number.parseInt(String(record.number ?? ""), 10);
        const target = asString(record.target, "_blank").toLowerCase();

        projects.push({
            main: record.main === true,
            number: Number.isFinite(number) ? number : index + 1,
            preview: [asString(preview[0], "Not Defined"), asString(preview[1], "Not Defined")] as const,
            type: asString(record.type, "Type Value not set"),
            heading: asString(content.heading, "Untitled Project"),
            description: asString(content.description, "Description not set"),
            category: asString(record.category, "unknown").toLowerCase().trim(),
            tags: Array.isArray(record.tags) ? record.tags.filter((tag): tag is string => typeof tag === "string") : [],
            link: asString(record.link, "#"),
            openInNewTab: target.includes("blank"),
            preFetch: record.preFetch === true,
        });
    }

    return projects;
};

const PROJECTS = parseProjects(projectsData as unknown);
const FILTERED_PROJECTS: Record<FilterValue, Project[]> = {
    all: PROJECTS,
    web: PROJECTS.filter((project) => project.category.includes("web")),
    javascript: PROJECTS.filter((project) => project.category.includes("javascript")),
    game: PROJECTS.filter((project) => project.category.includes("game")),
};

export default function WorkSection(): React.JSX.Element {
    const [filter, setFilter] = useState<FilterValue>("all");
    const visibleProjects = FILTERED_PROJECTS[filter];

    return (
        <section className="work section" id="work" aria-labelledby="work-title">
            <div className="container">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">SELECTED WORK</p>
                        <h2 id="work-title">Things I've built.</h2>
                    </div>
                    <p className="section-description">
                        A selection of projects where I experiment, learn and turn ideas into working experiences.
                    </p>
                </div>

                <div className="project-filters" role="group" aria-label="Filter projects">
                    {FILTERS.map((option) => {
                        const active = filter === option;
                        return (
                            <button
                                key={option}
                                type="button"
                                className={active ? "filter-button active" : "filter-button"}
                                data-filter={option}
                                aria-pressed={active}
                                onClick={() => setFilter(option)}
                            >
                                {LABELS[option]}
                            </button>
                        );
                    })}
                </div>

                <div className="projects-grid" id="projects-grid">
                    {!visibleProjects.length && <p className="error-msg">No projects match this filter.</p>}
                    {visibleProjects.map((project) => {
                        const number = String(project.number).padStart(2, "0");
                        return (
                            <article key={project.number} className={project.main ? "project-card project-card-large" : "project-card"} data-category={project.category} data-reveal>
                                <div className="project-preview">
                                    <div className="project-number" aria-hidden="true">{number}</div>
                                    <div className="project-preview-content">
                                        <span>{project.preview[0]}</span>
                                        <strong>{project.preview[1]}</strong>
                                    </div>
                                </div>
                                <div className="project-content">
                                    <div>
                                        <p className="project-type">{project.type}</p>
                                        <h3 id={`project-title-${number}`}>{project.heading}</h3>
                                        <p>{project.description}</p>
                                    </div>
                                    <div className="project-footer">
                                        <div className="project-tags" role="list" aria-label="Project technologies">
                                            {project.tags.map((tag) => <span key={`${project.number}-${tag}`}>{tag}</span>)}
                                        </div>
                                        <a
                                            className="project-link"
                                            href={project.link}
                                            title={`Explore ${project.heading}`}
                                            target={project.openInNewTab ? "_blank" : "_self"}
                                            rel={project.openInNewTab ? "noopener noreferrer" : undefined}
                                            aria-describedby={`project-title-${number}`}
                                        >
                                            View <span className="link-arrow" aria-hidden="true">↗</span>
                                        </a>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}