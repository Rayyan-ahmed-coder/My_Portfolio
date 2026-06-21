// AOS-like Intersection Observer for animations
class AnimationObserver {
	constructor() {
		this.observer = new IntersectionObserver(
			(entries) => {
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

// Navigation Module
class NavigationModule {
	constructor() {
		this.navLinks = document.querySelectorAll('.nav-menu li a[data-section]');
		this.menuToggle = document.getElementById('menu-toggle');
		this.navMenu = document.querySelector('.nav-menu');
		this.sections = Array.from(this.navLinks)
			.map((link) => document.getElementById(link.dataset.section))
			.filter(Boolean);
		
		this.init();
	}

	init() {
		// Mobile menu toggle
		if (this.menuToggle) {
			this.menuToggle.addEventListener('click', () => this.toggleMenu());
		}

		// Smooth scrolling and active link
		this.navLinks.forEach((link) => {
			link.addEventListener('click', () => {
				this.navLinks.forEach((l) => {
					l.classList.remove('active');
					l.removeAttribute('aria-current');
				});
				link.classList.add('active');
				link.setAttribute('aria-current', 'page');
				this.closeMenu();
			});
		});

		// Update active link on scroll
		window.addEventListener('scroll', () => this.updateActiveLink(), { passive: true });
		
		// Initial active link
		this.updateActiveLink();
	}

	toggleMenu() {
		const isOpen = this.menuToggle.getAttribute('aria-expanded') === 'true';
		this.menuToggle.setAttribute('aria-expanded', !isOpen);
		this.navMenu.classList.toggle('active');
	}

	closeMenu() {
		this.menuToggle?.setAttribute('aria-expanded', 'false');
		this.navMenu?.classList.remove('active');
	}

	updateActiveLink() {
		let currentSection = '';

		this.sections.forEach((section) => {
			const sectionTop = section.offsetTop - 180;
			if (window.scrollY >= sectionTop) {
				currentSection = section.id;
			}
		});

		this.navLinks.forEach((link) => {
			link.classList.toggle(
				'active',
				link.getAttribute('data-section') === currentSection
			);
		});
	}
}

class ContentLoader {
    constructor(animationObserver) {
        this.animationObserver = animationObserver;
        this.projectGrid = document.getElementById("projects-grid");
        this.skillsGrid = document.querySelector(".skills_grid");
		this.learndCard = document.querySelector(".learnd-content");

        // Execute initialization sequentially to handle observer attachment safely
        this.init();
    }

    async init() {
        await Promise.all([
            this.loadProjects(),
            this.loadSkills(),
			this.loadLearnd()
        ]);
    }

    async loadProjects() {
        if (!this.projectGrid) return;

        try {
            const response = await fetch("JSON/projects.json");

            if (!response.ok) {
                throw new Error("Failed to fetch projects.");
            }

            const projects = await response.json();
            let html = "";

            projects.forEach(project => {
                html += `
                    <div class="project_card" data-aos="fade-up" title="${project.title}">
                        <div class="project_image">${project.title}</div>

                        <div class="project_content">
                            <h2>${project.title}</h2>
                            <p>${project.description}</p>

                            <div class="project-non-content">
                                <div class="project_tags">
                                    ${project.tags
                                        .map(tag => `<span class="tag">${tag}</span>`)
                                        .join("")}
                                </div>

                                <a 
                                    class="project_btn" 
									rel="noopener noreferrer"
                                    href="${project.link}" 
                                    target="${project.target}" 
                                    title="Let's go explore" >
                                    View Project
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            });

            this.projectGrid.innerHTML = html;
            // Observe the newly created elements
            this.animationObserver?.observe("#projects-grid [data-aos]");
        }
        catch (error) {
            console.error("Error: ", error);

            this.projectGrid.innerHTML = `
                <div class="project_fallback">
                    Server is currently down.<br>
                    <span>Projects are unable to load!</span>
                    :(
                </div>
            `;
        }
    }

    async loadSkills() {
        if (!this.skillsGrid) return;

        try {
            const response = await fetch("JSON/skills.json");
            if (!response.ok) {
                throw new Error("Failed to fetch skills.");
            }

            const skills = await response.json();
            let html = "";

            skills.forEach(skill => {
				this.style = `
					--obj-width: ${skill.progress};
					width: ${skill.progress};
				`;

                html += `
                    <div class="skill_box" data-aos="fade-up" title="${skill.title}">
                        <div class="skill-content">
                            <h2>${skill.heading}</h2>
                            <p>${skill.description}</p>
                        </div>

                        <div class="skill-progress">
                            <div style="${this.style}"></div>
                        </div>
                    </div>
                `;
			});

			this.skillsGrid.innerHTML = html;
			// Observe the newly created elements
			this.animationObserver?.observe(".skills_grid [data-aos]");
        }
        catch (error) {
            console.error("Error: ", error);

            this.skillsGrid.innerHTML = `
                <div class="skill_fallback">
                    Server is currently down.<br>
                    <span>Skills are unable to load!</span>
                    :(
                </div>
            `;
        }
    }

	async loadLearnd() {
		if (!this.learndCard) return;

        try {
            const response = await fetch("JSON/learnd.json");
            if (!response.ok) {
                throw new Error("Failed to fetch skills proficiency.");
            }

            const LearndJSON = await response.json();
			const selectHTML = `
				<div class="learnd-controls">
					<label for="learnd-select">
						Sort Skills
					</label>

					<select name="learnd-selector" id="learnd-select">
						<option value="descending" selected>Decending Proficiency</option>
						<option value="ascending">Ascending Proficiency</option>
					</select>
				</div>
			`;
            let html = "";

            LearndJSON.forEach(learnd => {
                html += `
                    <div class="learnd-card" data-aos="fade-up" title="${learnd.title}">
						<div class="learnd-header">
							<h2>${learnd.heading}</h2>
							<span>${learnd.advanciy}</span>
						</div>
					</div>
                `;
			});

			this.learndCard.innerHTML = selectHTML + html;
			// Observe the newly created elements
			this.animationObserver?.observe(".learnd-content [data-aos]");
        }
        catch (error) {
            console.error("Error: ", error);

            this.skillsGrid.innerHTML = `
                <div class="learnd_fallback">
                    Server is currently down.<br>
                    <span>Skills are unable to load!</span>
                    :(
                </div>
            `;
        }
	}
}


// Learnd section
class LearnedSorter {
	constructor() {
		this.select = document.getElementById("learnd-select");
		this.container = document.querySelector(".learnd-content");

		if (!this.select || !this.container) return;

		this.select.addEventListener("change", () => {
			this.sortCards(this.select.value);
		});

		// Initial sort
		this.sortCards(this.select.value);
	}

	sortCards(order) {
		const levels = {
			Advance: 3,
			Intermediate: 2,
			Beginner: 1
		};

		const cards = [...this.container.querySelectorAll(".learnd-card")];

		cards.sort((a, b) => {
			const levelA = levels[a.querySelector("span").textContent.trim()] || 0;
			const levelB = levels[b.querySelector("span").textContent.trim()] || 0;

			return order === "ascending"
				? levelA - levelB
				: levelB - levelA;
		});

		cards.forEach(card => this.container.appendChild(card));
	}
}


// Progress Bar Module
class ProgressBar {
	constructor() {
		this.progressBar = document.getElementById('progress-bar');
		if (this.progressBar) {
			window.addEventListener('scroll', () => this.update(), { passive: true });
			window.addEventListener('resize', () => this.update());
			this.update();
		}
	}

	update() {
		if (!this.progressBar) return;

		const scrollTop = window.scrollY || window.pageYOffset;
		const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
		const percent = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

		this.progressBar.style.width = `${Math.min(percent, 100)}%`;
	}
}

// Contact Dialog Module
class ContactDialog {
	constructor() {
		this.dialog = document.getElementById('contact-dialog');
		this.openBtn = document.getElementById('contact-button');
		this.closeBtn = document.getElementById('close-dialog');
		this.form = document.getElementById('contact-form');

		this.line1 = document.querySelector(".line-1");
		this.line2 = document.querySelector(".line-2");
		this.line3 = document.querySelector(".line-3");
		this.body = document.body;
		
		this.init();
		this.svgX();
	}

	init() {
		if (!this.dialog) return;

		this.openBtn?.addEventListener('click', () => this.open());
		this.closeBtn?.addEventListener('click', () => this.close());
        this.closeBtn?.addEventListener(`mouseenter`, () => this.svgArrow());
		this.closeBtn?.addEventListener(`mouseleave`, () => this.svgX());
		this.form?.addEventListener('submit', (e) => this.handleSubmit(e));

		// Close on backdrop click
		this.dialog.addEventListener('click', (e) => {
			if (e.target === this.dialog) {
				this.close();
			}
		});

		// Close on Escape key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.dialog.open) {
				this.close();
			}
		});
	}

	open() {
		if (!this.dialog) return;
		this.dialog.showModal();
		this.body.style.overflowY = 'hidden';
	}

	close() {
		if (!this.dialog || !this.dialog.open) return;
		this.dialog.close();
		this.body.style.overflowY = '';
	}

    svgArrow() {
		// top arrow wing
		this.line1.setAttribute("x1", 52);
		this.line1.setAttribute("y1", 22);
		this.line1.setAttribute("x2", 80);
		this.line1.setAttribute("y2", 50);

		// arrow shaft
		this.line2.setAttribute("x1", 10);
		this.line2.setAttribute("y1", 50);
		this.line2.setAttribute("x2", 80);
		this.line2.setAttribute("y2", 50);

		// bottom arrow wing
		this.line3.setAttribute("x1", 52);
		this.line3.setAttribute("y1", 78);
		this.line3.setAttribute("x2", 80);
		this.line3.setAttribute("y2", 50);
	}

	svgX() {
		this.line1.setAttribute("x1", 20);
		this.line1.setAttribute("y1", 20);
		this.line1.setAttribute("x2", 80);
		this.line1.setAttribute("y2", 80);

		this.line2.setAttribute("x1", 50);
		this.line2.setAttribute("y1", 50);
		this.line2.setAttribute("x2", 50);
		this.line2.setAttribute("y2", 50);

		this.line3.setAttribute("x1", 20);
		this.line3.setAttribute("y1", 80);
		this.line3.setAttribute("x2", 80);
		this.line3.setAttribute("y2", 20);
	}

		handleSubmit(e) {
			if (!this.dialog) return;
			e.preventDefault();

			const fields = Array.from(this.form.querySelectorAll('input, textarea'));
			const statusDiv = document.getElementById('form-status') || this.createStatusDiv();
			let isValid = true;

			// Clear previous errors
			fields.forEach((field) => this.clearFieldError(field));

			// Validate all fields
			fields.forEach((field) => {
				if (!field.checkValidity()) {
					isValid = false;
					this.showFieldError(field);
				}
			});

			if (!isValid) {
				fields.find((f) => !f.checkValidity())?.focus();
				return;
			}

			statusDiv.textContent = '';
			statusDiv.classList.remove('error', 'success');

			// --- NEW: Scroll to the bottom of the form smoothly ---
			this.form.scrollTo({
				top: this.form.scrollHeight,
				behavior: 'smooth'
			});

			// Simulate form submission
			this.form.style.opacity = '0.6';
			this.form.style.pointerEvents = 'none';

			setTimeout(() => {
				statusDiv.textContent = '✓ Message sent successfully! I\'ll get back to you soon.';
				statusDiv.classList.remove('error');
				statusDiv.classList.add('success');

				// --- NEW: Scroll again if the success text height expands the container ---
				this.form.scrollTo({
					top: this.form.scrollHeight,
					behavior: 'smooth'
				});

				setTimeout(() => {
					this.form.reset();
					this.form.style.opacity = '1';
					this.form.style.pointerEvents = 'auto';
					statusDiv.classList.remove('success');
					this.close();
				}, 2600);
			}, 800);
		}


	createStatusDiv() {
		const statusDiv = document.createElement('div');
		statusDiv.id = 'form-status';
		statusDiv.className = 'form_status';
		this.form.appendChild(statusDiv);
		return statusDiv;
	}

	showFieldError(field) {
		field.classList.add('invalid');
		let error = field.parentElement.querySelector('.field_error');

		if (!error) {
			error = document.createElement('div');
			error.className = 'field_error';
			field.parentElement.appendChild(error);
		}

		const messages = {
			valueMissing: 'This field is required.',
			typeMismatch: field.type === 'email' ? 'Please enter a valid email address.' : 'Please enter a valid value.',
		};

		error.textContent = messages[Object.keys(field.validity).find((key) => field.validity[key])] || 'Invalid input';
	}

	clearFieldError(field) {
		field.classList.remove('invalid');
		const error = field.parentElement.querySelector('.field_error');
		if (error) error.remove();
	}
}


// Smooth Scroll to Section
class SmoothScroll {
	constructor() {
		document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
			anchor.addEventListener('click', (e) => {
				const href = anchor.getAttribute('href');
				if (!href || href === '#') return;
				e.preventDefault();
				const target = document.querySelector(href);
				if (target) {
					target.scrollIntoView({ behavior: 'smooth', block: 'start' });
				}
			});
		});
	}
}

// Custom Cursor (Optional - desktop only)
class CustomCursor {
	constructor() {
		this.cursor = document.querySelector('.cursor');
		
		// Only enable on desktop
		if (this.cursor && window.matchMedia('(pointer: fine)').matches) {
			this.init();
		} else if (this.cursor) {
			this.cursor.style.display = 'none';
		}
	}

	init() {
		window.addEventListener('mousemove', (e) => {
			this.cursor.style.display = `block`;
			this.cursor.style.transform = 
				`translate(${e.clientX - 6}px, ${e.clientY - 3}px)`;
		});

		// Add interactive states
		document.querySelectorAll('a, button').forEach((el) => {
			el.addEventListener('mouseenter', () => this.cursor?.classList.add('active'));
			el.addEventListener('mouseleave', () => this.cursor?.classList.remove('active'));
		});
	}
}

// Button Navigation
class ButtonNavigation {
	constructor() {
		const hireBtn = document.getElementById('hire-btn');
		const projectsBtn = document.getElementById('projects-btn');

		hireBtn?.addEventListener('click', () => {
			document.getElementById('contact-button')?.click();
		});

		projectsBtn?.addEventListener('click', () => {
			document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	}
}


// Console Welcome Message
class WelcomeMessage {
	constructor() {
		this.log();
	}

	log() {
		const styles = {
			main: 'color: #3484ee; text-decoration: underline; text-decoration-color: #1d44c4; text-decoration-offset: 4px; font-size: 40px; font-weight: 650; letter-spacing: 0.3px; margin: 12px;',
			highlight: 'background: linear-gradient(135deg, rgb(147, 189, 252), rgb(45, 72, 228)); border-radius: 10px; color: #ffffff; padding: 6px 9px; font-size: 45px; font-weight: 650; margin: 0 0 0 12px; letter-spacing: 0.4px;',
		};

		console.log('%cWelcome to My %cPortfolio', styles.main, styles.highlight);
		console.log(
			'%c👋 Thanks for visiting! Feel free to explore and get in touch.',
			'color: #14c5e4; font-size: 14px; font-weight: 600;'
		);
	}
}


// Utility: Debounce
function debounce(func, delay) {
	let timeoutId;
	return function (...args) {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func.apply(this, args), delay);
	};
}

// INITIALIZATION
// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all modules
    const animationObserver = new AnimationObserver();
    animationObserver.observe('[data-aos]'); // Observes static HTML elements

    new NavigationModule();
    new ProgressBar();
    new ContactDialog();
    new SmoothScroll();
    new ContentLoader(animationObserver);
	new LearnedSorter();
    new CustomCursor();
    new ButtonNavigation();
    new WelcomeMessage();

    // Add animation delays with data-aos-delay
    document.querySelectorAll('[data-aos-delay]').forEach((el) => {
        const delay = el.getAttribute('data-aos-delay');
        el.style.animationDelay = `${delay}ms`;
    });

    console.log('%c✨ Portfolio loaded successfully!', 'color: #10b981; font-size: 14px; font-weight: 600;');
});

// Prevent layout shift on scroll
window.addEventListener('scroll', debounce(() => {
	// Additional scroll logic can go here
}, 100), { passive: true });