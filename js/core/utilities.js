import { CONFIG } from "./config.js";

export const $ = (selector, parent = document) => 
    parent.querySelector(selector);

export const $$ = (selector, parent = document) => 
    parent.querySelectorAll(selector);

export const clamp = (value, min, max) => 
    value < min ? min : (value > max ? max : value); // Math.min/max logic inline avoids engine overhead

// Performance: Cache the matchMedia references so the browser doesn't re-parse media strings on every call
const mobileQuery = window.matchMedia(`(max-width: ${CONFIG.MOBILE_BREAKPOINT}px)`);
export const isMobile = () => mobileQuery.matches;

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
export const prefersReducedMotion = () => motionQuery.matches;

export const darkSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
export const prefersDarkScheme = () => darkSchemeQuery.matches;

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

// Schedules low priority work, falling back to a timer where requestIdleCallback is unavailable
export const onIdle = (callback, timeoutFallback = 200) => 
    (window.requestIdleCallback || ((cb) => setTimeout(cb, timeoutFallback)))(callback);

// Skips redundant classList writes, which would otherwise invalidate layout styles on every call
export const toggleClass = (element, className, state) => {
    if (!element || element.classList.contains(className) === state) return false;
    element.classList.toggle(className, state);
    return true;
};

const HTML_ESCAPES = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
};

export const escapeHtml = (value) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value).replace(/[&<>'"]/g, (char) => HTML_ESCAPES[char]);
};

// Normalizes a CSS selector, Element, NodeList or Array into a flat Element array
export const resolveElements = (target) => {
    if (typeof target === 'string') return Array.from($$(target));
    if (target instanceof Element) return [target];
    if (target instanceof NodeList || Array.isArray(target)) {
        return Array.from(target).filter((el) => el instanceof Element);
    }
    return [];
};

export const createEl = (tag, className, html) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (html !== undefined) element.innerHTML = html;
    return element;
};

export const scrollToTop = () => 
    window.scrollTo({ top: 0, behavior: "smooth" });

// Moves focus alongside the scroll so keyboard and screen reader users follow the same target
export const scrollToTarget = (target, { focus = false } = {}) => {
    const element = typeof target === 'string' ? $(target) : target;
    if (!element) return false;

    if (focus) {
        element.setAttribute('tabindex', '-1');
        element.focus({ preventScroll: true });
    }

    element.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
};
