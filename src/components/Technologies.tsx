import type React from 'react';
import technologiesData from '../data/technologies.json';

interface TechnologyItem {
    name: string;
    mark: string;
    description: string;
}

function TechnologiesList(): React.JSX.Element {
    return (
        <div className="skills-list" aria-label="Technologies and Skills">
            {(technologiesData as TechnologyItem[]).map((technology, index) => {
                const { name = "Tech Skill", mark = "✔", description } = technology;
                const displayIndex = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`;

                return (
                    <article 
                        className="skill-row" 
                        data-reveal 
                        key={name}
                    >
                        <div className="skill-card-top">
                            <span className="skill-index">{displayIndex}</span>
                            <span className="skill-mark" aria-hidden="true">{mark}</span>
                        </div>
                        
                        <div className="skill-card-content">
                            <h3>{name}</h3>
                            <span className="skill-description">{description}</span>
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