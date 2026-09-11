import React from "react";
import MainNavbar from './components/MainNavbar'
import HeroSection from './components/Hero'
import WorkSection from './components/Work'
import AboutSection from "./components/About";
import TechnologiesSection from "./components/Technologies";

export default function App(): React.JSX.Element {
    return (
        <>
            <header className="site-header" id="site-header">
                <MainNavbar/>
            </header>
            <a className="skip-link" href="#main-content">Skip to content</a>
            <main id="main-content">
                <HeroSection/>
                <WorkSection/>
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
                            <article className="feature-card" data-reveal>
                                <span className="feature-number">01</span>
                                <div className="feature-icon">⚡</div>
                                <h3>Performance</h3>
                                <p>
                                    Lightweight code, efficient rendering
                                    and a loading strategy designed to keep
                                    the experience fast.
                                </p>
                                <ul>
                                    <li>Minimal dependencies</li>
                                    <li>Deferred JavaScript</li>
                                    <li>Optimized assets</li>
                                </ul>
                            </article>

                            <article className="feature-card" data-reveal>
                                <span className="feature-number">02</span>
                                <div className="feature-icon">◇</div>
                                <h3>Responsive</h3>
                                <p>
                                    Carefully designed layouts that adapt
                                    smoothly across phones, tablets,
                                    laptops and large displays.
                                </p>
                                <ul>
                                    <li>Screen Adapting font sizes</li>
                                    <li>Flexible layouts</li>
                                    <li>Large-screen support</li>
                                </ul>
                            </article>

                            <article className="feature-card" data-reveal>
                                <span className="feature-number">03</span>
                                <div className="feature-icon">◎</div>
                                <h3>Accessible</h3>
                                <p>
                                    Built with semantic HTML, keyboard
                                    support and accessibility-conscious
                                    interactions.
                                </p>
                                <ul>
                                    <li>Semantic markup</li>
                                    <li>Keyboard friendly</li>
                                    <li>Reduced motion support</li>
                                </ul>
                            </article>


                            <article className="feature-card" data-reveal>
                                <span className="feature-number">04</span>
                                <div className="feature-icon">↗</div>
                                <h3>Modern</h3>
                                <p>
                                    A clean visual system combining subtle
                                    motion, strong typography and intentional
                                    spacing.
                                </p>
                                <ul>
                                    <li>Minimal interface</li>
                                    <li>Micro-interactions</li>
                                    <li>Consistent design system</li>
                                </ul>
                            </article>
                        </div>

                    </div>
                </section>
                <AboutSection/>
                <TechnologiesSection/>
                <section className="contact section" id="contact" aria-labelledby="contact-title">
                    <div className="container contact-container">

                        <div className="contact-heading">
                            <p className="eyebrow">CONTACT</p>
                            <h2 id="contact-title">
                                Have an idea? <br/> Let's build it.
                            </h2>
                        </div>

                        <div className="contact-content">
                            <p>
                                Whether it's a project, collaboration,
                                question or just a conversation about
                                development — I'd love to hear from you.
                            </p>

                            <a className="contact-email" href="mailto:rayyan.workhost@gmail.com">
                                rayyan.workhost@gmail.com
                            </a>

                            <div className="contact-links">
                                <a href="#" target="_blank" rel="noopener noreferrer">
                                    GitHub
                                    <span aria-hidden="true">↗</span>
                                </a>
                                <a href="#" target="_blank" rel="noopener noreferrer">
                                    LinkedIn
                                    <span aria-hidden="true">↗</span>
                                </a>
                            </div>
                        </div>

                    </div>
                </section>
            </main>

            <footer className="site-footer">
                <div className="container footer-container">
                    <div className="footer-brand">
                        <a className="logo" href="#home">
                            <span className="logo-mark">R</span>
                            <span className="logo-text">Rayyan</span>
                        </a>
                        <p>Building for the web.</p>
                    </div>

                    <div className="footer-right">
                        <p>© <span id="current-year">2025 July 14th</span> | Rayyan Khan.</p>
                        <a href="#home">Back to top ↑</a>
                    </div>
                </div>
            </footer>

            <div className="command-panel" id="command-panel" aria-hidden="true" role="dialog" aria-label="Command center">
                <div className="command-panel-shell">
                    <div className="command-panel-header">
                        <div>
                            <h2>Command Center</h2>
                            <p className="command-panel-subtitle">Instant access to pages, actions, filters, and system tools.</p>
                        </div>
                        <button className="command-close" id="command-close" type="button" aria-label="Close command center">×</button>
                    </div>
                    <div className="command-panel-search">
                        <label className="visually-hidden" htmlFor="command-input">Search commands</label>
                        <input id="command-input" type="search" placeholder="Type a command…" autoComplete="off" spellCheck="false" />
                    </div>
                    <div className="command-panel-meta" aria-hidden="true">
                        <span className="command-chip">Live system</span>
                        <span className="command-chip">Instant access</span>
                        <span className="command-chip">Ctrl + K</span>
                    </div>
                    <div className="command-panel-results-title">Commands</div>
                    <div className="command-panel-list" id="command-list" role="listbox" aria-label="Command results"></div>
                    <div className="command-panel-summary" id="command-summary" aria-label="Portfolio summary"></div>
                    <div className="command-panel-analytics" id="command-analytics" aria-label="Portfolio analytics"></div>
                    <p className="command-panel-footer">Shortcut: <kbd>Ctrl</kbd> + <kbd>K</kbd></p>
                </div>
            </div>

            <button
                className="scroll-top"
                id="scroll-top"
                type="button"
                aria-label="Scroll to top">
                ↑
            </button>
        </>
    );
}