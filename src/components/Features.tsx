import type React from "react";
import featuresData from "../data/Features.json";

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
  bullets: string[];
}

export default function FeaturesSection(): React.JSX.Element {
  return (
    <section className="features section" id="features" aria-labelledby="features-title">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">THE EXPERIENCE, BY DESIGN</p>
            <h2 id="features-title">Good work is more than good looks.</h2>
          </div>
          <p className="section-description">
            Four principles guide how I shape an interface—from its first impression to every detail in between.
          </p>
        </div>
        <div className="features-grid">
          {(featuresData as FeatureItem[]).map((feature, idx) => {
            const displayId = String(idx + 1).padStart(2, "0");
            const headerSlug = `feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`;
            return (
              <article key={headerSlug} className="feature-card" data-reveal aria-labelledby={headerSlug}>
                <div className="feature-card-heading">
                  <span className="feature-number">PRINCIPLE / {displayId}</span>
                  <div className="feature-icon" aria-hidden="true">
                    {feature.icon}
                  </div>
                </div>
                <div className="feature-card-copy">
                  <h3 id={headerSlug}>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
                <ul aria-label={`${feature.title} principles`}>
                  {feature.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
                <span className="feature-card-index" aria-hidden="true">
                  {displayId}
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
