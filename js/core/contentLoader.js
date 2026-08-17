export default class LoadContent {
    #projectsGrid;
    #abortController;
    #cachedCards = null;
    #filterButtons = null;
    #observer = null;

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

        const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 50));
        const triggerLoad = () => idle(() => this.loadProjects());

        // HIGH PERFORMANCE: Let the browser engine handle off-screen intersection checking
        if ('IntersectionObserver' in window) {
            const observerTarget = this.#projectsGrid.closest('section') || this.#projectsGrid;
            this.#observer = new IntersectionObserver((entries) => {
                if (entries.some(entry => entry.isIntersecting)) {
                    this.#observer.disconnect();
                    triggerLoad();
                }
            }, {
                rootMargin: '240px 0px',
                threshold: 0.01 // Lower threshold fires faster with zero layout lag
            });
            this.#observer.observe(observerTarget);
        } else {
            triggerLoad();
        }
    }

    async loadProjects() {
        if (this.#abortController) this.#abortController.abort();
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

            let htmlBuffer = "";
            const len = projects.length;
            for (let i = 0; i < len; i++) {
                htmlBuffer += this.#generateProjectCardHTML(projects[i]);
            }

            const template = document.createElement('template');
            template.innerHTML = htmlBuffer;
            
            this.#projectsGrid.innerHTML = '';
            this.#projectsGrid.appendChild(template.content);
            this.#attachProjectFilterEvents();
            try {
                document.dispatchEvent(new CustomEvent('content:loaded', { detail: { count: len } }));
            } catch (e) { 
                // silent pass 
            }
        } catch (error) {
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

        const safeType = this.escapeHtml(project.type ?? 'Type Value not set');
        const safeHeading = this.escapeHtml(content.heading ?? 'Untitled Project');
        const safeDescription = this.escapeHtml(content.description ?? 'Description not set');
        
        // FIXED: Repaired runtime crashing preFetch parameter check context loop error bug
        const preFetchBool = typeof project.preFetch === "boolean" ? project.preFetch : false;
        const safeCategory = this.escapeHtml(project.category ?? 'Unknown').toLowerCase().trim();
        const safeLink = encodeURI(project.link ?? '#');
        
        const preview0 = this.escapeHtml(preview[0] ?? 'Not Defined');
        const preview1 = this.escapeHtml(preview[1] ?? 'Not Defined');

        // Linear allocation string buffer execution logic loop
        let tagsHTML = "";
        const tagLen = tags.length;
        for (let j = 0; j < tagLen; j++) {
            tagsHTML += `<span>${this.escapeHtml(tags[j])}</span>`;
        }

        // FIXED: Normalized robust HTML link targeting validation script checks
        const rawTarget = String(project.target ?? '_blank').toLowerCase().trim();
        const finalTargetStr = (rawTarget.includes('blank')) ? 'target="_blank" rel="noopener noreferrer"' : 'target="_self"';
        const preFetchStr = !preFetchBool?'prefetch="false"' : '';

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
                       ${finalTargetStr}
                       ${preFetchStr}
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
        this.#filterButtons = document.querySelectorAll('.filter-button');
        this.#cachedCards = this.#projectsGrid.querySelectorAll('.project-card');
        if (!this.#filterButtons.length) return;

        this.#filterButtons.forEach(button => {
            button.addEventListener('click', () => this.#handleProjectFilter(button));
        });
    }

    #handleProjectFilter(button) {
        const filterValue = (button.dataset.filter || '').trim().toLowerCase();
        if (!this.#cachedCards) return;

        requestAnimationFrame(() => {
            const cardLen = this.#cachedCards.length;
            for (let i = 0; i < cardLen; i++) {
                const card = this.#cachedCards[i];
                const categories = card.dataset.category || '';
                const matches = filterValue === 'all' || categories.includes(filterValue);
                
                // State check gate prevents layout style invalidation loops if state hasn't changed
                if (card.classList.contains('is-hidden') === matches) {
                    card.classList.toggle('is-hidden', !matches);
                }
            }

            // Quick sync loop for button states
            this.#filterButtons.forEach(btn => {
                const isSelected = btn === button;
                if (btn.classList.contains('active') !== isSelected) {
                    btn.classList.toggle('active', isSelected);
                }
            });
        });
    }

    escapeHtml(str) {
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