import React from "react";
import AvailabilityCard from "./AvailabilityCard";

export default function HeroSection(): React.JSX.Element {
    return (
        <section className="hero section" id="home" aria-labelledby="hero-title">
            <div className="hero-background" aria-hidden="true">
                <div className="hero-grid" />
                <div className="hero-glow hero-glow-one" />
                <div className="hero-glow hero-glow-two" />
            </div>

            <div className="container hero-container">
                <div className="hero-content">
                    <p className="eyebrow" data-reveal>FRONTEND DEVELOPER</p>
                    <h1 className="hero-title" id="hero-title" data-reveal>
                        Building <span className="accent-text hero-accent-text">digital experiences</span> that matter.
                    </h1>
                    <p className="hero-description" data-reveal>
                        I'm Rayyan Khan, a frontend developer focused 
                        on creating fast, responsive and thoughtfully 
                        designed experiences for the web.
                    </p>

                    <div className="hero-actions" data-reveal>
                        <a className="button button-primary" href="#work">
                            View my work <span aria-hidden="true">→</span>
                        </a>
                        <a className="button button-secondary" href="#contact">
                            Let's talk
                        </a>
                    </div>

                    <div className="hero-stats" data-reveal>
                        <div className="stat">
                            <strong>03+</strong>
                            <span>Projects</span>
                        </div>
                        <div className="stat">
                            <strong>04</strong>
                            <span>Core skills</span>
                        </div>
                        <div className="stat">
                            <strong>∞</strong>
                            <span>Curiosity</span>
                        </div>
                    </div>
                </div>

                <div className="hero-visual" data-reveal>
                    <div className="hero-card" aria-hidden="true">
                        <div className="hero-card-top">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <div className="hero-letter">R</div>
                        <div className="hero-card-bottom">
                            <span>React</span>
                            <span>CSS</span>
                            <span>TS</span>
                        </div>
                    </div>
                    <AvailabilityCard />
                </div>
            </div>

            <a className="scroll-indicator" href="#work" aria-label="Scroll to projects">
                <span>Scroll</span>
                <span className="scroll-line" aria-hidden="true"/>
            </a>
        </section>
    )
}