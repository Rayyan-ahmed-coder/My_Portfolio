import { beforeEach, vi } from 'vitest';

// jsdom exposes no matchMedia implementation, and modules read it while being
// imported, so a non-matching baseline is installed before any import runs.
// Tests that care about media queries override it via stubMatchMedia().
if (typeof window.matchMedia !== 'function') {
    window.matchMedia = (query) => ({
        media: query,
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
        onchange: null,
    });
}

// jsdom does not implement layout, so scrollIntoView is a no-op that tests can
// still spy on.
if (typeof Element.prototype.scrollIntoView !== 'function') {
    Element.prototype.scrollIntoView = function scrollIntoView() {};
}

// Every test starts from a predictable, fully controllable baseline.
beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('style');
    document.documentElement.className = '';
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    document.body.className = '';
    localStorage.clear();
    vi.unstubAllGlobals();
});
