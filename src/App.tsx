import React from 'react';
import UpdateNotification from './components/UpdateNotification';
import MainNavbar from './components/MainNavbar'
import HeroSection from './components/Hero'
import WorkSection from './components/Work'
import AboutSection from "./components/About";
import FeaturesSection from './components/Features';
import TechnologiesSection from "./components/Technologies";
import ContactSection from './components/Contact';
import SiteFooter from './components/Footer';
import ImpactStrip from './components/ImpactStrip';

export default function App(): React.JSX.Element {
    return (
        <>
            <UpdateNotification/>
            <header className="site-header" id="site-header">
                <MainNavbar/>
            </header>
            <a className="skip-link" href="#main-content">Skip to content</a>
            <main id="main-content">
                <HeroSection/>
                <ImpactStrip/>
                <WorkSection/>
                <FeaturesSection/>
                <AboutSection/>
                <TechnologiesSection/>
                <ContactSection/>
            </main>
            <SiteFooter/>
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
                aria-label="Scroll to top"
            >
                ↑
            </button>
        </>
    );
}