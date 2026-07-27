export const $ = (selector, parent = document) => 
    parent.querySelector(selector);

export const $$ = (selector, parent = document) => 
    [...parent.querySelectorAll(selector)];

export const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), max);

export const isMobile = () => window.innerWidth <= 850;

export const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const nextFrame = () => 
    new Promise(requestAnimationFrame);

export const rafThrottle = callback => {
    let ticking = false;
    return () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            callback(); 
            ticking = false;
        });
    };
};

export const debounce = (callback, delay = 150) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            callback(...args);
        }, delay);
    };
};