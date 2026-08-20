import React from "react";

export default function MainNavbar(): React.JSX.Element {
    return (
        <nav className="navbar container" aria-label="Primary navigation">
            <a className="logo" href="#home" aria-label="Rayyan Khan home">
                <span className="logo-mark" aria-hidden="true">R</span>
                <span className="logo-text">Rayyan</span>
            </a>
            <div className="nav-wrapper" id="navigation-menu">
                <ul className="nav-list">
                    <li><a className="nav-link active" href="#home" data-section="home" >Home</a></li>
                    <li><a className="nav-link" href="#work" data-section="work">Work</a></li>
                    <li><a className="nav-link" href="#features" data-section="features">Features</a></li>
                    <li><a className="nav-link" href="#about" data-section="about">About</a></li>
                    <li><a className="nav-link" href="#skills" data-section="skills">Skills</a></li>
                    <li><a className="nav-link" href="#contact" data-section="contact">Contact</a></li>
                </ul>
            </div>
            <div className="nav-actions">
                <button
                    className="theme-toggle"
                    id="theme-toggle"
                    type="button"
                    aria-label="Toggle color theme"
                    aria-pressed="false">
                    <span className="theme-icon" aria-hidden="true">
                        ◐
                    </span>
                </button>

                <button
                    className="command-toggle"
                    id="command-toggle"
                    type="button"
                    aria-label="Open command palette"
                    aria-haspopup="dialog">
                    <span className="command-icon" aria-hidden="true">⌘</span>
                </button>

                <button
                    className="menu-toggle"
                    id="menu-toggle"
                    type="button"
                    aria-label="Open navigation menu"
                    aria-controls="navigation-menu"
                    aria-expanded="false">
                    <span />
                    <span />
                    <span />
                </button>
            </div>
        </nav>
    )
}