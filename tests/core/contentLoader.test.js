import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoadContent from '../../js/core/contentLoader.js';
import { stubIntersectionObserver, stubAnimationFrame } from '../helpers.js';

const gridMarkup = '<section><div id="projects-grid"></div></section>';

const project = (overrides = {}) => ({
    number: 1,
    type: 'Web App',
    category: 'Web',
    link: 'https://example.com/app',
    target: '_blank',
    preFetch: true,
    tags: ['JS', 'CSS'],
    preview: ['Preview', 'Title'],
    content: { heading: 'Example', description: 'A description' },
    ...overrides,
});

/** Mocks fetch and returns the JSON payload responder. */
function stubFetch(payload, { ok = true, status = 200 } = {}) {
    const fetchMock = vi.fn(() =>
        Promise.resolve({
            ok,
            status,
            json: () => Promise.resolve(payload),
        })
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

/** Constructs a loader without letting the lazy IntersectionObserver fire. */
function createLoader() {
    stubIntersectionObserver();
    return new LoadContent();
}

describe('core/contentLoader', () => {
    beforeEach(() => {
        vi.stubGlobal('requestIdleCallback', (cb) => cb());
    });

    describe('init()', () => {
        it('logs an error and stops when the grid is missing', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const fetchMock = stubFetch([]);
            stubIntersectionObserver();

            new LoadContent();
            await vi.waitFor(() => expect(error).toHaveBeenCalled());

            expect(error.mock.calls[0][0]).toMatch(/#projects-grid/);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('observes the closest section and loads once it intersects', async () => {
            document.body.innerHTML = gridMarkup;
            const fetchMock = stubFetch([project()]);
            const observers = stubIntersectionObserver();

            new LoadContent();

            expect(observers.last.observed).toEqual([document.querySelector('section')]);
            expect(fetchMock).not.toHaveBeenCalled();

            observers.last.trigger([{ target: document.querySelector('section') }]);

            await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
            expect(observers.last.disconnected).toBe(true);
        });

        it('does not load while the grid stays out of view', () => {
            document.body.innerHTML = gridMarkup;
            const fetchMock = stubFetch([project()]);
            const observers = stubIntersectionObserver();

            new LoadContent();
            observers.last.trigger([{ target: document.querySelector('section'), isIntersecting: false }]);

            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('observes the grid itself when it has no section ancestor', () => {
            document.body.innerHTML = '<div id="projects-grid"></div>';
            stubFetch([]);
            const observers = stubIntersectionObserver();

            new LoadContent();

            expect(observers.last.observed).toEqual([document.getElementById('projects-grid')]);
        });

        it('loads eagerly when IntersectionObserver is unavailable', async () => {
            document.body.innerHTML = gridMarkup;
            const fetchMock = stubFetch([project()]);
            delete window.IntersectionObserver;
            delete globalThis.IntersectionObserver;

            new LoadContent();

            await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        });
    });

    describe('loadProjects()', () => {
        beforeEach(() => {
            document.body.innerHTML = gridMarkup;
        });

        it('requests the project JSON from cache with an Accept header', async () => {
            const fetchMock = stubFetch([project()]);
            await createLoader().loadProjects();

            expect(fetchMock).toHaveBeenCalledWith(
                'js/JSON/projects.json',
                expect.objectContaining({
                    cache: 'force-cache',
                    headers: { Accept: 'application/json' },
                })
            );
        });

        it('renders one card per project and dispatches content:loaded', async () => {
            stubFetch([project(), project({ number: 2, content: { heading: 'Second' } })]);
            const listener = vi.fn();
            document.addEventListener('content:loaded', listener);

            await createLoader().loadProjects();

            expect(document.querySelectorAll('.project-card')).toHaveLength(2);
            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener.mock.calls[0][0].detail).toEqual({ count: 2 });
        });

        it('replaces previously rendered content instead of appending', async () => {
            stubFetch([project()]);
            const loader = createLoader();

            await loader.loadProjects();
            await loader.loadProjects();

            expect(document.querySelectorAll('.project-card')).toHaveLength(1);
        });

        it('shows an empty state for an empty or malformed payload', async () => {
            stubFetch([]);
            await createLoader().loadProjects();
            expect(document.getElementById('projects-grid').innerHTML).toContain('No Projects Found.');

            document.body.innerHTML = gridMarkup;
            stubFetch({ not: 'an array' });
            await createLoader().loadProjects();
            expect(document.getElementById('projects-grid').innerHTML).toContain('No Projects Found.');
        });

        it('shows an error state on a failed HTTP response', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            stubFetch(null, { ok: false, status: 500 });

            await createLoader().loadProjects();

            expect(document.getElementById('projects-grid').innerHTML).toContain('Failed to Load Projects.');
            expect(error).toHaveBeenCalled();
        });

        it('aborts an in-flight request when called again', async () => {
            const signals = [];
            vi.stubGlobal(
                'fetch',
                vi.fn((_url, options) => {
                    signals.push(options.signal);
                    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([project()]) });
                })
            );
            const loader = createLoader();

            await loader.loadProjects();
            await loader.loadProjects();

            expect(signals[0].aborted).toBe(true);
            expect(signals[1].aborted).toBe(false);
        });

        it('stays silent when the request is aborted', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
            vi.stubGlobal('fetch', vi.fn(() => Promise.reject(abortError)));

            await createLoader().loadProjects();

            expect(error).not.toHaveBeenCalled();
            expect(document.getElementById('projects-grid').innerHTML).toBe('');
        });
    });

    describe('card markup', () => {
        beforeEach(() => {
            document.body.innerHTML = gridMarkup;
        });

        const renderOne = async (overrides) => {
            stubFetch([project(overrides)]);
            await createLoader().loadProjects();
            return document.querySelector('.project-card');
        };

        it('pads the project number and falls back to "00"', async () => {
            expect((await renderOne({ number: 7 })).querySelector('.project-number').textContent).toBe('07');

            document.body.innerHTML = gridMarkup;
            expect((await renderOne({ number: 'abc' })).querySelector('.project-number').textContent).toBe('00');
        });

        it('normalizes the category onto a lowercase data attribute', async () => {
            const card = await renderOne({ category: '  GameDev  ' });
            expect(card.dataset.category).toBe('gamedev');
        });

        it('marks the featured project with the large card class', async () => {
            const card = await renderOne({ main: true });
            expect(card.classList.contains('project-card-large')).toBe(true);
        });

        it('renders each tag as its own span', async () => {
            const card = await renderOne({ tags: ['Vite', 'Vitest', 'HTML'] });
            expect([...card.querySelectorAll('.project-tags span')].map((el) => el.textContent)).toEqual([
                'Vite',
                'Vitest',
                'HTML',
            ]);
        });

        it('falls back to placeholder copy for missing fields', async () => {
            const card = await renderOne({
                type: undefined,
                link: undefined,
                content: undefined,
                preview: undefined,
                tags: undefined,
                category: undefined,
            });

            expect(card.querySelector('.project-type').textContent).toBe('Type Value not set');
            expect(card.querySelector('h3').textContent).toBe('Untitled Project');
            expect(card.dataset.category).toBe('unknown');
            expect(card.querySelector('.project-link').getAttribute('href')).toBe('#');
            expect(card.querySelectorAll('.project-tags span')).toHaveLength(0);
            expect(card.querySelector('.project-preview-content span').textContent).toBe('Not Defined');
        });

        it('adds noopener noreferrer only for new-tab links', async () => {
            const blank = await renderOne({ target: '_BLANK' });
            expect(blank.querySelector('.project-link').getAttribute('target')).toBe('_blank');
            expect(blank.querySelector('.project-link').getAttribute('rel')).toBe('noopener noreferrer');

            document.body.innerHTML = gridMarkup;
            const self = await renderOne({ target: '_self' });
            expect(self.querySelector('.project-link').getAttribute('target')).toBe('_self');
            expect(self.querySelector('.project-link').getAttribute('rel')).toBeNull();
        });

        it('opts out of prefetching unless preFetch is exactly true', async () => {
            expect((await renderOne({ preFetch: true })).querySelector('.project-link').hasAttribute('prefetch')).toBe(
                false
            );

            document.body.innerHTML = gridMarkup;
            expect((await renderOne({ preFetch: 'yes' })).querySelector('.project-link').getAttribute('prefetch')).toBe(
                'false'
            );
        });

        it('escapes untrusted project content', async () => {
            const card = await renderOne({
                content: { heading: '<img src=x onerror="alert(1)">', description: 'a & b' },
            });

            expect(card.querySelector('h3').querySelector('img')).toBeNull();
            expect(card.querySelector('h3').textContent).toBe('<img src=x onerror="alert(1)">');
            expect(card.querySelectorAll('p')[1].textContent).toBe('a & b');
        });

        it('skips null entries in the payload', async () => {
            stubFetch([null, project()]);
            await createLoader().loadProjects();

            expect(document.querySelectorAll('.project-card')).toHaveLength(1);
        });
    });

    describe('project filters', () => {
        beforeEach(async () => {
            document.body.innerHTML = `
                <button class="filter-button" data-filter="all">All</button>
                <button class="filter-button" data-filter="web">Web</button>
                <button class="filter-button" data-filter="game">Game</button>
                ${gridMarkup}
            `;
            stubAnimationFrame();
            stubFetch([
                project({ number: 1, category: 'Web' }),
                project({ number: 2, category: 'Game' }),
            ]);
            await createLoader().loadProjects();
        });

        const cardCategories = (selector) =>
            [...document.querySelectorAll(selector)].map((card) => card.dataset.category);

        it('hides the cards that do not match the clicked filter', () => {
            document.querySelector('[data-filter="game"]').click();

            expect(cardCategories('.project-card.is-hidden')).toEqual(['web']);
            expect(cardCategories('.project-card:not(.is-hidden)')).toEqual(['game']);
        });

        it('reveals every card again for the "all" filter', () => {
            document.querySelector('[data-filter="game"]').click();
            document.querySelector('[data-filter="all"]').click();

            expect(document.querySelectorAll('.project-card.is-hidden')).toHaveLength(0);
        });

        it('keeps the active class on the clicked button only', () => {
            document.querySelector('[data-filter="web"]').click();
            expect([...document.querySelectorAll('.filter-button.active')].map((b) => b.dataset.filter)).toEqual(['web']);

            document.querySelector('[data-filter="game"]').click();
            expect([...document.querySelectorAll('.filter-button.active')].map((b) => b.dataset.filter)).toEqual(['game']);
        });
    });

    describe('escapeHtml()', () => {
        const loader = Object.create(LoadContent.prototype);

        it.each([
            ['<script>', '&lt;script&gt;'],
            ['a & b', 'a &amp; b'],
            ["it's", 'it&#39;s'],
            ['say "hi"', 'say &quot;hi&quot;'],
            ['plain text', 'plain text'],
        ])('escapes %s', (input, expected) => {
            expect(loader.escapeHtml(input)).toBe(expected);
        });

        it('returns an empty string for falsy values', () => {
            expect(loader.escapeHtml(undefined)).toBe('');
            expect(loader.escapeHtml(null)).toBe('');
            expect(loader.escapeHtml('')).toBe('');
            expect(loader.escapeHtml(0)).toBe('');
        });

        it('stringifies non-string values', () => {
            expect(loader.escapeHtml(42)).toBe('42');
            expect(loader.escapeHtml(true)).toBe('true');
        });
    });
});
