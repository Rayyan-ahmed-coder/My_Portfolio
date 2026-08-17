import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoadContent, { PROJECTS_URL, parseProjects } from '../../js/core/contentLoader.js';
import { stubIntersectionObserver, stubAnimationFrame } from '../helpers.js';

const gridMarkup = '<section><div id="projects-grid"></div></section>';

type RawProject = Record<string, unknown>;

const project = (overrides: RawProject = {}): RawProject => ({
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
function stubFetch(payload: unknown, { ok = true, status = 200 } = {}) {
    const fetchMock = vi.fn(() =>
        Promise.resolve({
            ok,
            status,
            json: () => Promise.resolve(payload),
        } as unknown as Response)
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}

/** Constructs a loader without letting the lazy IntersectionObserver fire. */
function createLoader(): LoadContent {
    stubIntersectionObserver();
    return new LoadContent();
}

const grid = (): HTMLElement => document.getElementById('projects-grid') as HTMLElement;
const q = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document): E =>
    root.querySelector<E>(selector) as E;

describe('core/contentLoader', () => {
    beforeEach(() => {
        vi.stubGlobal('requestIdleCallback', (cb: () => void) => cb());
    });

    describe('parseProjects()', () => {
        it('returns an empty list for a non-array payload', () => {
            expect(parseProjects({ not: 'an array' })).toEqual([]);
            expect(parseProjects(null)).toEqual([]);
        });

        it('drops entries that are not objects but keeps the valid ones', () => {
            expect(parseProjects([null, 'nope', 7, project()])).toHaveLength(1);
        });

        it('normalises category, target and tags', () => {
            const [parsed] = parseProjects([
                project({ category: '  GameDev ', target: '_SELF', tags: ['a', 3, null] }),
            ]);

            expect(parsed).toMatchObject({
                category: 'gamedev',
                openInNewTab: false,
                tags: ['a'],
            });
        });
    });

    describe('init()', () => {
        it('logs an error and stops when the grid is missing', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const fetchMock = stubFetch([]);
            stubIntersectionObserver();

            new LoadContent();
            await vi.waitFor(() => expect(error).toHaveBeenCalled());

            expect(error.mock.calls[0]?.[0]).toMatch(/#projects-grid/);
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('observes the closest section and loads once it intersects', async () => {
            document.body.innerHTML = gridMarkup;
            const fetchMock = stubFetch([project()]);
            const observers = stubIntersectionObserver();

            new LoadContent();

            expect(observers.last.observed).toEqual([q('section')]);
            expect(fetchMock).not.toHaveBeenCalled();

            observers.last.trigger([{ target: q('section') }]);

            await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
            expect(observers.last.disconnected).toBe(true);
        });

        it('does not load while the grid stays out of view', () => {
            document.body.innerHTML = gridMarkup;
            const fetchMock = stubFetch([project()]);
            const observers = stubIntersectionObserver();

            new LoadContent();
            observers.last.trigger([{ target: q('section'), isIntersecting: false }]);

            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('observes the grid itself when it has no section ancestor', () => {
            document.body.innerHTML = '<div id="projects-grid"></div>';
            stubFetch([]);
            const observers = stubIntersectionObserver();

            new LoadContent();

            expect(observers.last.observed).toEqual([grid()]);
        });

        it('loads eagerly when IntersectionObserver is unavailable', async () => {
            document.body.innerHTML = gridMarkup;
            const fetchMock = stubFetch([project()]);
            delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;
            delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;

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
                PROJECTS_URL,
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

            const loader = createLoader();
            await loader.loadProjects();

            expect(document.querySelectorAll('.project-card')).toHaveLength(2);
            expect(loader.loaded).toBe(true);
            expect(listener).toHaveBeenCalledTimes(1);
            expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ count: 2 });
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
            expect(grid().innerHTML).toContain('No Projects Found.');

            document.body.innerHTML = gridMarkup;
            stubFetch({ not: 'an array' });
            await createLoader().loadProjects();
            expect(grid().innerHTML).toContain('No Projects Found.');
        });

        it('retries once and then shows an error state on a failed HTTP response', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const fetchMock = stubFetch(null, { ok: false, status: 500 });

            await createLoader().loadProjects();

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(grid().innerHTML).toContain('Failed to Load Projects.');
            expect(error).toHaveBeenCalled();
        });

        it('recovers when the retry succeeds', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            let attempt = 0;
            vi.stubGlobal(
                'fetch',
                vi.fn(() => {
                    attempt += 1;
                    if (attempt === 1) return Promise.reject(new Error('network down'));
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve([project()]),
                    } as unknown as Response);
                })
            );

            await createLoader().loadProjects();

            expect(document.querySelectorAll('.project-card')).toHaveLength(1);
            expect(error).not.toHaveBeenCalled();
        });

        it('aborts an in-flight request when called again', async () => {
            const signals: AbortSignal[] = [];
            vi.stubGlobal(
                'fetch',
                vi.fn((_url: string, options: RequestInit) => {
                    signals.push(options.signal as AbortSignal);
                    return Promise.resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve([project()]),
                    } as unknown as Response);
                })
            );
            const loader = createLoader();

            await loader.loadProjects();
            await loader.loadProjects();

            expect(signals[0]?.aborted).toBe(true);
            expect(signals[1]?.aborted).toBe(false);
        });

        it('stays silent when the request is aborted', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
            vi.stubGlobal('fetch', vi.fn(() => Promise.reject(abortError)));

            await createLoader().loadProjects();

            expect(error).not.toHaveBeenCalled();
            expect(grid().innerHTML).toBe('');
        });
    });

    describe('card markup', () => {
        beforeEach(() => {
            document.body.innerHTML = gridMarkup;
        });

        const renderOne = async (overrides: RawProject): Promise<HTMLElement> => {
            stubFetch([project(overrides)]);
            await createLoader().loadProjects();
            return q<HTMLElement>('.project-card');
        };

        it('pads the project number and falls back to "00"', async () => {
            expect(q('.project-number', await renderOne({ number: 7 })).textContent).toBe('07');

            document.body.innerHTML = gridMarkup;
            expect(q('.project-number', await renderOne({ number: 'abc' })).textContent).toBe('00');
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

            expect(q('.project-type', card).textContent).toBe('Type Value not set');
            expect(q('h3', card).textContent).toBe('Untitled Project');
            expect(card.dataset.category).toBe('unknown');
            expect(q('.project-link', card).getAttribute('href')).toBe('#');
            expect(card.querySelectorAll('.project-tags span')).toHaveLength(0);
            expect(q('.project-preview-content span', card).textContent).toBe('Not Defined');
        });

        it('adds noopener noreferrer only for new-tab links', async () => {
            const blank = await renderOne({ target: '_BLANK' });
            expect(q('.project-link', blank).getAttribute('target')).toBe('_blank');
            expect(q('.project-link', blank).getAttribute('rel')).toBe('noopener noreferrer');

            document.body.innerHTML = gridMarkup;
            const sameTab = await renderOne({ target: '_self' });
            expect(q('.project-link', sameTab).getAttribute('target')).toBe('_self');
            expect(q('.project-link', sameTab).getAttribute('rel')).toBeNull();
        });

        it('opts out of prefetching unless preFetch is exactly true', async () => {
            expect(q('.project-link', await renderOne({ preFetch: true })).hasAttribute('prefetch')).toBe(false);

            document.body.innerHTML = gridMarkup;
            expect(q('.project-link', await renderOne({ preFetch: 'yes' })).getAttribute('prefetch')).toBe('false');
        });

        it('escapes untrusted project content', async () => {
            const card = await renderOne({
                content: { heading: '<img src=x onerror="alert(1)">', description: 'a & b' },
            });

            expect(q('h3', card).querySelector('img')).toBeNull();
            expect(q('h3', card).textContent).toBe('<img src=x onerror="alert(1)">');
            expect(card.querySelectorAll('p')[1]?.textContent).toBe('a & b');
        });

        it('skips null entries in the payload', async () => {
            stubFetch([null, project()]);
            await createLoader().loadProjects();

            expect(document.querySelectorAll('.project-card')).toHaveLength(1);
        });
    });

    describe('project filters', () => {
        let loader: LoadContent;

        beforeEach(async () => {
            document.body.innerHTML = `
                <div class="project-filters">
                    <button class="filter-button" data-filter="all">All</button>
                    <button class="filter-button" data-filter="web">Web</button>
                    <button class="filter-button" data-filter="game">Game</button>
                </div>
                ${gridMarkup}
            `;
            stubAnimationFrame();
            stubFetch([project({ number: 1, category: 'Web' }), project({ number: 2, category: 'Game' })]);
            loader = createLoader();
            await loader.loadProjects();
        });

        const cardCategories = (selector: string): (string | undefined)[] =>
            [...document.querySelectorAll<HTMLElement>(selector)].map((card) => card.dataset.category);

        it('hides the cards that do not match the clicked filter', () => {
            q<HTMLButtonElement>('[data-filter="game"]').click();

            expect(cardCategories('.project-card.is-hidden')).toEqual(['web']);
            expect(cardCategories('.project-card:not(.is-hidden)')).toEqual(['game']);
        });

        it('reveals every card again for the "all" filter', () => {
            q<HTMLButtonElement>('[data-filter="game"]').click();
            q<HTMLButtonElement>('[data-filter="all"]').click();

            expect(document.querySelectorAll('.project-card.is-hidden')).toHaveLength(0);
        });

        it('keeps the active class and aria-pressed on the clicked button only', () => {
            q<HTMLButtonElement>('[data-filter="web"]').click();
            expect([...document.querySelectorAll<HTMLElement>('.filter-button.active')].map((b) => b.dataset.filter)).toEqual(
                ['web']
            );
            expect(q('[data-filter="web"]').getAttribute('aria-pressed')).toBe('true');

            q<HTMLButtonElement>('[data-filter="game"]').click();
            expect([...document.querySelectorAll<HTMLElement>('.filter-button.active')].map((b) => b.dataset.filter)).toEqual(
                ['game']
            );
            expect(q('[data-filter="web"]').getAttribute('aria-pressed')).toBe('false');
        });

        it('destroy() detaches the delegated filter listener', () => {
            loader.destroy();
            q<HTMLButtonElement>('[data-filter="game"]').click();

            expect(document.querySelectorAll('.project-card.is-hidden')).toHaveLength(0);
        });
    });
});
