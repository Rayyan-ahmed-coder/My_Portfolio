import { $, $$, rafThrottle } from "../core/utilities.js";
import { CONFIG } from "../core/config.js";

export default class ScrollManager {
    constructor() {
        this.scrollButton = $(".scroll-top");
        this.sections = $$("section[id]");
        this.links = $$(".nav-link");
        this.lastScrollY = 0;
        this.scrollDirection = "down";
        this.activeSection = "";
        this.initialize();
    }

    initialize() {
        this.update();
        this.enableSmoothScrolling();
        window.addEventListener("scroll", rafThrottle(() => this.update()),
            { passive: true }
        );
    }

    update() {
        this.detectDirection();
        this.updateScrollButton();
        this.updateActiveSection();
        this.updateScrollButton();
        this.updateActiveSection();
    }

    detectDirection() {
        const current = window.scrollY;
        this.scrollDirection =
            current > this.lastScrollY? "down" : "up";
        this.lastScrollY = current;
    }

    updateScrollButton() {
        if (!this.scrollButton) return;
        this.scrollButton.classList.toggle("visible", window.scrollY > 520);
        this.scrollButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            })
        });
    }

    updateActiveSection() {
        const scrollPosition = window.scrollY + CONFIG.ACTIVE_SECTION_OFFSET;
        let current = "";

        this.sections.forEach(section => {
            if (scrollPosition >= section.offsetTop) {
                current = section.id;
            }
        });

        if (current === this.activeSection) return;

        this.activeSection = current;
        this.links.forEach(link => {
            const active =
                link.getAttribute("href") === `#${current}`;
                link.classList.toggle("active", active);
        });
    }

    enableSmoothScrolling() {
        this.links.forEach(link => {
            link.addEventListener("click", event => {
                const href = link.getAttribute("href");
                if (!href.startsWith("#")) return;

                event.preventDefault();

                const target = document.querySelector(href);
                if (!target) return;

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            });
        });
    }
}