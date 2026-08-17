import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CommandPalette from '../../js/modules/commandPalette.js';
import { stubMatchMedia, trackDocumentListeners } from '../helpers.js';

const paletteMarkup = `
    <button id="command-toggle">Open</button>
    <div id="command-panel" aria-hidden="true">
        <div class="command-panel-meta"></div>
        <input id="command-input" />
        <button id="command-close">Close</button>
        <div id="command-analytics"></div>
        <div id="command-summary"></div>
        <p class="command-panel-results-title"></p>
        <div id="command-list"></div>
    </div>
`;

const contentMarkup = `
    <section id="home"></section>
    <section id="work"></section>
    <a class="nav-link" href="#home">Home</a>
    <a class="nav-link" href="#work">Work</a>
    <button class="filter-button" data-filter="all"></button>
    <button class="filter-button" data-filter="web"></button>
    <div class="feature-card"></div>
    <div class="feature-card"></div>
    <div class="skill-row"></div>
    <a class="contact-email" href="mailto:hello@example.com">Email</a>
    <div id="projects-grid">
        <article class="project-card" data-category="web js">
            <div class="project-tags"><span>JS</span><span>CSS</span></div>
        </article>
        <article class="project-card" data-category="game">
            <div class="project-tags"><span>JS</span></div>
        </article>
    </div>
`;

const keydown = (target, init) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
};

describe('modules/commandPalette', () => {
    let listeners;

    beforeEach(() => {
        stubMatchMedia(false);
        document.body.innerHTML = paletteMarkup + contentMarkup;
        listeners = trackDocumentListeners();
    });

    afterEach(() => {
        listeners.detachAll();
    });

    const create = () => new CommandPalette();

    describe('construction', () => {
        it('throws when a required element is missing', () => {
            document.getElementById('command-list').remove();

            expect(() => create()).toThrow(/Command palette elements are missing/);
        });

        it('renders the full command list grouped by category', () => {
            const palette = create();
            const list = document.getElementById('command-list');

            expect(list.querySelectorAll('.command-item')).toHaveLength(palette.commands.length);
            const categories = [...list.querySelectorAll('.command-category')].map((el) => el.textContent);
            expect(categories).toEqual([...new Set(palette.commands.map((cmd) => cmd.category))]);
        });

        it('reports the result count and preselects the first item', () => {
            const palette = create();

            expect(document.querySelector('.command-panel-results-title').textContent).toBe(
                `Commands · ${palette.commands.length} results`
            );
            expect(document.querySelector('.command-item').getAttribute('aria-selected')).toBe('true');
        });

        it('indexes every shortcut in lowercase', () => {
            const palette = create();

            expect(palette.shortcutMap.get('1').title).toBe('Go to Home');
            expect(palette.shortcutMap.get('alt+shift+t').title).toBe('Toggle theme');
        });
    });

    describe('open / close', () => {
        it('locks the body, shows the panel and focuses the input', () => {
            const palette = create();

            palette.open();

            expect(document.body.classList.contains('body-locked')).toBe(true);
            expect(document.getElementById('command-panel').classList.contains('open')).toBe(true);
            expect(document.getElementById('command-panel').getAttribute('aria-hidden')).toBe('false');
            expect(document.activeElement).toBe(document.getElementById('command-input'));
            expect(palette.isOpen()).toBe(true);
        });

        it('clears a stale query when reopening', () => {
            const palette = create();
            palette.open();
            document.getElementById('command-input').value = 'theme';
            palette.filterCommands();
            palette.close();

            palette.open();

            expect(document.getElementById('command-input').value).toBe('');
            expect(palette.filteredCommands).toHaveLength(palette.commands.length);
        });

        it('unlocks the body and returns focus to the toggle on close', () => {
            const palette = create();
            palette.open();

            palette.close();

            expect(document.body.classList.contains('body-locked')).toBe(false);
            expect(document.getElementById('command-panel').getAttribute('aria-hidden')).toBe('true');
            expect(document.activeElement).toBe(document.getElementById('command-toggle'));
            expect(palette.isOpen()).toBe(false);
        });

        it('toggles from the toggle button, the close button and Ctrl+K', () => {
            const palette = create();

            document.getElementById('command-toggle').click();
            expect(palette.isOpen()).toBe(true);

            document.getElementById('command-close').click();
            expect(palette.isOpen()).toBe(false);

            keydown(document, { key: 'k', ctrlKey: true });
            expect(palette.isOpen()).toBe(true);

            keydown(document, { key: 'K', metaKey: true });
            expect(palette.isOpen()).toBe(false);
        });

        it('closes on Escape only while open', () => {
            const palette = create();

            const ignored = keydown(document, { key: 'Escape' });
            expect(ignored.defaultPrevented).toBe(false);

            palette.open();
            const handled = keydown(document, { key: 'Escape' });

            expect(handled.defaultPrevented).toBe(true);
            expect(palette.isOpen()).toBe(false);
        });

        it('closes when clicking the panel backdrop but not its content', () => {
            const palette = create();
            palette.open();

            document.getElementById('command-input').click();
            expect(palette.isOpen()).toBe(true);

            document.getElementById('command-panel').click();
            expect(palette.isOpen()).toBe(false);
        });
    });

    describe('filtering', () => {
        it('matches on title, subtitle and category', () => {
            const palette = create();
            const input = document.getElementById('command-input');

            input.value = 'clipboard';
            palette.filterCommands();
            expect(palette.filteredCommands.map((cmd) => cmd.title)).toEqual([
                'Copy email address',
                'Copy creator name',
            ]);

            input.value = 'accessibility';
            palette.filterCommands();
            expect(palette.filteredCommands.every((cmd) => cmd.category === 'Accessibility')).toBe(true);
        });

        it('is case and whitespace insensitive', () => {
            const palette = create();
            document.getElementById('command-input').value = '  ToGgLe ThEmE  ';

            palette.filterCommands();

            expect(palette.filteredCommands[0].title).toBe('Toggle theme');
        });

        it('renders an empty state for a query with no matches', () => {
            const palette = create();
            document.getElementById('command-input').value = 'zzzz-nothing';

            palette.filterCommands();

            expect(document.querySelector('.command-item.empty').textContent).toBe('No matching commands');
            expect(document.querySelector('.command-panel-results-title').textContent).toBe('Commands · 0 results');
        });

        it('uses the singular result label for a single match', () => {
            const palette = create();
            document.getElementById('command-input').value = 'Print page';

            palette.filterCommands();

            expect(document.querySelector('.command-panel-results-title').textContent).toBe('Commands · 1 result');
        });

        it('debounces input events', () => {
            vi.useFakeTimers();
            const palette = create();
            const filter = vi.spyOn(palette, 'filterCommands');
            const input = document.getElementById('command-input');

            input.value = 'a';
            input.dispatchEvent(new Event('input'));
            input.value = 'ab';
            input.dispatchEvent(new Event('input'));
            expect(filter).not.toHaveBeenCalled();

            vi.advanceTimersByTime(120);
            expect(filter).toHaveBeenCalledTimes(1);
            vi.useRealTimers();
        });

        it('resets the selection to the first result after filtering', () => {
            const palette = create();
            palette.setSelectedIndex(4);

            document.getElementById('command-input').value = 'go to';
            palette.filterCommands();

            expect(palette.selectedIndex).toBe(0);
        });
    });

    describe('keyboard navigation inside the panel', () => {
        it('ignores navigation keys while the panel is closed', () => {
            const palette = create();

            const event = keydown(document.getElementById('command-input'), { key: 'ArrowDown' });

            expect(event.defaultPrevented).toBe(false);
            expect(palette.selectedIndex).toBe(0);
        });

        it('moves the selection with the arrow keys and clamps at both ends', () => {
            const palette = create();
            palette.open();
            const input = document.getElementById('command-input');

            keydown(input, { key: 'ArrowUp' });
            expect(palette.selectedIndex).toBe(0);

            keydown(input, { key: 'ArrowDown' });
            keydown(input, { key: 'ArrowDown' });
            expect(palette.selectedIndex).toBe(2);

            keydown(input, { key: 'ArrowUp' });
            expect(palette.selectedIndex).toBe(1);

            palette.setSelectedIndex(palette.filteredCommands.length - 1);
            keydown(input, { key: 'ArrowDown' });
            expect(palette.selectedIndex).toBe(palette.filteredCommands.length - 1);
        });

        it('marks only the selected item as selected', () => {
            const palette = create();
            palette.open();

            palette.setSelectedIndex(3);

            const selected = document.querySelectorAll('.command-item.selected');
            expect(selected).toHaveLength(1);
            expect(selected[0].dataset.index).toBe('3');
            expect(selected[0].getAttribute('aria-selected')).toBe('true');
        });

        it('selects the hovered item', () => {
            const palette = create();
            palette.open();

            document
                .querySelector('.command-item[data-index="2"]')
                .dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

            expect(palette.selectedIndex).toBe(2);
        });

        it('runs the selected command on Enter and closes the panel', () => {
            const palette = create();
            palette.open();
            palette.setSelectedIndex(1);
            const action = vi.spyOn(palette.filteredCommands[1], 'action');

            keydown(document.getElementById('command-input'), { key: 'Enter' });

            expect(action).toHaveBeenCalledTimes(1);
            expect(palette.isOpen()).toBe(false);
        });

        it('runs a command by clicking it', () => {
            const palette = create();
            palette.open();
            const action = vi.spyOn(palette.filteredCommands[0], 'action');

            document.querySelector('.command-item[data-index="0"]').click();

            expect(action).toHaveBeenCalledTimes(1);
        });

        it('maps digits typed in the input to the nth result, with 0 as the tenth', () => {
            const palette = create();
            palette.open();
            const input = document.getElementById('command-input');
            // handleKeyDown is called directly: dispatching on the input would also
            // reach the document level single-key shortcut handler.
            palette.filteredCommands = Array.from({ length: 10 }, (_, index) => ({
                title: `Fake ${index}`,
                action: vi.fn(),
            }));

            palette.handleKeyDown({ key: '3', target: input, preventDefault() {} });
            expect(palette.filteredCommands[2].action).toHaveBeenCalledTimes(1);

            palette.open();
            palette.filteredCommands = Array.from({ length: 10 }, (_, index) => ({
                title: `Fake ${index}`,
                action: vi.fn(),
            }));
            palette.handleKeyDown({ key: '0', target: input, preventDefault() {} });
            expect(palette.filteredCommands[9].action).toHaveBeenCalledTimes(1);
        });

        it('ignores digits that point past the end of the results', () => {
            const palette = create();
            palette.open();
            document.getElementById('command-input').value = 'Print page';
            palette.filterCommands();

            const event = keydown(document.getElementById('command-input'), { key: '5' });

            expect(event.defaultPrevented).toBe(false);
            expect(palette.isOpen()).toBe(true);
        });

        it('does nothing for an out-of-range command index', () => {
            const palette = create();
            palette.open();

            palette.executeCommand(999);

            expect(palette.isOpen()).toBe(true);
        });
    });

    describe('global shortcuts', () => {
        it('runs Alt+Shift combos', () => {
            const palette = create();
            const command = palette.shortcutMap.get('alt+shift+t');
            const action = vi.spyOn(command, 'action');

            const event = keydown(document, { key: 't', altKey: true, shiftKey: true });

            expect(action).toHaveBeenCalledTimes(1);
            expect(event.defaultPrevented).toBe(true);
        });

        it('ignores unmapped Alt+Shift combos', () => {
            create();

            const event = keydown(document, { key: 'q', altKey: true, shiftKey: true });

            expect(event.defaultPrevented).toBe(false);
        });

        it('runs single-key shortcuts when not typing', () => {
            const palette = create();
            const action = vi.spyOn(palette.shortcutMap.get('f'), 'action');

            keydown(document, { key: 'f' });

            expect(action).toHaveBeenCalledTimes(1);
        });

        it('ignores single-key shortcuts while typing in a field', () => {
            const palette = create();
            const action = vi.spyOn(palette.shortcutMap.get('f'), 'action');
            document.getElementById('command-input').focus();

            keydown(document.getElementById('command-input'), { key: 'f' });

            expect(action).not.toHaveBeenCalled();
        });

        it('ignores non-alphanumeric keys and unmapped letters', () => {
            create();

            expect(keydown(document, { key: '-' }).defaultPrevented).toBe(false);
            expect(keydown(document, { key: 'z' }).defaultPrevented).toBe(false);
        });
    });

    describe('command actions', () => {
        it('navigates to an existing section', () => {
            const palette = create();
            const target = document.getElementById('work');
            target.scrollIntoView = vi.fn();

            palette.navigateTo('#work');

            expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
        });

        it('ignores navigation to a missing section', () => {
            const palette = create();

            expect(() => palette.navigateTo('#nowhere')).not.toThrow();
        });

        it('clicks a command target by id', () => {
            const palette = create();
            const button = document.createElement('button');
            button.id = 'menu-toggle';
            const clicked = vi.fn();
            button.addEventListener('click', clicked);
            document.body.appendChild(button);

            expect(palette.dispatchCommand('menu-toggle')).toBe(true);
            expect(clicked).toHaveBeenCalledTimes(1);
        });

        it('warns when a command target id is missing', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const palette = create();

            expect(palette.dispatchCommand('does-not-exist')).toBe(false);
            expect(warn).toHaveBeenCalled();
        });

        it('clicks a command target by selector', () => {
            const palette = create();
            const clicked = vi.fn();
            document.querySelector('[data-filter="web"]').addEventListener('click', clicked);

            expect(palette.dispatchSelector('[data-filter="web"]')).toBe(true);
            expect(clicked).toHaveBeenCalledTimes(1);
        });

        it('falls back to a link whose href contains the class name', () => {
            const palette = create();
            const link = document.querySelector('.contact-email');
            link.className = '';
            link.setAttribute('href', 'mailto:contact-email@example.com');
            const clicked = vi.fn((event) => event.preventDefault());
            link.addEventListener('click', clicked);

            expect(palette.dispatchSelector('.contact-email')).toBe(true);
            expect(clicked).toHaveBeenCalledTimes(1);
        });

        it('warns when no selector target can be resolved', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const palette = create();

            expect(palette.dispatchSelector('.nope')).toBe(false);
            expect(warn).toHaveBeenCalled();
        });

        it('opens links in a new tab', () => {
            const open = vi.fn();
            vi.stubGlobal('open', open);
            window.open = open;
            const palette = create();

            palette.openLink('/resume.pdf');

            expect(open).toHaveBeenCalledWith('/resume.pdf', '_blank');
        });

        it('copies the contact email from the mailto link', async () => {
            const writeText = vi.fn().mockResolvedValue(undefined);
            vi.stubGlobal('navigator', { clipboard: { writeText } });
            const palette = create();

            await palette.copyEmail();

            expect(writeText).toHaveBeenCalledWith('hello@example.com');
        });

        it('falls back to a placeholder address when no contact link exists', async () => {
            const writeText = vi.fn().mockResolvedValue(undefined);
            vi.stubGlobal('navigator', { clipboard: { writeText } });
            document.querySelector('.contact-email').remove();
            const palette = create();

            await palette.copyEmail();

            expect(writeText).toHaveBeenCalledWith('rayyan.workhost@gmail.com');
        });

        it('swallows clipboard rejections', async () => {
            vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
            const palette = create();

            await expect(palette.copyText('text')).resolves.toBeNull();
        });

        it('does nothing when the Clipboard API is unavailable', () => {
            vi.stubGlobal('navigator', {});
            const palette = create();

            expect(palette.copyText('text')).toBeUndefined();
        });

        it('opens the panel and selects the query when focusing search', () => {
            const palette = create();
            const select = vi.spyOn(document.getElementById('command-input'), 'select');

            palette.focusSearch();

            expect(palette.isOpen()).toBe(true);
            expect(select).toHaveBeenCalled();
        });
    });

    describe('the shipped command set', () => {
        beforeEach(() => {
            vi.stubGlobal('open', vi.fn());
            vi.stubGlobal('print', vi.fn());
            vi.stubGlobal('scrollTo', vi.fn());
            vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
            window.open = vi.fn();
            window.print = vi.fn();
            window.scrollTo = vi.fn();
            // Commands that click mailto links would make jsdom attempt a real navigation.
            document.addEventListener('click', (event) => event.preventDefault());
        });

        it('runs every action without throwing', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const palette = create();

            palette.commands.forEach((command) => {
                expect(() => command.action(), `command "${command.title}" threw`).not.toThrow();
            });

            expect(warn.mock.calls.length).toBeLessThanOrEqual(palette.commands.length);
        });

        it('gives every command a unique title and shortcut', () => {
            const palette = create();
            const titles = palette.commands.map((cmd) => cmd.title);
            const shortcuts = palette.commands.map((cmd) => cmd.shortcut.toLowerCase());

            expect(new Set(titles).size).toBe(titles.length);
            expect(new Set(shortcuts).size).toBe(shortcuts.length);
        });

        it('toggles the accessibility helpers on the root element', () => {
            const palette = create();
            const run = (title) => palette.commands.find((cmd) => cmd.title === title).action();

            run('Toggle animations');
            expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);

            run('Toggle high contrast');
            expect(document.documentElement.classList.contains('high-contrast')).toBe(true);

            run('Toggle animations');
            expect(document.documentElement.classList.contains('reduced-motion')).toBe(false);
        });

        it('steps the root font size up and down with a lower bound', () => {
            const palette = create();
            const run = (title) => palette.commands.find((cmd) => cmd.title === title).action();
            vi.spyOn(window, 'getComputedStyle').mockReturnValue({ fontSize: '16px', getPropertyValue: () => '' });

            run('Increase text size');
            expect(document.documentElement.style.fontSize).toBe('17px');

            run('Decrease text size');
            expect(document.documentElement.style.fontSize).toBe('15px');

            window.getComputedStyle.mockReturnValue({ fontSize: '10px', getPropertyValue: () => '' });
            run('Decrease text size');
            expect(document.documentElement.style.fontSize).toBe('12px');
        });

        it('scrolls to the top and bottom of the page', () => {
            const palette = create();
            const run = (title) => palette.commands.find((cmd) => cmd.title === title).action();

            run('Scroll to top');
            expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

            run('Scroll to bottom');
            expect(window.scrollTo).toHaveBeenCalledWith({ top: document.body.scrollHeight, behavior: 'smooth' });
        });

        it('opens the print dialog', () => {
            const palette = create();

            palette.commands.find((cmd) => cmd.title === 'Print page').action();

            expect(window.print).toHaveBeenCalledTimes(1);
        });
    });

    describe('analytics', () => {
        it('derives counts from the rendered page', () => {
            const data = create().getAnalyticsData();

            expect(data.projects.value).toBe(2);
            expect(data.categories.value).toBe(3);
            expect(data.techTags.value).toBe(2);
            expect(data.sections.value).toBe(2);
            expect(data.skills.value).toBe(1);
            expect(data.features.value).toBe(2);
            expect(data.topTag.value).toBe('JS');
        });

        it('falls back to the nav link count when there are no sections', () => {
            document.querySelectorAll('section[id]').forEach((section) => section.remove());

            expect(create().getAnalyticsData().sections.value).toBe(2);
        });

        it('reports the theme from the document, falling back to the OS preference', () => {
            document.documentElement.dataset.theme = 'dark';
            expect(create().getAnalyticsData().theme.value).toBe('Dark');

            document.documentElement.removeAttribute('data-theme');
            stubMatchMedia({ '(prefers-color-scheme: dark)': true });
            expect(create().getAnalyticsData().theme.value).toBe('Dark');

            stubMatchMedia(false);
            expect(create().getAnalyticsData().theme.value).toBe('Light');
        });

        it('reports "None" as the top tag when no project tags exist', () => {
            document.querySelectorAll('.project-tags').forEach((tags) => tags.remove());

            expect(create().getAnalyticsData().topTag.value).toBe('None');
        });

        it('renders a stat card per non-empty metric', () => {
            create();
            const cards = [...document.querySelectorAll('#command-analytics .command-stat')];

            expect(cards.length).toBeGreaterThan(0);
            expect(cards.some((card) => card.textContent.includes('Projects featured'))).toBe(true);
        });

        it('skips zero-valued and "None" metrics', () => {
            document.getElementById('projects-grid').innerHTML = '';
            document.querySelectorAll('.feature-card, .skill-row').forEach((el) => el.remove());

            create();
            const text = document.getElementById('command-analytics').textContent;

            expect(text).not.toContain('Projects featured');
            expect(text).not.toContain('Feature cards');
            expect(text).not.toContain('Top tech tag');
        });

        it('renders the meta chips including the command count', () => {
            const palette = create();
            const chips = [...document.querySelectorAll('.command-panel-meta .command-chip')].map(
                (chip) => chip.textContent
            );

            expect(chips).toHaveLength(5);
            expect(chips[0]).toBe('Ctrl + K · Open palette');
            expect(chips.at(-1)).toBe(`${palette.commands.length} · Commands`);
        });

        it('summarizes the page snapshot', () => {
            const palette = create();
            const summary = palette.getSummaryData();

            expect(summary.title).toBe(`Live portfolio snapshot • ${palette.commands.length} commands ready`);
            expect(summary.description).toContain('2 projects');
            expect(summary.description).toContain('3 categories');
            expect(document.getElementById('command-summary').textContent).toContain(summary.title);
        });
    });
});
