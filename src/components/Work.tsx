import React from "react";

export default function WorkSection() {
    return (
        <section className="work section" id="work" aria-labelledby="work-title">
            <div className="container">
                <div className="section-heading">
                    <div>
                        <p className="eyebrow">SELECTED WORK</p>
                        <h2 id="work-title">Things I've built.</h2>
                    </div>
                    <p className="section-description">
                        A selection of projects where I experiment,
                        learn and turn ideas into working experiences.
                    </p>
                </div>

                <div className="project-filters" role="group" aria-label="Filter projects">
                    <button className="filter-button active" type="button" data-filter="all">
                        All
                    </button>
                    <button className="filter-button" type="button" data-filter="web">
                        Web
                    </button>
                    <button className="filter-button" type="button" data-filter="javascript">
                        JavaScript
                    </button>
                    <button className="filter-button" type="button" data-filter="game">
                        Games
                    </button>
                </div>
                
                <div className="project-grid" id="projects-grid"></div>
            </div>
        </section>
    )
}