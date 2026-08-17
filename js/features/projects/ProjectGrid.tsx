import { Fragment, type VNode } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";
import { ProjectCard } from "./ProjectCard.tsx";
import { fetchProjects, isAbortError, matchesFilter, type ProjectLoader } from "./projectsApi.ts";
import { useProjectFilter } from "./useProjectFilter.ts";
import { reportError } from "../../core/logger.js";
import type { ContentLoadedDetail, Project } from "../../core/types.js";

const SCOPE = "projects";

type GridState =
    | { readonly status: "loading" }
    | { readonly status: "empty" }
    | { readonly status: "failed" }
    | { readonly status: "ready"; readonly projects: readonly Project[] };

export interface ProjectGridProps {
    /** Injectable so tests and future data sources can replace the transport. */
    readonly load?: ProjectLoader;
}

export const ProjectGrid = ({ load = fetchProjects }: ProjectGridProps): VNode | null => {
    const [state, setState] = useState<GridState>({ status: "loading" });
    const filter = useProjectFilter();

    useEffect(() => {
        const controller = new AbortController();

        load(controller.signal)
            .then((projects) => {
                if (controller.signal.aborted) return;
                setState(projects.length ? { status: "ready", projects } : { status: "empty" });
            })
            .catch((error: unknown) => {
                if (isAbortError(error) || controller.signal.aborted) return;
                reportError(SCOPE, "Failed to load projects", error);
                setState({ status: "failed" });
            });

        // Unmounting mid-flight cancels the request instead of setting dead state.
        return () => controller.abort();
    }, [load]);

    const projects = state.status === "ready" ? state.projects : null;

    useEffect(() => {
        if (!projects) return;
        document.dispatchEvent(
            new CustomEvent<ContentLoadedDetail>("content:loaded", {
                detail: { count: projects.length },
            })
        );
    }, [projects]);

    // Visibility is recomputed once per filter change, not once per card render.
    const cards = useMemo(
        () =>
            projects?.map((project) => (
                <ProjectCard
                    key={`${project.number}-${project.heading}`}
                    project={project}
                    hidden={!matchesFilter(project, filter)}
                />
            )) ?? null,
        [projects, filter]
    );

    switch (state.status) {
        case "loading":
            return null;
        case "empty":
            return <p class="error-msg">No Projects Found.</p>;
        case "failed":
            return <p class="error-msg">Failed to Load Projects.</p>;
        default:
            return <Fragment>{cards}</Fragment>;
    }
};

export default ProjectGrid;
