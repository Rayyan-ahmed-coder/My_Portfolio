import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import CommandPalette, { MissingPaletteElementsError } from '../../js/modules/commandPalette.js';
import type { Command } from '../../js/core/types.js';
import { stubMatchMedia } from '../helpers.js';

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

const keydown = (target: EventTarget, init: KeyboardEventInit): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
};

const byId = <E extends HTMLElement = HTMLElement>(id: string): E => document.getElementById(id) as E;
const q = <E extends Element = HTMLElement>(selector: string): E => document.querySelector<E>(selector) as E;
const input = (): HTMLInputElement => byId<HTMLInputElement>('command-input');
const commandByTitle = (palette: CommandPalette, title: string): Command =>
    palette.commands.find((command) => command.title === title) as Command;

describe('modules/commandPalette', () => {
    let instances: CommandPalette[] = [];

    /** The palette binds document-level listeners, so every instance is destroyed. */
    const create = (): CommandPalette => {
        const palette = new CommandPalette();
        instances.push(palette);
        return palette;
    };

    beforeEach(() => {
        stubMatchMedia(false);
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.removeAttribute('style');
        document.documentElement.className = '';
        document.body.innerHTML = paletteMarkup + contentMarkup;
        instances = [];
    });

    afterEach(() => {
        instances.splice(0).forEach((palette) => palette.destroy());
    });

    describe('construction', () => {
        it('throws a typed error when a required element is missing', () => {
            byId('command-list').remove();

            expect(() => create()).toThrow(MissingPaletteElementsError);
            expect(() => create()).toThrow(/Command palette elements are missing: list/);
        });

        it('degrades to null via create() instead of throwing', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            byId('command-panel').remove();

            expect(CommandPalette.create()).toBeNull();
            expect(warn).toHaveBeenCalled();
        });

        it('builds a working palette through create()', () => {
            const palette = CommandPalette.create();

            expect(palette).toBeInstanceOf(CommandPalette);
            palette?.destroy();
        });

        it('renders the full command list grouped by category', () => {
            const palette = create();
            const list = byId('command-list');

            expect(list.querySelectorAll('.command-item')).toHaveLength(palette.commands.length);
            const categories = [...list.querySelectorAll('.command-category')].map((el) => el.textContent);
            expect(categories).toEqual([...new Set(palette.commands.map((command) => command.category))]);
        });

        it('reports the result count and preselects the first item', () => {
            const palette = create();

            expect(q('.command-panel-results-title').textContent).toBe(
                `Commands · ${palette.commands.length} results`
            );
            expect(q('.command-item').getAttribute('aria-selected')).toBe('true');
        });

        it('indexes every shortcut in lowercase', () => {
            const palette = create();

            expect(palette.shortcuts.get('1')?.title).toBe('Go to Home');
            expect(palette.shortcuts.get('alt+shift+t')?.title).toBe('Toggle theme');
        });
    });

    describe('open / close', () => {
        it('locks the body, shows the panel and focuses the input', () => {
            const palette = create();

            palette.open();

            expect(document.body.classList.contains('body-locked')).toBe(true);
            expect(byId('command-panel').classList.contains('open')).toBe(true);
            expect(byId('command-panel').getAttribute('aria-hidden')).toBe('false');
            expect(document.activeElement).toBe(input());
            expect(palette.isOpen()).toBe(true);
        });

        it('clears a stale query when reopening', () => {
            const palette = create();
            palette.open();
            input().value = 'theme';
            palette.filterCommands();
            palette.close();

            palette.open();

            expect(input().value).toBe('');
            expect(palette.filteredCommands).toHaveLength(palette.commands.length);
        });

        it('unlocks the body and returns focus to the toggle on close', () => {
            const palette = create();
            palette.open();

            palette.close();

            expect(document.body.classList.contains('body-locked')).toBe(false);
            expect(byId('command-panel').getAttribute('aria-hidden')).toBe('true');
            expect(document.activeElement).toBe(byId('command-toggle'));
            expect(palette.isOpen()).toBe(false);
        });

        it('opens from the toggle, closes from the close button and toggles with Ctrl+K', () => {
            const palette = create();

            byId('command-toggle').click();
            expect(palette.isOpen()).toBe(true);

            byId('command-close').click();
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

            input().click();
            expect(palette.isOpen()).toBe(true);

            byId('command-panel').click();
            expect(palette.isOpen()).toBe(false);
        });
    });

    describe('filtering', () => {
        it('matches on title, subtitle and category', () => {
            const palette = create();

            input().value = 'clipboard';
            palette.filterCommands();
            expect(palette.filteredCommands.map((command) => command.title)).toEqual([
                'Copy email address',
                'Copy creator name',
            ]);

            input().value = 'accessibility';
            palette.filterCommands();
            expect(palette.filteredCommands.every((command) => command.category === 'Accessibility')).toBe(true);
        });

        it('is case and whitespace insensitive', () => {
            const palette = create();
            input().value = '  ToGgLe ThEmE  ';

            palette.filterCommands();

            expect(palette.filteredCommands[0]?.title).toBe('Toggle theme');
        });

        it('renders an empty state for a query with no matches', () => {
            const palette = create();
            input().value = 'zzzz-nothing';

            palette.filterCommands();

            expect(q('.command-item.empty').textContent).toBe('No matching commands');
            expect(q('.command-panel-results-title').textContent).toBe('Commands · 0 results');
        });

        it('uses the singular result label for a single match', () => {
            const palette = create();
            input().value = 'Print page';

            palette.filterCommands();

            expect(q('.command-panel-results-title').textContent).toBe('Commands · 1 result');
        });

        it('debounces input events', () => {
            vi.useFakeTimers();
            try {
                const palette = create();
                const filter = vi.spyOn(palette, 'filterCommands');

                input().value = 'a';
                input().dispatchEvent(new Event('input'));
                input().value = 'ab';
                input().dispatchEvent(new Event('input'));
                expect(filter).not.toHaveBeenCalled();

                vi.advanceTimersByTime(120);
                expect(filter).toHaveBeenCalledTimes(1);
            } finally {
                vi.useRealTimers();
            }
        });

        it('cancels a pending filter on destroy', () => {
            vi.useFakeTimers();
            try {
                const palette = new CommandPalette();
                const filter = vi.spyOn(palette, 'filterCommands');

                input().dispatchEvent(new Event('input'));
                palette.destroy();
                vi.advanceTimersByTime(500);

                expect(filter).not.toHaveBeenCalled();
            } finally {
                vi.useRealTimers();
            }
        });

        it('resets the selection to the first result after filtering', () => {
            const palette = create();
            palette.setSelectedIndex(4);

            input().value = 'go to';
            palette.filterCommands();

            expect(palette.selectedIndex).toBe(0);
        });
    });

    describe('keyboard navigation inside the panel', () => {
        it('ignores navigation keys while the panel is closed', () => {
            const palette = create();

            const event = keydown(input(), { key: 'ArrowDown' });

            expect(event.defaultPrevented).toBe(false);
            expect(palette.selectedIndex).toBe(0);
        });

        it('moves the selection with the arrow keys and clamps at both ends', () => {
            const palette = create();
            palette.open();

            keydown(input(), { key: 'ArrowUp' });
            expect(palette.selectedIndex).toBe(0);

            keydown(input(), { key: 'ArrowDown' });
            keydown(input(), { key: 'ArrowDown' });
            expect(palette.selectedIndex).toBe(2);

            keydown(input(), { key: 'ArrowUp' });
            expect(palette.selectedIndex).toBe(1);

            palette.setSelectedIndex(palette.filteredCommands.length - 1);
            keydown(input(), { key: 'ArrowDown' });
            expect(palette.selectedIndex).toBe(palette.filteredCommands.length - 1);
        });

        it('marks only the selected item as selected', () => {
            const palette = create();
            palette.open();

            palette.setSelectedIndex(3);

            const selected = document.querySelectorAll<HTMLElement>('.command-item.selected');
            expect(selected).toHaveLength(1);
            expect(selected[0]?.dataset.index).toBe('3');
            expect(selected[0]?.getAttribute('aria-selected')).toBe('true');
        });

        it('selects the hovered item through the delegated listener', () => {
            const palette = create();
            palette.open();

            q('.command-item[data-index="2"]').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

            expect(palette.selectedIndex).toBe(2);
        });

        it('runs the selected command on Enter and closes the panel', () => {
            const palette = create();
            palette.open();
            palette.setSelectedIndex(1);
            const action = vi.spyOn(palette.filteredCommands[1] as Command, 'action');

            keydown(input(), { key: 'Enter' });

            expect(action).toHaveBeenCalledTimes(1);
            expect(palette.isOpen()).toBe(false);
        });

        it('runs a command by clicking it', () => {
            const palette = create();
            palette.open();
            const action = vi.spyOn(palette.filteredCommands[0] as Command, 'action');

            q<HTMLElement>('.command-item[data-index="0"]').click();

            expect(action).toHaveBeenCalledTimes(1);
        });

        it('maps digits typed in the input to the nth result, with 0 as the tenth', () => {
            const palette = create();
            palette.open();
            const third = vi.spyOn(palette.filteredCommands[2] as Command, 'action');
            const tenth = vi.spyOn(palette.filteredCommands[9] as Command, 'action');

            // Focus matters: an unfocused input would let the document level
            // single-key shortcut handler run the same command a second time.
            input().focus();

            // Digits only map to results when the event originates in the input.
            palette.handleKeyDown(new KeyboardEvent('keydown', { key: '3', cancelable: true }));
            expect(third).not.toHaveBeenCalled();

            input().dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true, cancelable: true }));
            expect(third).toHaveBeenCalledTimes(1);

            palette.open();
            input().dispatchEvent(new KeyboardEvent('keydown', { key: '0', bubbles: true, cancelable: true }));
            expect(tenth).toHaveBeenCalledTimes(1);
        });

        it('ignores digits that point past the end of the results', () => {
            const palette = create();
            palette.open();
            input().value = 'Print page';
            palette.filterCommands();

            const event = keydown(input(), { key: '5' });

            expect(event.defaultPrevented).toBe(false);
            expect(palette.isOpen()).toBe(true);
        });

        it('does nothing for an out-of-range command index', () => {
            const palette = create();
            palette.open();

            palette.executeCommand(999);

            expect(palette.isOpen()).toBe(true);
        });

        it('reports a failing command instead of propagating', () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const palette = create();
            palette.open();
            vi.spyOn(palette.filteredCommands[0] as Command, 'action').mockImplementation(() => {
                throw new Error('boom');
            });

            expect(() => palette.executeCommand(0)).not.toThrow();
            expect(error).toHaveBeenCalled();
            expect(palette.isOpen()).toBe(false);
        });

        it('reports a rejected async command', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const palette = create();
            palette.open();
            vi.spyOn(palette.filteredCommands[0] as Command, 'action').mockResolvedValue(
                Promise.reject(new Error('async boom'))
            );

            palette.executeCommand(0);
            await Promise.resolve();
            await Promise.resolve();

            expect(error).toHaveBeenCalled();
        });
    });

    describe('global shortcuts', () => {
        it('runs Alt+Shift combos', () => {
            const palette = create();
            const action = vi.spyOn(palette.shortcuts.get('alt+shift+t') as Command, 'action');

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
            const action = vi.spyOn(palette.shortcuts.get('f') as Command, 'action');

            keydown(document, { key: 'f' });

            expect(action).toHaveBeenCalledTimes(1);
        });

        it('ignores single-key shortcuts while typing in a field', () => {
            const palette = create();
            const action = vi.spyOn(palette.shortcuts.get('f') as Command, 'action');
            input().focus();

            keydown(input(), { key: 'f' });

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
            const target = byId('work');
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
            q('[data-filter="web"]').addEventListener('click', clicked);

            expect(palette.dispatchSelector('[data-filter="web"]')).toBe(true);
            expect(clicked).toHaveBeenCalledTimes(1);
        });

        it('falls back to a link whose href contains the class name', () => {
            const palette = create();
            const link = q<HTMLAnchorElement>('.contact-email');
            link.className = '';
            link.setAttribute('href', 'mailto:contact-email@example.com');
            const clicked = vi.fn((event: Event) => event.preventDefault());
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

        it('opens links in a new tab without leaking the opener', () => {
            const open = vi.fn();
            vi.stubGlobal('open', open);
            window.open = open as unknown as typeof window.open;
            const palette = create();

            palette.openLink('/resume.pdf');

            expect(open).toHaveBeenCalledWith('/resume.pdf', '_blank', 'noopener,noreferrer');
        });

        it('copies the contact email from the mailto link', async () => {
            const writeText = vi.fn<(value: string) => Promise<void>>().mockResolvedValue(undefined);
            vi.stubGlobal('navigator', { clipboard: { writeText } });
            const palette = create();

            await palette.copyEmail();

            expect(writeText).toHaveBeenCalledWith('hello@example.com');
        });

        it('falls back to a placeholder address when no contact link exists', async () => {
            const writeText = vi.fn<(value: string) => Promise<void>>().mockResolvedValue(undefined);
            vi.stubGlobal('navigator', { clipboard: { writeText } });
            q('.contact-email').remove();
            const palette = create();

            await palette.copyEmail();

            expect(writeText).toHaveBeenCalledWith('rayyan.workhost@gmail.com');
        });

        it('swallows clipboard rejections', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            vi.stubGlobal('navigator', {
                clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
            });
            const palette = create();

            await expect(palette.copyText('text')).resolves.toBeNull();
            expect(warn).toHaveBeenCalled();
        });

        it('resolves without writing when the Clipboard API is unavailable', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            vi.stubGlobal('navigator', {});
            const palette = create();

            await expect(palette.copyText('text')).resolves.toBeNull();
            expect(warn).toHaveBeenCalled();
        });

        it('opens the panel and selects the query when focusing search', () => {
            const palette = create();
            const select = vi.spyOn(input(), 'select');

            palette.focusSearch();

            expect(palette.isOpen()).toBe(true);
            expect(select).toHaveBeenCalled();
        });
    });

    describe('the shipped command set', () => {
        let stopNavigation: (event: Event) => void;

        beforeEach(() => {
            vi.stubGlobal('open', vi.fn());
            vi.stubGlobal('print', vi.fn());
            vi.stubGlobal('scrollTo', vi.fn());
            vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
            window.open = vi.fn() as unknown as typeof window.open;
            window.print = vi.fn();
            window.scrollTo = vi.fn();
            // Commands that click mailto links would make jsdom attempt a real navigation.
            stopNavigation = (event: Event): void => event.preventDefault();
            document.addEventListener('click', stopNavigation);
        });

        afterEach(() => {
            document.removeEventListener('click', stopNavigation);
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
            const titles = palette.commands.map((command) => command.title);
            const shortcuts = palette.commands.map((command) => command.shortcut?.toLowerCase() ?? '');

            expect(new Set(titles).size).toBe(titles.length);
            expect(shortcuts.every(Boolean)).toBe(true);
            expect(new Set(shortcuts).size).toBe(shortcuts.length);
        });

        it('toggles the accessibility helpers on the root element', () => {
            const palette = create();
            const run = (title: string): void => void commandByTitle(palette, title).action();

            run('Toggle animations');
            expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);

            run('Toggle high contrast');
            expect(document.documentElement.classList.contains('high-contrast')).toBe(true);

            run('Toggle animations');
            expect(document.documentElement.classList.contains('reduced-motion')).toBe(false);
        });

        it('steps the root font size up and down with a lower bound', () => {
            const palette = create();
            const run = (title: string): void => void commandByTitle(palette, title).action();
            const computed = vi
                .spyOn(window, 'getComputedStyle')
                .mockReturnValue({ fontSize: '16px', getPropertyValue: () => '' } as unknown as CSSStyleDeclaration);

            run('Increase text size');
            expect(document.documentElement.style.fontSize).toBe('17px');

            run('Decrease text size');
            expect(document.documentElement.style.fontSize).toBe('15px');

            computed.mockReturnValue({
                fontSize: '10px',
                getPropertyValue: () => '',
            } as unknown as CSSStyleDeclaration);
            run('Decrease text size');
            expect(document.documentElement.style.fontSize).toBe('12px');
        });

        it('scrolls to the top and bottom of the page', () => {
            const palette = create();
            const run = (title: string): void => void commandByTitle(palette, title).action();

            run('Scroll to top');
            expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

            run('Scroll to bottom');
            expect(window.scrollTo).toHaveBeenCalledWith({ top: document.body.scrollHeight, behavior: 'smooth' });
        });

        it('opens the print dialog', () => {
            const palette = create();

            void commandByTitle(palette, 'Print page').action();

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

        it('memoises the snapshot until it is invalidated', () => {
            const palette = create();
            const first = palette.getAnalyticsData();

            expect(palette.getAnalyticsData()).toBe(first);

            palette.invalidateAnalytics();
            expect(palette.getAnalyticsData()).not.toBe(first);
        });

        it('drops the memoised snapshot when new content is loaded', () => {
            const palette = create();
            const first = palette.getAnalyticsData();

            document.dispatchEvent(new CustomEvent('content:loaded', { detail: { count: 3 } }));

            expect(palette.getAnalyticsData()).not.toBe(first);
        });

        it('falls back to the nav link count when there are no sections', () => {
            document.querySelectorAll('section[id]').forEach((section) => section.remove());

            expect(create().getAnalyticsData().sections.value).toBe(2);
        });

        it('reports the theme from the document, falling back to the OS preference', () => {
            document.documentElement.dataset.theme = 'dark';
            expect(create().getAnalyticsData().theme.value).toBe('Dark');

            document.documentElement.removeAttribute('data-theme');
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
            expect(cards.some((card) => card.textContent?.includes('Projects featured'))).toBe(true);
        });

        it('skips zero-valued and "None" metrics', () => {
            byId('projects-grid').innerHTML = '';
            document.querySelectorAll('.feature-card, .skill-row').forEach((el) => el.remove());

            create();
            const text = byId('command-analytics').textContent ?? '';

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
            expect(byId('command-summary').textContent).toContain(summary.title);
        });
    });

    describe('destroy()', () => {
        it('detaches the document and element listeners', () => {
            const palette = new CommandPalette();

            palette.destroy();

            keydown(document, { key: 'k', ctrlKey: true });
            byId('command-toggle').click();
            expect(palette.isOpen()).toBe(false);
        });
    });
});
