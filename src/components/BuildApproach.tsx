import React, { useRef, useState } from "react";
import { ArrowUpRight, Check, CodeXml, Compass, Rocket } from "lucide-react";

const PHASES = [
  {
    icon: Compass,
    number: "01",
    label: "Discover",
    summary: "Find the signal in the idea.",
    title: "Start with the right questions.",
    text: "I turn a rough idea into a clear direction by understanding the audience, the problem and what success should feel like.",
    deliverables: ["Goals and constraints", "Content direction", "A focused first milestone"],
  },
  {
    icon: CodeXml,
    number: "02",
    label: "Build",
    summary: "Turn direction into a product.",
    title: "Make the experience feel inevitable.",
    text: "I build responsive interfaces in small, testable steps, keeping performance and accessibility in the room from the beginning.",
    deliverables: ["Responsive UI system", "Accessible interactions", "Performance-minded code"],
  },
  {
    icon: Rocket,
    number: "03",
    label: "Launch",
    summary: "Ship it, then make it sharper.",
    title: "Ship, learn and make it sharper.",
    text: "A launch is a beginning, not a finish line. I leave behind a polished product and a practical path for its next iteration.",
    deliverables: ["Launch-ready details", "Useful handoff", "Next-step opportunities"],
  },
] as const;

export default function BuildApproach(): React.JSX.Element {
  const [activePhase, setActivePhase] = useState<number>(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const currentPhase = PHASES[activePhase] ?? PHASES[0];
  const CurrentIcon = currentPhase.icon;

  const navigateTab = (nextIndex: number): void => {
    setActivePhase(nextIndex);
    tabRefs.current[nextIndex]?.focus();
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number): void => {
    const total = PHASES.length;
    let nextTarget: number;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextTarget = (index + 1) % total;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextTarget = (index - 1 + total) % total;
        break;
      case "Home":
        nextTarget = 0;
        break;
      case "End":
        nextTarget = total - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    navigateTab(nextTarget);
  };

  return (
    <section className="approach section" id="approach" aria-labelledby="approach-title">
      <div className="container">
        <div className="section-heading approach-heading">
          <header>
            <p className="eyebrow">HOW I WORK</p>
            <h2 id="approach-title">
              From first thought to <span className="accent-text">real thing.</span>
            </h2>
          </header>
          <p className="section-description">
            A simple, collaborative process that keeps the big picture visible while the details get better.
          </p>
        </div>

        <div className="approach-layout">
          <div
            className="approach-tabs"
            role="tablist"
            aria-orientation="vertical"
            aria-label="Project development phases"
          >
            {PHASES.map(({ icon: TabIcon, number, label, summary }, index) => {
              const isActive = activePhase === index;

              return (
                <button
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  key={label}
                  id={`approach-tab-${number}`}
                  className={`approach-tab${isActive ? " active" : ""}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls="approach-panel"
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => navigateTab(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  <TabIcon size={18} aria-hidden="true" fill="none" />
                  <span className="approach-tab-copy">
                    <b>{number}</b>
                    <strong>{label}</strong>
                    <small>{summary}</small>
                  </span>
                  <ArrowUpRight className="approach-tab-arrow" size={16} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <div
            key={currentPhase.number}
            className="approach-panel"
            id="approach-panel"
            role="tabpanel"
            aria-labelledby={`approach-tab-${currentPhase.number}`}
            aria-live="polite"
          >
            <div className="approach-panel-top">
              <span className="approach-panel-icon" aria-hidden="true">
                <CurrentIcon size={26} />
              </span>
              <div className="approach-panel-phase">
                <span>PHASE {currentPhase.number}</span>
                <strong>{currentPhase.label}</strong>
              </div>
              <span className="approach-progress">
                {currentPhase.number}
                <span> / 03</span>
              </span>
            </div>
            <div className="approach-progress-track" aria-hidden="true">
              <span style={{ width: `${((activePhase + 1) / PHASES.length) * 100}%` }} />
            </div>
            <h3>{currentPhase.title}</h3>
            <p>{currentPhase.text}</p>
            <ul>
              {currentPhase.deliverables.map((deliverable) => (
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
