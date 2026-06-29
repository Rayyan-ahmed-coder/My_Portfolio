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
		}, 1000);
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

class ContentLoader {
	constructor() {
		this.featuresSection = document.querySelector(`.features-section`);

		this.Init();
	}

	async Init() {
		await this.LoadFeatures()
	}

	async LoadFeatures() {
		if (!this.featuresSection) return;

        try {
            const response = await fetch("../JSON/features.json");

            if (!response.ok) {
                throw new Error("Failed to fetch features.");
            }

            const features = await response.json();
            let html = "";

            features.forEach(feature => {
                html += `
                    <div class="features-card">
						<h2>${feature.heading}</h2>

						${feature.lists.map(list => `
							<div class="feature-row">
								<span class="complete">✓</span>
								<p>${list}</p>
							</div>
						`).join("")}
					</div>
                `;
            });

            this.featuresSection.innerHTML = html;
            this.animationObserver?.observe(".features-card");
        }
        catch (error) {
            console.error("Error: ", error);

            this.projectGrid.innerHTML = `
                <div class="fallback">
                    Server is currently down.<br>
                    <span>Features are unable to load!</span>
                    :(
                </div>
            `;
        }
	}
}

document.addEventListener("DOMContentLoaded", () => {
    const animationObserver = new AnimationObserver();
    animationObserver.observe('.features-card'); // Observes static HTML elements

    new AnimationObserver(animationObserver);
    new CustomCursor();
    new ProgressBar();
	new ContentLoader();
	new CurrentTime();
});