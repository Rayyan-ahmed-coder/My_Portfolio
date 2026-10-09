import React from "react";

export default function AboutSection(): React.JSX.Element {
    return (
        <section className="about section" id="about" aria-labelledby="about-title">
            <div className="container about-container">
                <div className="about-heading">
                    <p className="eyebrow">ABOUT ME</p>
                    <h2 id="about-title">
                        I enjoy turning <span className="accent-text">ideas</span> into reality.
                    </h2>
                </div>

                <div className="about-content">
                    <p className="about-lead">
                        I build responsive, interactive web experiences with React, TypeScript and modern CSS.
                    </p>
                    <p>
                        I care about the details that make a site feel right: clear layouts, useful feedback and
                        performance that keeps everything feeling quick.
                    </p>
                    <p>
                        This portfolio is where I turn those interests into projects, experiment with new ideas and
                        share what I'm learning along the way.
                    </p>
                    <a className="text-link" href="#contact" >
                        Get in touch <span aria-hidden="true">→</span>
                    </a>
                </div>
            </div>
        </section>
    )
}