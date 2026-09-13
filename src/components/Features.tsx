import type React from 'react';
import featuresData from '../data/Features.json';

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
                        <p className="eyebrow">WHY THIS PORTFOLIO</p>
                        <h2 id="features-title">Built with purpose.</h2>
                    </div>
                    <p className="section-description">
                        Every part of this site is designed around
                        performance, accessibility and a great
                        user experience.
                    </p>
                </div>
                <div className="features-grid">
                    {(featuresData as FeatureItem[]).map((feature, idx) => {
                        const displayId = String(idx + 1).padStart(2, '0');
                        const headerSlug = `feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`;
                        return (
                            <article 
                                key={headerSlug} 
                                className="feature-card" 
                                data-reveal
                                aria-labelledby={headerSlug}
                            >
                                <span className="feature-number" aria-hidden="true">{displayId}</span>
                                <div className="feature-icon" aria-hidden="true">{feature.icon}</div>
                                <h3 id={headerSlug}>{feature.title}</h3>
                                <p>{feature.description}</p>
                                <ul>
                                    {feature.bullets.map((bullet, bulletIdx) => (
                                        <li key={bulletIdx}>{bullet}</li>
                                    ))}
                                </ul>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}