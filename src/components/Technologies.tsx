import type React from 'react';
import technologiesData from '../data/technologies.json';

interface TechnologyItem {
    readonly name: string;
    readonly mark: string;
    readonly description: string;
}

function TechnologiesList(): React.JSX.Element {
    return (
        <div className="skills-list" aria-label="Technologies and Skills">
            {(technologiesData as readonly TechnologyItem[]).map((technology, index) => {
                const { name = "Tech Skill", mark = "✔", description } = technology;
                const displayIndex = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

                return (
                    <article className="skill-card" data-reveal key={name}>
                        <div className="skill-card-top">
                            <span className="skill-index">{displayIndex}</span>
                            <h3 className="skill-mark" aria-hidden="true">{mark}</h3>
                        </div>
                        
                        <div className="skill-card-content">
                            <h2>{name}</h2>
                            <p className="skill-description">{description}</p>
                        </div>
                        
                        <span className="skill-arrow" aria-hidden="true">↗</span>
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
                        <p className="eyebrow">TOOLKIT</p>
                        <h2 id="skills-title">Technologies I use.</h2>
                    </div>
                </div>
                <TechnologiesList/>
            </div>
        </section>
    )
}