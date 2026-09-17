import type React from 'react';
import { useEffect, useRef, useState } from 'react';

const PORTFOLIO_VERSION_HASH = 'v4.1_new_sections_|_style_imporvements';
const VISIBLE_DURATION_MS = 6500;
const FADE_DURATION_MS = 400;

export default function UpdateNotification(): React.JSX.Element | null {
    const [shouldRender, setShouldRender] = useState(false);
    const toastRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let mounted = true;
        let showFrame = 0;
        let dismissTimer = 0;
        let fadeAnimation: Animation | null = null;

        try {
            if (localStorage.getItem('portfolio_version_key') !== PORTFOLIO_VERSION_HASH) {
                showFrame = requestAnimationFrame(() => {
                    if (!mounted) return;
                    setShouldRender(true);

                    dismissTimer = window.setTimeout(() => {
                        const toast = toastRef.current;
                        if (!toast) {
                            setShouldRender(false);
                            return;
                        }

                        fadeAnimation = toast.animate(
                            [
                                { opacity: 1, transform: 'translate3d(-50%, 0, 0)' },
                                { opacity: 0, transform: 'translate3d(-50%, -16px, 0)' },
                            ],
                            { duration: FADE_DURATION_MS, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
                        );

                        fadeAnimation.onfinish = () => {
                            try {
                                localStorage.setItem('portfolio_version_key', PORTFOLIO_VERSION_HASH);
                            } catch {
                                // Storage can be unavailable in privacy-restricted contexts.
                            }
                            if (mounted) setShouldRender(false);
                        };
                    }, VISIBLE_DURATION_MS);
                });
            }
        } catch (error) {
            console.warn('[Update notification unavailable]:', error);
        }

        return () => {
            mounted = false;
            if (showFrame) cancelAnimationFrame(showFrame);
            if (dismissTimer) window.clearTimeout(dismissTimer);
            fadeAnimation?.cancel();
        };
    }, []);

    if (!shouldRender) return null;

    return (
        <div ref={toastRef} className="update-toast-pill" role="status" aria-live="polite">
            <span className="update-toast-text">Updated</span>
            <span className="update-toast-tick" aria-hidden="true">✓</span>
        </div>
    );
}
