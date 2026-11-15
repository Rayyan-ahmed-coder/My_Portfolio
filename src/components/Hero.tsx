import React from "react";
import AvailabilityCard from "./AvailabilityCard";
import projectsData from "../data/projects.json";
import technologiesData from "../data/technologies.json";

const STATS = [
  { value: String(projectsData.length).padStart(2, "0"), label: "Projects" },
  { value: String(technologiesData.length).padStart(2, "0"), label: "Technologies" },
  { value: "∞", label: "Curiosity" },
] as const;

export default function HeroSection(): React.JSX.Element {
  return (
    <section className="hero section" id="home" aria-labelledby="hero-title">
      <div className="hero-background" aria-hidden="true">
        <div className="hero-grid"></div>
        <div className="hero-glow hero-glow-one"></div>
        <div className="hero-glow hero-glow-two"></div>
      </div>

      <div className="container hero-container">
        <div className="hero-content">
          <p className="eyebrow">FRONTEND DEVELOPER</p>
          <h1 className="hero-title" id="hero-title">
            I build <span className="accent-text hero-accent-text">digital experiences</span> that feel effortless.
          </h1>
          <p className="hero-description">
            I'm Rayyan Ahmed. I turn ideas into responsive, accessible interfaces with React, TypeScript and thoughtful
            interaction design.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#work">
              View my work <span aria-hidden="true">→</span>
            </a>
            <a className="button button-secondary" href="#contact">
              Let's talk
            </a>
          </div>

          <div className="hero-stats">
            {STATS.map(({ value, label }) => (
              <div className="stat" key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-card" aria-hidden="true">
            <div className="hero-card-top">
              <span />
              <span />
              <span />
            </div>
            <h2 className="hero-letter">R</h2>
            <ul className="hero-card-bottom">
              <li>React</li>
              <li>CSS</li>
              <li>TS</li>
            </ul>
          </div>
          <AvailabilityCard />
        </div>
      </div>

      <a className="scroll-indicator" href="#work" aria-label="Scroll to projects">
        <span>Scroll</span>
        <span className="scroll-line" aria-hidden="true" />
      </a>
    </section>
  );
}
