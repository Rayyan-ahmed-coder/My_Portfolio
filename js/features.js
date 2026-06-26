import { CustomCursor, ProgressBar } from "./main.js";

class AnimationObserver {
	constructor() {
		this.observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('show');
						this.observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.15 }
		);
	}

	observe(selector) {
		document.querySelectorAll(selector).forEach((el) => {
			el.classList.add('hidden');
			this.observer.observe(el);
		});
	}
}

document.addEventListener("DOMContentLoaded", () => {
    const animationObserver = new AnimationObserver();
    animationObserver.observe('.features-cards'); // Observes static HTML elements

    new AnimationObserver(animationObserver);
    new CustomCursor();
    new ProgressBar();
});