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
                        I'm a frontend developer who enjoys
                        understanding how things work and then
                        building them from the ground up.
                    </p>
                    <p>
                        My current focus is frontend development,
                        where I'm learning how to combine clean
                        interfaces with efficient JavaScript and
                        thoughtful user experiences.
                    </p>
                    <p>
                        I don't just want to make websites that
                        look good. I want to understand the
                        engineering and thoughts behind them.
                    </p>
                    <a className="text-link" href="#contact" >
                        Get in touch <span aria-hidden="true">→</span>
                    </a>
                </div>
            </div>
        </section>
    )
}