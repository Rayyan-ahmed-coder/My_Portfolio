import { CustomCursor, ProgressBar, AnimationObserver } from "./main.js";


document.addEventListener("DOMContentLoaded", () => {
    const animationObserver = new AnimationObserver();
    animationObserver.observe('.features-cards'); // Observes static HTML elements

    new AnimationObserver(animationObserver);
    new CustomCursor();
    new ProgressBar();
});