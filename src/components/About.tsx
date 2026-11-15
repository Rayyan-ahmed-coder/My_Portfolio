import React from "react";
import { ArrowDownRight, Compass, Gauge, Sparkles } from "lucide-react";

export default function AboutSection(): React.JSX.Element {
  return (
    <section className="about section" id="about" aria-labelledby="about-title">
      <div className="container">
        <div className="about-container">
          <header className="about-heading" data-reveal>
            <p className="eyebrow">A LITTLE ABOUT ME</p>
            <h2 id="about-title">
              Curious by nature.
              <span className="about-heading-accent">Thoughtful by design.</span>
            </h2>
            <p className="about-heading-note">Frontend developer · maker of useful things for the web</p>
          </header>

          <div className="about-content" data-reveal>
            <div className="about-story">
              <span className="about-story-index">01 — THE WHY</span>
              <p className="about-lead">
                I like the moment an idea becomes something you can click, explore and make your own.
              </p>
              <p>
                I build responsive interfaces with React, TypeScript and modern CSS, bringing clarity to each screen and
                care to the details behind it.
              </p>
              <p>
                I{`\u2019`}m always learning, testing ideas and finding ways to make the next experience a little more
                useful, accessible and enjoyable.
              </p>
            </div>

            <div className="about-principles" aria-label="What guides my work">
              <article className="about-principle">
                <span className="about-principle-icon">
                  <Compass size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3>Start with purpose</h3>
                  <p>Understand the people and problem before adding pixels.</p>
                </div>
                <span className="about-principle-number">01</span>
              </article>
              <article className="about-principle">
                <span className="about-principle-icon">
                  <Gauge size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3>Make it feel effortless</h3>
                  <p>Keep the experience clear, quick and comfortable to use.</p>
                </div>
                <span className="about-principle-number">02</span>
              </article>
              <article className="about-principle">
                <span className="about-principle-icon">
                  <Sparkles size={18} aria-hidden="true" />
                </span>
                <div>
                  <h3>Care about the details</h3>
                  <p>Thoughtful feedback and small touches make a product feel complete.</p>
                </div>
                <span className="about-principle-number">03</span>
              </article>
            </div>

            <a className="about-cta" href="#contact">
              <span>
                <strong>Have something in mind?</strong>
                <small>Let{`\u2019`}s make it real.</small>
              </span>
              <ArrowDownRight size={20} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
