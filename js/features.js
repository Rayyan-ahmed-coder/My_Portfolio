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

class CurrentTime {
	constructor() {
		this.timeElement = document.getElementById(`time`);

		setInterval(() => {
			this.getTime();
		}, 0.01);
	}

	getTime() {
		const time = new Date();
		const timeFormatter = time.toLocaleString(`en-US`, {
			year: "numeric",
			month: "long",
			day: "numeric",
			weekday: "short",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true
		});

		if (this.timeElement) {
			this.timeElement.textContent = timeFormatter;
		}
	}
}

document.addEventListener("DOMContentLoaded", () => {
    const animationObserver = new AnimationObserver();
    animationObserver.observe('.features-cards'); // Observes static HTML elements

    new AnimationObserver(animationObserver);
    new CustomCursor();
    new ProgressBar();
	new CurrentTime();
});