export default class LoadContent {
    constructor() {
        this.projectsGrid = document.querySelector("#projects-grid");
        this.init();
    }

    async init() {
        // Await the asynchronous process correctly
        await this.loadProjects();
    }

    async loadProjects() {
        try {
            const response = await fetch("../JSON/projects.json", { 
                cache: "force-cache", 
                priority: "high", 
                signal: AbortSignal.timeout(7000)
            });
            
            if (!response.ok) throw new Error(`HTTP Error Status: ${response.status}`);
            
            // CRITICAL FIX: Added 'await' here. response.json() returns a promise!
            const projects = await response.json();

            // Guard clause: Safety check if data is completely empty
            if (!projects || projects.length === 0) {
                this.projectsGrid.innerHTML = `<p class="error-msg">No projects found.</p>`;
                return;
            }

            // FIX: Removed broken arrow function brackets so strings actually return
            this.projectsGrid.innerHTML = projects.map(project => {
                const projNum = parseInt(project.number, 10);
                const displayNum = String(projNum).padStart(2, '0');

                // Escape variables for XSS protection
                const safeHeading = this.escapeHTML(project.content.heading);
                const safeDesc = this.escapeHTML(project.content.description);
                const safeType = this.escapeHTML(project.type);

                return `
                <article class="project-card ${project.main ? "project-card-large" : ''}" data-category="${this.escapeHTML(project.category)}" data-reveal>
                    <div class="project-preview">
                        <div class="project-number">${displayNum}</div>
                        <div class="project-preview-content">
                            <span>${this.escapeHTML(project.preview[0] || 'Not defined')}</span>
                            <strong>${this.escapeHTML(project.preview[1] || 'Not defined')}</strong>
                        </div>
                    </div>

                    <div class="project-content">
                        <div>
                            <p class="project-type">${safeType}</p>
                            <h3>${safeHeading}</h3>
                            <p>${safeDesc}</p>
                        </div>

                        <div class="project-footer">
                            <div class="project-tags">
                                ${project.tags.map(tag => `<span>${this.escapeHTML(tag)}</span>`).join('')}
                            </div>
                            <a class="project-link" title="Lets go explore" href="${encodeURI(project.link)}" aria-label="View ${safeHeading} project">
                                View
                                <span aria-hidden="true">↗</span>
                            </a>
                        </div>
                    </div>
                </article>`;
            }).join('');

        } catch (error) {
            if (error.name === 'TimeoutError') {
                console.error("Performance Error: The server took too long to reply.");
                this.projectsGrid.innerHTML = `<p class="error-msg">Connection timed out. Please try refreshing.</p>`;
            } else {
                console.error("Error loading content: ", error);
                this.projectsGrid.innerHTML = `<p class="error-msg">Failed to load projects.</p>`;
            }
        }
    }

    escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
}