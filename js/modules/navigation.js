import { $, $$ } from "../core/utilities.js";
import { CONFIG } from "../core/config.js";

export default class Navigation {
    constructor() {
        this.header = $(".site-header");
        this.menuButton = $("#menu-toggle");
        this.navigation = $("#navigation-menu");
        this.links = $$(".nav-link");
        this.isOpen = false;
        this.bindEvents();
        window.addEventListener("scroll", this.updateHeader,
            { passive: true }
        );

        this.links.forEach(link => {
            link.addEventListener("click", () => this.close());
        });
    }

    bindEvents() {
        this.menuButton?.addEventListener("click", () => this.toggle(),
            { passive: true }
        );
        document.addEventListener("keydown",this.handleKeyDown);
        document.addEventListener("click",this.handleOutsideClick);
    }

    toggle() {
        this.isOpen? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        this.navigation.classList.add("open");
        this.menuButton.setAttribute("aria-expanded", "true");
    }

    close() {
        this.isOpen = false;
        this.navigation.classList.remove("open");
        this.menuButton.setAttribute("aria-expanded", "false");
    }

    updateHeader = () => {
        this.header.classList.toggle("scrolled", window.scrollY > 20);
    }

    handleKeyDown = event => {
        if (event.key === "Escape" && this.isOpen) {
            this.close();
        }
    }

    handleOutsideClick = event => {
        if (!this.isOpen) return;
        if (this.navigation.contains(event.target)) return;
        if (this.menuButton.contains(event.target)) return;
        this.close();
    }
}