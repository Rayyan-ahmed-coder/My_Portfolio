import type React from "react";
import projectsData from "../data/projects.json";

const PROJECT_COUNT = projectsData.length;
const CATEGORY_KEYS = ["web", "javascript", "game"] as const;
const CATEGORY_LABELS = {
  web: "Web experiences",
  javascript: "JavaScript",
  game: "Games",
} as const;

const CATEGORIES = CATEGORY_KEYS.map((category) => ({
  category,
  label: CATEGORY_LABELS[category],
  count: projectsData.filter((project) => project.category.split(/\s+/).includes(category)).length,
}));

const TAG_COUNTS = projectsData
  .flatMap((project) => project.tags)
  .reduce<Map<string, number>>((counts, tag) => {
    counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return counts;
  }, new Map());

const TECHNOLOGIES = [...TAG_COUNTS.entries()]
  .map(([name, count]) => ({ name, count }))
  .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));

const STACK_MENTIONS = TECHNOLOGIES.reduce((total, technology) => total + technology.count, 0);
const FEATURED_PROJECTS = projectsData.filter((project) => project.main).length;
const MAX_CATEGORY_COUNT = Math.max(1, ...CATEGORIES.map((category) => category.count));
const MAX_TECHNOLOGY_COUNT = Math.max(1, ...TECHNOLOGIES.map((technology) => technology.count));

export default function AnalyticsSection(): React.JSX.Element {
  return (
    <section className="analytics section" id="analytics" aria-labelledby="analytics-title">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE NUMBERS, HONESTLY</p>
            <h2 id="analytics-title">A snapshot of what I build.</h2>
          </div>
          <p className="section-description">
            A data-driven breakdown of the projects in this portfolio—calculated directly from their categories and tech
            tags, not made-up performance scores.
          </p>
        </div>

        <div className="analytics-metrics" aria-label="Portfolio project metrics">
          <article className="analytics-metric" data-reveal>
            <span>PROJECTS</span>
            <strong>{String(PROJECT_COUNT).padStart(2, "0")}</strong>
            <small>in the portfolio</small>
          </article>
          <article className="analytics-metric" data-reveal>
            <span>STACK MENTIONS</span>
            <strong>{String(STACK_MENTIONS).padStart(2, "0")}</strong>
            <small>across all projects</small>
          </article>
          <article className="analytics-metric" data-reveal>
            <span>UNIQUE TOOLS</span>
            <strong>{String(TECHNOLOGIES.length).padStart(2, "0")}</strong>
            <small>listed in project tags</small>
          </article>
          <article className="analytics-metric analytics-metric-accent" data-reveal>
            <span>FEATURED</span>
            <strong>{String(FEATURED_PROJECTS).padStart(2, "0")}</strong>
            <small>highlighted build{FEATURED_PROJECTS === 1 ? "" : "s"}</small>
          </article>
        </div>

        <div className="analytics-panels">
          <section className="analytics-panel" aria-labelledby="analytics-categories-title">
            <div className="analytics-panel-heading">
              <div>
                <span className="analytics-overline">01 / PROJECT MIX</span>
                <h3 id="analytics-categories-title">What I make</h3>
              </div>
              <span className="analytics-panel-count">{PROJECT_COUNT} builds</span>
            </div>
            <ul className="analytics-bars">
              {CATEGORIES.map(({ category, label, count }) => (
                <li className="analytics-bar-row" data-reveal="slide-in-right" key={category}>
                  <div className="analytics-bar-label">
                    <span>{label}</span>
                    <strong>
                      {count} <span>project{count === 1 ? "" : "s"}</span>
                    </strong>
                  </div>
                  <div
                    className="analytics-bar-track"
                    role="img"
                    aria-label={`${label}: ${count} of ${PROJECT_COUNT} projects`}
                  >
                    <span style={{ width: `${(count / MAX_CATEGORY_COUNT) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
            <p className="analytics-note">Projects may appear in more than one category.</p>
          </section>

          <section className="analytics-panel analytics-stack-panel" aria-labelledby="analytics-stack-title">
            <div className="analytics-panel-heading">
              <div>
                <span className="analytics-overline">02 / TOOLKIT</span>
                <h3 id="analytics-stack-title">What{`\u2019`}s in the stack</h3>
              </div>
              <span className="analytics-panel-count">{TECHNOLOGIES.length} tags</span>
            </div>
            <ul className="analytics-tech-list">
              {TECHNOLOGIES.slice(0, 5).map(({ name, count }, index) => (
                <li className="analytics-tech-row" data-reveal="slide-in-right" key={name}>
                  <span className="analytics-tech-rank">{String(index + 1).padStart(2, "0")}</span>
                  <span className="analytics-tech-name">{name}</span>
                  <span className="analytics-tech-meter" aria-hidden="true">
                    <span style={{ width: `${(count / MAX_TECHNOLOGY_COUNT) * 100}%` }} />
                  </span>
                  <strong aria-label={`${count} project${count === 1 ? "" : "s"}`}>{count}</strong>
                </li>
              ))}
            </ul>
            <p className="analytics-note">Ranked by how often each tag appears in a project.</p>
          </section>
        </div>
      </div>
    </section>
  );
}
