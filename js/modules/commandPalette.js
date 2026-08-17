export default class CommandPalette {
    constructor() {
        this.body = document.querySelector(`body`);
        this.panel = document.getElementById('command-panel');
        this.toggle = document.getElementById('command-toggle');
        this.closeButton = document.getElementById('command-close');
        this.input = document.getElementById('command-input');
        this.list = document.getElementById('command-list');
        this.resultsTitle = document.querySelector('.command-panel-results-title');
        this.analyticsContainer = document.getElementById('command-analytics');
        this.summaryContainer = document.getElementById('command-summary');
        this.metaContainer = document.querySelector('.command-panel-meta');
        this.commands = [
            // Numeric quick navigation
            { title: 'Go to Home', subtitle: 'Jump to the hero section', action: () => this.navigateTo('#home'), category: 'Navigation', shortcut: '1' },
            { title: 'Go to Work', subtitle: 'See selected projects', action: () => this.navigateTo('#work'), category: 'Navigation', shortcut: '2' },
            { title: 'Go to Features', subtitle: 'Review what sets this portfolio apart', action: () => this.navigateTo('#features'), category: 'Navigation', shortcut: '3' },
            { title: 'Go to About', subtitle: 'Learn more about the developer', action: () => this.navigateTo('#about'), category: 'Navigation', shortcut: '4' },
            { title: 'Go to Skills', subtitle: 'View the technology toolkit', action: () => this.navigateTo('#skills'), category: 'Navigation', shortcut: '5' },
            { title: 'Go to Contact', subtitle: 'Open the contact section', action: () => this.navigateTo('#contact'), category: 'Navigation', shortcut: '6' },
            { title: 'Jump to projects', subtitle: 'Open the project gallery', action: () => this.navigateTo('#work'), category: 'Navigation', shortcut: '7' },
            { title: 'Open resume', subtitle: 'View or download resume (new tab)', action: () => this.openLink('/resume.pdf'), category: 'Actions', shortcut: '8' },
            { title: 'Open GitHub', subtitle: 'Jump to my GitHub profile', action: () => this.openLink('https://github.com/'), category: 'Social', shortcut: '9' },
            { title: 'Open LinkedIn', subtitle: 'Jump to my LinkedIn profile', action: () => this.openLink('https://www.linkedin.com/'), category: 'Social', shortcut: '0' },

            // Filters (single-letter shortcuts)
            { title: 'Show all projects', subtitle: 'Reset project filters', action: () => this.dispatchSelector('[data-filter="all"]'), category: 'Filters', shortcut: 'f' },
            { title: 'Show web projects', subtitle: 'Filter to Web projects', action: () => this.dispatchSelector('[data-filter="web"]'), category: 'Filters', shortcut: 'w' },
            { title: 'Show JavaScript projects', subtitle: 'Filter to JavaScript projects', action: () => this.dispatchSelector('[data-filter="javascript"]'), category: 'Filters', shortcut: 'j' },
            { title: 'Show games', subtitle: 'Filter to Game projects', action: () => this.dispatchSelector('[data-filter="game"]'), category: 'Filters', shortcut: 'g' },

            // Quick actions (Alt+Shift combos and single-key safe alternates)
            { title: 'Toggle theme', subtitle: 'Switch between light and dark mode', action: () => this.dispatchCommand('theme-toggle'), category: 'Actions', shortcut: 'Alt+Shift+T' },
            { title: 'Open navigation menu', subtitle: 'Toggle the mobile navigation', action: () => this.dispatchCommand('menu-toggle'), category: 'Actions', shortcut: 'Alt+Shift+M' },
            { title: 'Copy email address', subtitle: 'Copy the contact email to clipboard', action: () => this.copyEmail(), category: 'Actions', shortcut: 'Alt+Shift+C' },
            { title: 'Copy creator name', subtitle: 'Copy my name to clipboard', action: () => this.copyText('Rayyan Khan'), category: 'Actions', shortcut: 'Alt+Shift+P' },
            { title: 'Open email client', subtitle: 'Create a new message to contact me', action: () => this.dispatchSelector('.contact-email'), category: 'Actions', shortcut: 'Alt+Shift+E' },
            { title: 'Copy site URL', subtitle: 'Copy the current page URL', action: () => this.copyText(window.location.href), category: 'Actions', shortcut: 'Alt+Shift+U' },
            { title: 'Toggle animations', subtitle: 'Enable/disable page motion effects', action: () => document.documentElement.classList.toggle('reduced-motion'), category: 'Actions', shortcut: 'Alt+Shift+A' },
            { title: 'Download resume', subtitle: 'Download the resume PDF', action: () => this.openLink('/resume.pdf'), category: 'Actions', shortcut: 'Alt+Shift+R' },
            { title: 'Focus search', subtitle: 'Open command palette and focus the search', action: () => this.focusSearch(), category: 'Actions', shortcut: 'Alt+Shift+S' },

            // Utility and accessibility
            { title: 'Increase text size', subtitle: 'Increase base font size for readability', action: () => document.documentElement.style.setProperty('font-size', (parseFloat(getComputedStyle(document.documentElement).fontSize) + 1) + 'px'), category: 'Accessibility', shortcut: 'Alt+Shift++' },
            { title: 'Decrease text size', subtitle: 'Decrease base font size', action: () => document.documentElement.style.setProperty('font-size', Math.max(12, parseFloat(getComputedStyle(document.documentElement).fontSize) - 1) + 'px'), category: 'Accessibility', shortcut: 'Alt+Shift+-' },
            { title: 'Toggle high contrast', subtitle: 'Enable/disable high contrast mode', action: () => document.documentElement.classList.toggle('high-contrast'), category: 'Accessibility', shortcut: 'Alt+Shift+H' },

            // Developer-friendly / misc
            { title: 'Print page', subtitle: 'Open browser print dialog', action: () => window.print(), category: 'Tools', shortcut: 'p' },
            { title: 'Open devtools (hint)', subtitle: 'Suggestion: use browser devtools', action: () => this.openLink('about:blank'), category: 'Tools', shortcut: 'd' },
            { title: 'View source (GitHub)', subtitle: 'Open repository source', action: () => this.openLink('https://github.com/'), category: 'Tools', shortcut: 'v' },

            // Extras: quick navigation & controls
            { title: 'Scroll to top', subtitle: 'Return to the top of the page', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }), category: 'Navigation', shortcut: 'Home' },
            { title: 'Scroll to bottom', subtitle: 'Jump to bottom of page', action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), category: 'Navigation', shortcut: 'End' },
            { title: 'Open contact links', subtitle: 'Open contact links area', action: () => this.navigateTo('#contact'), category: 'Navigation', shortcut: 'k' },
            { title: 'Open projects grid', subtitle: 'Focus the projects area', action: () => this.dispatchSelector('#projects-grid'), category: 'Navigation', shortcut: 'x' }
        ];
        this.filteredCommands = [...this.commands];
        this.shortcutMap = new Map();
        this.commands.forEach(command => {
            if (command.shortcut) {
                this.shortcutMap.set(command.shortcut.toLowerCase(), command);
            }
        });
        this.selectedIndex = 0;

        if (!this.panel || !this.toggle || !this.closeButton || !this.input || !this.list || !this.resultsTitle || !this.analyticsContainer || !this.summaryContainer || !this.metaContainer) {
            throw new Error('Command palette elements are missing');
        }

        this.init();
    }

    debounce(fn, delay = 120) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    init() {
        this.toggle.addEventListener('click', () => this.open());
        this.closeButton.addEventListener('click', () => this.close());
        this.debouncedFilter = this.debounce(() => this.filterCommands(), 120);
        this.input.addEventListener('input', this.debouncedFilter);
        this.input.addEventListener('keydown', event => this.handleKeyDown(event));
        this.panel.addEventListener('click', event => {
            if (event.target === this.panel) {
                this.close();
            }
        });
        document.addEventListener('keydown', event => {
            // quick toggle
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                this.togglePanel();
                return;
            }

            // global shortcut commands
            if (this.handleGlobalShortcut(event)) {
                return;
            }

            // close with escape
            if (event.key === 'Escape' && this.isOpen()) {
                event.preventDefault();
                this.close();
            }
        });

        this.renderMeta();
        this.renderAnalytics();
        this.renderSummary();
        this.renderCommands();
    }

    open() {
        this.body.classList.add(`body-locked`);
        this.panel.classList.add('open');
        this.panel.setAttribute('aria-hidden', 'false');
        this.input.value = '';
        this.filterCommands();
        this.renderMeta();
        this.renderAnalytics();
        this.renderSummary();
        this.input.focus();
    }

    close() {
        this.body.classList.remove(`body-locked`);
        this.panel.classList.remove('open');
        this.panel.setAttribute('aria-hidden', 'true');
        this.toggle.focus();
    }

    togglePanel() {
        if (this.isOpen()) {
            this.close();
        } else {
            this.open();
        }
    }

    isOpen() {
        return this.panel.classList.contains('open');
    }

    filterCommands() {
        const query = this.input.value.trim().toLowerCase();
        this.filteredCommands = this.commands.filter(cmd => {
            return [cmd.title, cmd.subtitle, cmd.category]
                .map(value => (value || '').toLowerCase())
                .some(value => value.includes(query));
        });
        this.selectedIndex = 0;
        this.renderCommands();
    }

    renderCommands() {
        this.list.innerHTML = '';
        const fragment = document.createDocumentFragment();

        if (this.filteredCommands.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'command-item empty';
            emptyState.textContent = 'No matching commands';
            fragment.appendChild(emptyState);
            this.list.appendChild(fragment);
            this.resultsTitle.textContent = `Commands · 0 results`;
            return;
        }

        const categories = [...new Set(this.filteredCommands.map(cmd => cmd.category || 'Other'))];

        categories.forEach(category => {
            const categoryCommands = this.filteredCommands.filter(cmd => (cmd.category || 'Other') === category);
            const categoryLabel = document.createElement('div');
            categoryLabel.className = 'command-category';
            categoryLabel.textContent = category;
            fragment.appendChild(categoryLabel);

            categoryCommands.forEach(command => {
                const globalIndex = this.filteredCommands.indexOf(command);
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'command-item';
                item.dataset.index = String(globalIndex);
                item.setAttribute('role', 'option');
                item.setAttribute('aria-selected', globalIndex === this.selectedIndex ? 'true' : 'false');
                if (globalIndex === this.selectedIndex) {
                    item.classList.add('selected');
                }
                const shortcutMarkup = command.shortcut ? `<kbd class="cmd-shortcut">${command.shortcut}</kbd>` : '';
                item.innerHTML = `<div class="command-item-main"><strong>${command.title}</strong><span>${command.subtitle || 'Press Enter to execute'}</span></div>${shortcutMarkup}`;
                item.addEventListener('click', (e) => {
                    const idx = Number(e.currentTarget.dataset.index);
                    this.executeCommand(idx);
                });
                item.addEventListener('mouseover', () => this.setSelectedIndex(globalIndex));
                fragment.appendChild(item);
            });
        });

        this.list.appendChild(fragment);
        this.resultsTitle.textContent = `Commands · ${this.filteredCommands.length} result${this.filteredCommands.length !== 1 ? 's' : ''}`;
    }

    renderAnalytics() {
        const data = this.getAnalyticsData();
        this.analyticsContainer.innerHTML = '';
        const order = ['projects', 'categories', 'techTags', 'sections', 'skills', 'filters', 'features', 'commandGroups', 'actions', 'topTag', 'theme'];

        order.forEach(key => {
            if (!data[key]) {
                return;
            }
            const stat = data[key];
            if (stat.value === 0 || stat.value === 'None') {
                return;
            }
            const card = document.createElement('div');
            card.className = 'command-stat';
            card.innerHTML = `<strong>${stat.value}</strong><span>${stat.label}</span>`;
            this.analyticsContainer.appendChild(card);
        });
    }

    renderMeta() {
        const data = this.getAnalyticsData();
        this.metaContainer.innerHTML = '';
        const chips = [
            { label: 'Open palette', value: 'Ctrl + K' },
            { label: 'Toggle theme', value: 'Alt + Shift + T' },
            { label: 'Menu toggle', value: 'Alt + Shift + M' },
            { label: 'Copy email', value: 'Alt + Shift + C' },
            { label: 'Commands', value: `${data.commands.value}` }
        ];

        chips.forEach(chip => {
            const element = document.createElement('span');
            element.className = 'command-chip';
            element.textContent = `${chip.value} · ${chip.label}`;
            this.metaContainer.appendChild(element);
        });
    }

    renderSummary() {
        const summary = this.getSummaryData();
        this.summaryContainer.innerHTML = `
            <strong>${summary.title}</strong>
            <span>${summary.description}</span>
        `;
    }

    handleGlobalShortcut(event) {
        // Alt+Shift+<key> combos (explicit)
        if (event.altKey && event.shiftKey && !event.ctrlKey && !event.metaKey) {
            const key = event.key.toUpperCase();
            const shortcut = `alt+shift+${key}`;
            const command = this.shortcutMap.get(shortcut.toLowerCase());

            if (command) {
                event.preventDefault();
                command.action();
                return true;
            }
            return false;
        }

        // Single-key global shortcuts (safe): only when no modifiers and focus isn't in a form control
        if (!event.altKey && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
            const active = document.activeElement;
            const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
            if (isTyping) return false;

            if (/^[0-9a-z]$/i.test(event.key)) {
                const key = event.key.toLowerCase();
                const command = this.shortcutMap.get(key);
                if (command) {
                    event.preventDefault();
                    command.action();
                    return true;
                }
            }
        }

        return false;
    }

    getSummaryData() {
        const data = this.getAnalyticsData();

        return {
            title: `Live portfolio snapshot • ${data.commands.value} commands ready`,
            description: `${data.projects.value} projects · ${data.categories.value} categories · ${data.techTags.value} tech tags · ${data.sections.value} section anchors · ${data.skills.value} skill groups · ${data.theme.value} mode`
        };
    }

    getAnalyticsData() {
        const projects = Array.from(document.querySelectorAll('.project-card'));
        const projectCount = projects.length;
        const projectTags = Array.from(document.querySelectorAll('.project-tags span')).map(tag => tag.textContent.trim()).filter(Boolean);
        const projectCategories = new Set(projects.flatMap(project => (project.dataset.category || '').split(' ').map(tag => tag.trim()).filter(Boolean)));
        const techTags = new Set(projectTags);
        const featureCount = document.querySelectorAll('.feature-card').length;
        const skillRows = document.querySelectorAll('.skill-row').length;
        const filters = document.querySelectorAll('.filter-button').length;
        const navLinks = document.querySelectorAll('.nav-link').length;
        const sectionAnchors = document.querySelectorAll('section[id]').length || navLinks;
        const activeTheme = document.documentElement.dataset.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        const commandGroups = new Set(this.commands.map(cmd => cmd.category || 'Other')).size;
        const actionCount = this.commands.filter(cmd => cmd.category === 'Actions').length;
        const filterCommands = this.commands.filter(cmd => cmd.category === 'Filters').length;
        const topTag = projectTags.reduce((counts, tag) => {
            counts[tag] = (counts[tag] || 0) + 1;
            return counts;
        }, {});
        const topTechTag = Object.entries(topTag).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

        return {
            commands: { value: this.commands.length, label: 'Commands available' },
            projects: { value: projectCount, label: 'Projects featured' },
            categories: { value: projectCategories.size, label: 'Project categories' },
            techTags: { value: techTags.size, label: 'Technology tags' },
            sections: { value: sectionAnchors, label: 'Section anchors' },
            skills: { value: skillRows, label: 'Skill rows detected' },
            filters: { value: filterCommands, label: 'Filter commands' },
            features: { value: featureCount, label: 'Feature cards' },
            commandGroups: { value: commandGroups, label: 'Command groups' },
            actions: { value: actionCount, label: 'Action commands' },
            topTag: { value: topTechTag, label: 'Top tech tag' },
            theme: { value: activeTheme.charAt(0).toUpperCase() + activeTheme.slice(1), label: 'Theme mode' }
        };
    }

    copyEmail() {
        const emailLink = document.querySelector('.contact-email');
        const emailAddress = emailLink?.getAttribute('href')?.replace('mailto:', '') || 'rayyan.workhost@gmail.com';
        return this.copyText(emailAddress);
    }

    copyText(value) {
        return navigator.clipboard?.writeText(value).catch(() => null);
    }

    focusSearch() {
        this.open();
        this.input.focus();
        this.input.select();
    }

    handleKeyDown(event) {
        if (!this.isOpen()) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            this.setSelectedIndex(Math.min(this.selectedIndex + 1, this.filteredCommands.length - 1));
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            this.setSelectedIndex(Math.max(this.selectedIndex - 1, 0));
            return;
        }

        if (/^[0-9]$/.test(event.key) && event.target === this.input && !event.altKey && !event.ctrlKey && !event.metaKey) {
            const index = event.key === '0' ? 9 : Number(event.key) - 1;
            if (index < this.filteredCommands.length) {
                event.preventDefault();
                this.executeCommand(index);
            }
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            this.executeCommand(this.selectedIndex);
        }
    }

    setSelectedIndex(index) {
        this.selectedIndex = index;
        Array.from(this.list.querySelectorAll('.command-item')).forEach(item => {
            const itemIndex = Number(item.dataset.index);
            const selected = itemIndex === index;
            item.setAttribute('aria-selected', selected ? 'true' : 'false');
            item.classList.toggle('selected', selected);
        });

        const selectedItem = this.list.querySelector(`.command-item[data-index="${index}"]`);
        if (selectedItem) {
            selectedItem.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        }
    }

    executeCommand(index) {
        const command = this.filteredCommands[index];
        if (!command) {
            return;
        }

        command.action();
        this.close();
    }

    navigateTo(hash) {
        const target = document.querySelector(hash);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    }

    dispatchCommand(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.click();
            return true;
        }
        console.warn(`Command target not found: ${elementId}`);
        return false;
    }

    dispatchSelector(selector) {
        let element = document.querySelector(selector);
        if (element) {
            element.click();
            return true;
        }

        if (selector.startsWith('.')) {
            element = document.querySelector(`a[href*="${selector.slice(1)}"]`);
            if (element) {
                element.click();
                return true;
            }
        }

        console.warn(`Selector command target not found: ${selector}`);
        return false;
    }

    openLink(url) {
        window.open(url, '_blank');
    }
}
