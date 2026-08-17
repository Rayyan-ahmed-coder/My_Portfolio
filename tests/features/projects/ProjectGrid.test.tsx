import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { ProjectGrid } from '../../../js/features/projects/ProjectGrid.tsx';
import { parseProjects, type ProjectLoader } from '../../../js/features/projects/projectsApi.js';
import { filtersMarkup, gridMarkup, project, type RawProject } from './fixtures.js';

const grid = (): HTMLElement => document.getElementById('projects-grid') as HTMLElement;

const q = <E extends Element = HTMLElement>(selector: string, root: ParentNode = document): E =>
    root.querySelector<E>(selector) as E;

const loaderOf = (raws: RawProject[]): ProjectLoader => () => Promise.resolve(parseProjects(raws));

/** Flushes Preact's render queue plus the microtasks the loader settles on. */
const flush = async (): Promise<void> => {
    await act(async () => {
        await Promise.resolve();
    });
};

const mount = async (load: ProjectLoader): Promise<HTMLElement> => {
    const container = grid();
    await act(async () => {
        render(<ProjectGrid load={load} />, container);
    });
    await flush();
    return container;
};

const click = (selector: string): void => {
    void act(() => {
        q<HTMLButtonElement>(selector).click();
    });
};

describe('features/projects/ProjectGrid', () => {
    beforeEach(() => {
        document.body.innerHTML = gridMarkup;
    });

    afterEach(() => {
        render(null, grid());
    });

    describe('load states', () => {
        it('renders one card per project and dispatches content:loaded', async () => {
            const listener = vi.fn();
            document.addEventListener('content:loaded', listener);

            await mount(loaderOf([project(), project({ number: 2, content: { heading: 'Second' } })]));

            expect(document.querySelectorAll('.project-card')).toHaveLength(2);
            expect(listener).toHaveBeenCalledTimes(1);
            expect((listener.mock.calls[0]?.[0] as CustomEvent).detail).toEqual({ count: 2 });
            document.removeEventListener('content:loaded', listener);
        });

        it('renders nothing while the manifest is still in flight', async () => {
            await mount(() => new Promise(() => {}));

            expect(grid().innerHTML).toBe('');
        });

        it('shows an empty state for an empty or malformed payload', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});

            await mount(loaderOf([]));
            expect(grid().textContent).toContain('No Projects Found.');

            render(null, grid());
            await mount(() => Promise.resolve(parseProjects({ not: 'an array' })));
            expect(grid().textContent).toContain('No Projects Found.');
        });

        it('reports a failed load and shows the error state', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});

            await mount(() => Promise.reject(new Error('HTTP 500 while loading projects')));

            expect(grid().textContent).toContain('Failed to Load Projects.');
            expect(error).toHaveBeenCalled();
        });

        it('stays silent and empty when the load is aborted', async () => {
            const error = vi.spyOn(console, 'error').mockImplementation(() => {});
            const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });

            await mount(() => Promise.reject(abortError));

            expect(error).not.toHaveBeenCalled();
            expect(grid().innerHTML).toBe('');
        });

        it('aborts the in-flight request when the island unmounts', async () => {
            const signals: AbortSignal[] = [];
            await mount((signal) => {
                signals.push(signal);
                return new Promise(() => {});
            });

            expect(signals[0]?.aborted).toBe(false);
            render(null, grid());

            expect(signals[0]?.aborted).toBe(true);
        });

        it('ignores a resolution that arrives after unmounting', async () => {
            let resolveLoad: ((projects: never[]) => void) | undefined;
            await mount(() => new Promise((resolve) => (resolveLoad = resolve)));

            render(null, grid());
            resolveLoad?.([]);
            await flush();

            expect(grid().innerHTML).toBe('');
        });
    });

    describe('card markup', () => {
        const renderOne = async (overrides: RawProject): Promise<HTMLElement> => {
            document.body.innerHTML = gridMarkup;
            await mount(loaderOf([project(overrides)]));
            return q<HTMLElement>('.project-card');
        };

        it('pads the project number and falls back to "00"', async () => {
            expect(q('.project-number', await renderOne({ number: 7 })).textContent).toBe('07');
            expect(q('.project-number', await renderOne({ number: 'abc' })).textContent).toBe('00');
        });

        it('normalises the category onto a lowercase data attribute', async () => {
            expect((await renderOne({ category: '  GameDev  ' })).dataset.category).toBe('gamedev');
        });

        it('marks the featured project with the large card class', async () => {
            expect((await renderOne({ main: true })).classList.contains('project-card-large')).toBe(true);
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
            const blank = q('.project-link', await renderOne({ target: '_BLANK' }));
            expect(blank.getAttribute('target')).toBe('_blank');
            expect(blank.getAttribute('rel')).toBe('noopener noreferrer');

            const sameTab = q('.project-link', await renderOne({ target: '_self' }));
            expect(sameTab.getAttribute('target')).toBe('_self');
            expect(sameTab.getAttribute('rel')).toBeNull();
        });

        it('opts out of prefetching unless preFetch is exactly true', async () => {
            expect(q('.project-link', await renderOne({ preFetch: true })).hasAttribute('prefetch')).toBe(false);
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

        it('links the card heading to its own describedby target', async () => {
            const card = await renderOne({ number: 3 });

            expect(q('h3', card).id).toBe('project-title-03');
            expect(q('.project-link', card).getAttribute('aria-describedby')).toBe('project-title-03');
        });
    });

    describe('filtering', () => {
        beforeEach(async () => {
            document.body.innerHTML = `${filtersMarkup}${gridMarkup}`;
            await mount(
                loaderOf([project({ number: 1, category: 'Web' }), project({ number: 2, category: 'Game' })])
            );
        });

        const categories = (selector: string): (string | undefined)[] =>
            [...document.querySelectorAll<HTMLElement>(selector)].map((card) => card.dataset.category);

        it('hides the cards that do not match the clicked filter', () => {
            click('[data-filter="game"]');

            expect(categories('.project-card.is-hidden')).toEqual(['web']);
            expect(categories('.project-card:not(.is-hidden)')).toEqual(['game']);
        });

        it('reveals every card again for the "all" filter', () => {
            click('[data-filter="game"]');
            click('[data-filter="all"]');

            expect(document.querySelectorAll('.project-card.is-hidden')).toHaveLength(0);
        });

        it('keeps the active class and aria-pressed on the clicked button only', () => {
            click('[data-filter="web"]');

            expect(
                [...document.querySelectorAll<HTMLElement>('.filter-button.active')].map((b) => b.dataset.filter)
            ).toEqual(['web']);
            expect(q('[data-filter="web"]').getAttribute('aria-pressed')).toBe('true');

            click('[data-filter="game"]');

            expect(
                [...document.querySelectorAll<HTMLElement>('.filter-button.active')].map((b) => b.dataset.filter)
            ).toEqual(['game']);
            expect(q('[data-filter="web"]').getAttribute('aria-pressed')).toBe('false');
        });

        it('ignores clicks that miss a filter button', () => {
            click('.project-filters');

            expect(document.querySelectorAll('.project-card.is-hidden')).toHaveLength(0);
        });

        it('detaches the delegated filter listener on unmount', () => {
            render(null, grid());
            q<HTMLButtonElement>('[data-filter="game"]').click();

            expect(q('[data-filter="game"]').classList.contains('active')).toBe(false);
        });
    });

    describe('without filter markup', () => {
        it('renders every card and warns that filtering is unavailable', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await mount(loaderOf([project({ category: 'Web' }), project({ number: 2, category: 'Game' })]));

            expect(document.querySelectorAll('.project-card:not(.is-hidden)')).toHaveLength(2);
            expect(warn.mock.calls[0]?.[0]).toMatch(/project-filters/);
        });
    });
});
