import { Component, type VNode } from "preact";
import type { Project } from "../../core/types.js";

export interface ProjectCardProps {
    readonly project: Project;
    readonly hidden: boolean;
}

/**
 * Pure card renderer. JSX escapes every interpolated value, so project copy can
 * no longer reach the DOM as markup, and `shouldComponentUpdate` keeps filtering
 * from re-rendering cards whose visibility did not change.
 */
export class ProjectCard extends Component<ProjectCardProps> {
    override shouldComponentUpdate(next: ProjectCardProps): boolean {
        return next.project !== this.props.project || next.hidden !== this.props.hidden;
    }

    override render({ project, hidden }: ProjectCardProps): VNode {
        const displayNumber = String(project.number).padStart(2, "0");
        const titleId = `project-title-${displayNumber}`;
        const linkAttributes = project.openInNewTab
            ? { target: "_blank", rel: "noopener noreferrer" }
            : { target: "_self" };

        return (
            <article
                class={`project-card${project.main ? " project-card-large" : ""}${hidden ? " is-hidden" : ""}`}
                data-category={project.category}
                data-reveal
            >
                <div class="project-preview">
                    <div class="project-number" aria-hidden="true">
                        {displayNumber}
                    </div>
                    <div class="project-preview-content">
                        <span>{project.preview[0]}</span>
                        <strong>{project.preview[1]}</strong>
                    </div>
                </div>

                <div class="project-content">
                    <div>
                        <p class="project-type">{project.type}</p>
                        <h3 id={titleId}>{project.heading}</h3>
                        <p>{project.description}</p>
                    </div>

                    <div class="project-footer">
                        <div class="project-tags" role="list" aria-label="Project technologies">
                            {project.tags.map((tag) => (
                                <span key={tag}>{tag}</span>
                            ))}
                        </div>

                        <a
                            class="project-link"
                            href={encodeURI(project.link)}
                            title={`Explore ${project.heading}`}
                            aria-describedby={titleId}
                            {...linkAttributes}
                            {...(project.preFetch ? {} : { prefetch: "false" })}
                        >
                            View{" "}
                            <span class="link-arrow" aria-hidden="true">
                                ↗
                            </span>
                        </a>
                    </div>
                </div>
            </article>
        );
    }
}

export default ProjectCard;
