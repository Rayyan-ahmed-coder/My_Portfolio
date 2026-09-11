import React from "react";

export default function MainNavbar(): React.JSX.Element {
    const navItems = [
        { id: "home", label: "Home" },
        { id: "work", label: "Work" },
        { id: "features", label: "Features" },
        { id: "about", label: "About" },
        { id: "skills", label: "Skills" },
        { id: "contact", label: "Contact" }
    ];

    return (
        <nav className="navbar container" aria-label="Primary navigation">
            <a className="logo" href="#home" aria-label="Rayyan Khan home">
                <span className="logo-mark" aria-hidden="true">R</span>
                <span className="logo-text">Rayyan</span>
            </a>
            
            <div className="nav-wrapper" id="navigation-menu" data-nav-container>
                <ul className="nav-list">
                    {navItems.map((item, index) => (
                        <li key={item.id}>
                            <a 
                                className={`nav-link ${index === 0 ? "active" : ""}`} 
                                href={`#${item.id}`} 
                                data-section={item.id}
                            >
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="nav-actions">
                <button
                    className="theme-toggle"
                    id="theme-toggle"
                    type="button"
                    aria-label="Toggle color theme"
                    aria-pressed="false"
                >
                    <span className="theme-icon" aria-hidden="true">◐</span>
                </button>

                <button
                    className="command-palette-toggle"
                    id="command-toggle"
                    type="button"
                    aria-label="Open command palette"
                    aria-haspopup="dialog"
                >
                    <span className="command-icon" aria-hidden="true">⌘</span>
                </button>

                <button
                    className="menu-toggle"
                    id="menu-toggle"
                    type="button"
                    aria-label="Open navigation menu"
                    aria-controls="navigation-menu"
                    aria-expanded="false"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </nav>
    );
}