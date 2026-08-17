export const $ = (selector, parent = document) => 
    parent.querySelector(selector);

export const $$ = (selector, parent = document) => 
    parent.querySelectorAll(selector);

export const clamp = (value, min, max) => 
    value < min ? min : (value > max ? max : value); // Math.min/max logic inline avoids engine overhead

// Performance: Cache the matchMedia references so the browser doesn't re-parse media strings on every call
const mobileQuery = window.matchMedia("(max-width: 850px)");
export const isMobile = () => mobileQuery.matches;

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
export const prefersReducedMotion = () => motionQuery.matches;

export const nextFrame = () => 
    new Promise((resolve) => requestAnimationFrame(resolve));

export const rafThrottle = (callback) => {
    let ticking = false;
    return function (...args) {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            callback.apply(this, args); // FIXED: Preserves execution 'this' context and passes arguments safely
            ticking = false;
        });
    };
};

export const debounce = (callback, delay = 150) => {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            callback.apply(this, args); // FIXED: Preserves context variables across asynchronous timeouts
        }, delay);
    };
};