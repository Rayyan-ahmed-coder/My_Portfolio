import { CustomCursor, ProgressBar } from "./main.js";
class AnimationObserver {
	constructor() {
		if ('IntersectionObserver' in window) {
			this.observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('show');
						this.observer.unobserve(entry.target);
					}
				});
			}, { threshold: 0.15 });
		} else {
			this.observer = null;
		}
	}

	observe(selector) {
		document.querySelectorAll(selector).forEach((el) => {
			el.classList.add('hidden');
			if (this.observer) {
				this.observer.observe(el);
			} else {
				el.classList.add('show');
			}
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

	async getTime() {
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
	constructor(animationObserver) {
		this.featuresSection = document.querySelector(`.features-section`);
		this.animationObserver = animationObserver;
		this.Init();
	}

	async Init() {
		await this.LoadFeatures();
	}

	async LoadFeatures() {
		if (!this.featuresSection) return;

        try {
            const response = await fetch("../JSON/features.json", { cache: "force-cache" });
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
								<div class="completion">${String(feature.heading) === "Future Features"? "<span>-&gt;</span>" : "✓"}</div>
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
            if (this.featuresSection) {
                this.featuresSection.innerHTML = `
                    <div class="fallback">
                        Server is currently down.<br>
                        <span>Features are unable to load!</span>
                        :(
                    </div>
                `;
            }
        }
	}
}

document.addEventListener("DOMContentLoaded", () => {
    const animationObserver = new AnimationObserver();
    animationObserver.observe('.features-section');

    new CustomCursor();
    new ProgressBar();
	new ContentLoader(animationObserver);
	new CurrentTime();
});