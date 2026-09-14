import React from 'react'

export default function SiteFooter(): React.JSX.Element {
    return (
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
                    <p><span aria-hidden="true">©</span> <span id="made-year" aria-label='when was made'>Made in: 2025 July 14th</span> | Rayyan Khan.</p>
                    <a href="#home">Back to top ↑</a>
                </div>
            </div>
        </footer>
    )
}