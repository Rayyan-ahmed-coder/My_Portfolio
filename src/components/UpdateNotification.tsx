import type React from 'react';
import { useState, useEffect, useRef } from 'react';

/* 🚀 TARGET CONFIG: Change this value to instantly trigger the toast for users */
const PORTFOLIO_VERSION_HASH = 'v3.2_max_production';
const VISIBLE_DURATION_MS = 6500;

export default function UpdateNotification(): React.JSX.Element | null {
    const [shouldRender, setShouldRender] = useState<boolean>(false);
    const toastRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let isMounted = true;
        try {
            const cachedVersion = localStorage.getItem('portfolio_version_key');

            if (cachedVersion !== PORTFOLIO_VERSION_HASH) {
                requestAnimationFrame(() => {
                    if (!isMounted) return;
                    setShouldRender(true);

                    const dismissTimeout = setTimeout(() => {
                        if (!toastRef.current) {
                            setShouldRender(false);
                            return;
                        }

                        /* 🚀 HARDWARE COMPOSITOR FADE: Triggers a native animation layer directly on the GPU */
                        const fadeAnimation = toastRef.current.animate(
                            [
                                { opacity: 1, transform: 'translate3d(-50%, 0, 0)' },
                                { opacity: 0, transform: 'translate3d(-50%, -16px, 0)' }
                            ],
                            { duration: 400, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' }
                        );

                        fadeAnimation.onfinish = () => {
                            try {
                                localStorage.setItem('portfolio_version_key', PORTFOLIO_VERSION_HASH);
                            } catch { /* Suppress storage write constraints */ }
                            
                            if (isMounted) setShouldRender(false);
                        };
                    }, VISIBLE_DURATION_MS);

                    return () => clearTimeout(dismissTimeout);
                });
            }
        } catch (storageError) {
            console.warn('[Update Engine Sync Restricted]:', storageError);
        }

        return () => {
            isMounted = false;
        };
    }, []);

    if (!shouldRender) return null;

    return (
        <div 
            ref={toastRef}
            className="update-toast-pill" 
            role="status" 
            aria-live="polite"
        >
            <span className="update-toast-text">Updated</span>
            <span className="update-toast-tick" aria-hidden="true">✓</span>
        </div>
    );
}