import { ArrowUpRight, Check, CodeXml, Compass, Rocket } from "lucide-react";
import { useRef, useState } from "react";

const phases = [
  {
    icon: Compass,
    number: "01",
    label: "Discover",
    title: "Start with the right questions.",
    text: "I turn a rough idea into a clear direction by understanding the audience, the problem and what success should feel like.",
    deliverables: [
      "Goals and constraints",
      "Content direction",
      "A focused first milestone",
    ],
  },
  {
    icon: CodeXml,
    number: "02",
    label: "Build",
    title: "Make the experience feel inevitable.",
    text: "I build responsive interfaces in small, testable steps, keeping performance and accessibility in the room from the beginning.",
    deliverables: [
      "Responsive UI system",
      "Accessible interactions",
      "Performance-minded code",
    ],
  },
  {
    icon: Rocket,
    number: "03",
    label: "Launch",
    title: "Ship, learn and make it sharper.",
    text: "A launch is a beginning, not a finish line. I leave behind a polished product and a practical path for its next iteration.",
    deliverables: [
      "Launch-ready details",
      "Useful handoff",
      "Next-step opportunities",
    ],
  },
] as const;

export default function BuildApproach(): React.JSX.Element {
  const [activePhase, setActivePhase] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const phase = phases[activePhase] ?? phases[0];
  const Icon = phase.icon;

  const handleTabChange = (index: number) => {
    setActivePhase(index);
    tabRefs.current[index]?.focus();
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const totalPhases = phases.length;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      handleTabChange((index + 1) % totalPhases);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      handleTabChange((index - 1 + totalPhases) % totalPhases);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      handleTabChange(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      handleTabChange(totalPhases - 1);
    }
  };

  return (
    <section
      className="approach section"
      id="approach"
      aria-labelledby="approach-title"
    >
      <div className="container">
        <div className="section-heading approach-heading">
          <header>
            <p className="eyebrow">HOW I WORK</p>
            <h2 id="approach-title">
              From first thought to
              <span className="accent-text">real thing.</span>
            </h2>
          </header>
          <p className="section-description">
            A simple, collaborative process that keeps the big picture visible
            while the details get better.
          </p>
        </div>

        <div className="approach-layout">
          <ol
            className="approach-tabs"
            role="tablist"
            aria-label="Project phases"
          >
            {phases.map(({ icon: TabIcon, number, label }, index) => {
              const isActive = activePhase === index;

              return (
                <li>
                  <button
                    ref={(element) => {
                      tabRefs.current[index] = element;
                    }}
                    key={label}
                    id={`approach-tab-${number}`}
                    className={`approach-tab${isActive ? " active" : ""}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`approach-panel-${number}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => handleTabChange(index)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                  >
                    <TabIcon size={18} aria-hidden="true" />
                    <span>
                      <b>{number}</b>
                      {label}
                    </span>
                    <ArrowUpRight
                      className="approach-tab-arrow"
                      size={16}
                      aria-hidden="true"
                    />
                  </button>
                </li>
              );
            })}
          </ol>

          <div
            className="approach-panel"
            id={`approach-panel-${phase.number}`}
            role="tabpanel"
            aria-live="polite"
            aria-labelledby={`approach-tab-${phase.number}`}
          >
            <div className="approach-panel-top">
              <span className="approach-panel-icon">
                <Icon size={28} aria-hidden="true" />
              </span>
              <span className="approach-progress">{phase.number} / 03</span>
            </div>
            <h3>{phase.title}</h3>
            <p>{phase.text}</p>
            <ul>
              {phase.deliverables.map((deliverable) => (
                <li key={deliverable}>
                  <Check size={15} aria-hidden="true" />
                  {deliverable}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
