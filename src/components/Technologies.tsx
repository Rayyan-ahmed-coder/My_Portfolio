import type React from "react";
import technologiesData from "../data/technologies.json";

interface TechnologyItem {
  readonly name: string;
  readonly mark: string;
  readonly description: string;
}

const CORE_TECHNOLOGIES = new Set(["HTML", "CSS", "JavaScript", "TypeScript", "React"]);
const FRONTEND_COUNT = (technologiesData as readonly TechnologyItem[]).filter((technology) =>
  CORE_TECHNOLOGIES.has(technology.name),
).length;

function TechnologiesList(): React.JSX.Element {
  return (
    <div className="skills-list" aria-label="Technologies and Skills">
      {(technologiesData as readonly TechnologyItem[]).map((technology, index) => {
        const { name = "Tech Skill", mark = "✔", description } = technology;
        const displayIndex = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;
        const group = CORE_TECHNOLOGIES.has(name) ? "Frontend" : "Workflow";
        return (
          <article className="skill-card" data-reveal key={name} data-skill-group={group.toLowerCase()}>
            <div className="skill-card-top">
              <span className="skill-index">{displayIndex}</span>
              <span className="skill-group">{group}</span>
              <h3 className="skill-mark" aria-hidden="true">
                {mark}
              </h3>
            </div>
            <div className="skill-card-content">
              <h3>{name}</h3>
              <p className="skill-description">{description}</p>
            </div>
            <span className="skill-card-footer">
              <span>IN THE TOOLKIT</span>
              <span className="skill-arrow" aria-hidden="true">
                ↗
              </span>
            </span>
          </article>
        );
      })}
    </div>
  );
}

export default function TechnologiesSection(): React.JSX.Element {
  return (
    <section className="skills section" id="skills" aria-labelledby="skills-title">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">TOOLS OF THE TRADE</p>
            <h2 id="skills-title">A toolkit for making things.</h2>
          </div>
          <p className="section-description">
            The technologies I use to shape interfaces, bring ideas to life and keep a project moving.
          </p>
        </div>
        <div className="skills-overview">
          <span>
            <span className="skills-overview-dot" aria-hidden="true" />A practical, growing toolkit
          </span>
          <span>
            <strong>{technologiesData.length}</strong> technologies
            <span className="skills-overview-separator" aria-hidden="true">
              /
            </span>
            <strong>{FRONTEND_COUNT}</strong> frontend foundations
          </span>
        </div>
        <TechnologiesList />
      </div>
    </section>
  );
}
