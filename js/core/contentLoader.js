export default class loadcontent {
    #projectsGrid;
    #abortController;

    constructor() {
        this.#projectsGrid = document.querySelector("#projects-grid");
        this.#abortController = null;
        this.init();
    }

    async init() {
        if (!this.#projectsGrid) {
            console.error("Target #projects-grid element not Found in DOM.");
            return;
        }

        const idle = window.requestIdleCallback || function (cb) { return setTimeout(cb, 50); };
        const triggerLoad = () => {
            idle(() => this.loadProjects());
        };

        if ('IntersectionObserver' in window) {
            const observerTarget = this.#projectsGrid.closest('section') || this.#projectsGrid;
            this.observer = new IntersectionObserver((entries, observer) => {
                if (entries.some(entry => entry.isIntersecting)) {
                    observer.disconnect();
                    triggerLoad();
                }
            }, {
                rootMargin: '240px 0px',
                threshold: 0.05
            });
            this.observer.observe(observerTarget);
        } else {
            triggerLoad();
        }
    }

    async loadProjects() {
        if (this.#abortController) {
            this.#abortController.abort();
        }
        this.#abortController = new AbortController();

        try {
            const response = await fetch("js/JSON/projects.json", { 
                cache: "force-cache",
                signal: this.#abortController.signal,
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP Error!! Status: ${response.status}`);
            }
            
            const projects = await response.json();
            if (!Array.isArray(projects) || projects.length === 0) {
                this.#renderStaticMessage('<p class="error-msg">No Projects Found.</p>');
                return;
            }
            // Build HTML in a buffer and insert once to minimize reflows
            let htmlbuffer = "";
            const len = projects.length;
            for (let i = 0; i < len; i++) {
                htmlbuffer += this.#generateProjectCardHTML(projects[i]);
            }

            // Use a fragment via template to avoid replacing unrelated nodes
            this.#renderStaticMessage(htmlbuffer);
            this.#attachProjectFilterEvents();

            // Inform the app that new content was added so observers can attach
            try {
                document.dispatchEvent(new CustomEvent('content:loaded', { detail: { count: len } }));
            } catch (e) {
                // ignore event dispatch errors
            }
        } catch (error) {
            // avoid logging aborted requests as errors
            if (error.name === 'AbortError') return;

            console.error("Error Loading Content: ", error);
            this.#renderStaticMessage('<p class="error-msg">Failed to Load Projects.</p>');
        }
    }

    #generateProjectCardHTML(project) {
        if (!project) return '';
        const rawNum = parseInt(project.number, 10);
        const displayNum = isNaN(rawNum) ? "00" : String(rawNum).padStart(2, '0');
        
        const content = project.content || {};
        const preview = project.preview || [];
        const tags = Array.isArray(project.tags) ? project.tags : [];

        const safeType = this.escapehtml(project.type ?? 'Type Value not set');
        const safeHeading = this.escapehtml(content.heading ?? 'Untitled Project');
        const safeDescription = this.escapehtml(content.description ?? 'Description not set');
        const safeTarget = this.escapehtml(project.target ?? "_blank");
        const safePrefetch = this.escapehtml(typeof project.preFetch === "boolean"? String(preFetch) : 'false');
        const safeCategory = this.escapehtml(project.category ?? 'Unknown');
        const safeLink = encodeURI(project.link ?? '#');
        
        const preview0 = this.escapehtml(preview[0] ?? 'Not Defined');
        const preview1 = this.escapehtml(preview[1] ?? 'Not Defined');

        // pre-build tags string to avoid deep nested map functions inside the loop
        let tagsHTML = "";
        const taglen = tags.length;
        for (let j = 0; j < taglen; j++) {
            tagsHTML += `<span>${this.escapehtml(tags[j])}</span>`;
        }

        const cardClass = project.main ? "project-card project-card-large" : "project-card";
        return `
        <article class="${cardClass}" data-category="${safeCategory}" data-reveal>
            <div class="project-preview">
                <div class="project-number" aria-hidden="true">${displayNum}</div>
                <div class="project-preview-content">
                    <span>${preview0}</span>
                    <strong>${preview1}</strong>
                </div>
            </div>

            <div class="project-content">
                <div>
                    <p class="project-type">${safeType}</p>
                    <h3 id="project-title-${displayNum}">${safeHeading}</h3>
                    <p>${safeDescription}</p>
                </div>

                <div class="project-footer">
                    <div class="project-tags" role="list" aria-label="Project technologies">${tagsHTML}</div>
                    <a class="project-link" 
                       href="${safeLink}" 
                       title="Explore ${safeHeading}" 
                       ${safeTarget === '_blank' ? 'target="_blank" rel="noopener noreferrer"' : `target="_self"`}
                       ${safePrefetch === 'false' ? 'prefetch="false"' : ''}
                       aria-describedby="project-title-${displayNum}">
                        View <span class="link-arrow" aria-hidden="true">↗</span>
                    </a>
                </div>
            </div>
        </article>`;
    }

    #renderStaticMessage(htmlString) {
        this.#projectsGrid.innerHTML = htmlString;
    }

    #attachProjectFilterEvents() {
        const buttons = [...document.querySelectorAll('.filter-button')];
        if (!buttons.length) return;

        buttons.forEach(button => {
            button.addEventListener('click', () => this.#handleProjectFilter(button));
        });
    }

    #handleProjectFilter(button) {
        const filterValue = (button.dataset.filter || '').trim().toLowerCase();
        const cards = [...this.#projectsGrid.querySelectorAll('.project-card')];

        cards.forEach(card => {
            const categories = (card.dataset.category || '').toLowerCase().split(/\s+/);
            const matches = filterValue === 'all' || categories.includes(filterValue);
            card.classList.toggle('is-hidden', !matches);
        });

        document.querySelectorAll('.filter-button').forEach(btn => {
            btn.classList.toggle('active', btn === button);
        });
    }

    escapehtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, tag => {
            switch (tag) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case "'": return '&#39;';
                case '"': return '&quot;';
                default: return tag;
            }
        });
    }
}