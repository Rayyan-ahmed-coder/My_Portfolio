import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProjectsIsland from '../../../js/features/projects/island.tsx';
import { stubIntersectionObserver } from '../../helpers.js';
import { gridMarkup, project, stubFetch } from './fixtures.js';

const preactRender = vi.hoisted(() => ({ shouldThrow: false }));

vi.mock('preact', async (importOriginal) => {
    const actual = await importOriginal<typeof import('preact')>();
    return {
        ...actual,
        render: (...args: Parameters<typeof actual.render>): void => {
            if (preactRender.shouldThrow) throw new Error('render exploded');
            actual.render(...args);
        },
    };
});

const q = <E extends Element = HTMLElement>(selector: string): E =>
    document.querySelector<E>(selector) as E;

let islands: ProjectsIsland[] = [];

const createIsland = (): ProjectsIsland => {
    const island = new ProjectsIsland();
    islands.push(island);
    return island;
};

describe('features/projects/island', () => {
    beforeEach(() => {
        vi.stubGlobal('requestIdleCallback', (callback: () => void) => callback());
        document.body.innerHTML = gridMarkup;
    });

    afterEach(() => {
        preactRender.shouldThrow = false;
        islands.splice(0).forEach((island) => island.destroy());
    });

    it('reports an error and stops when the grid is missing', () => {
        document.body.innerHTML = '';
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const fetchMock = stubFetch([]);
        stubIntersectionObserver();

        createIsland();

        expect(error.mock.calls[0]?.[0]).toMatch(/#projects-grid/);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('observes the closest section and mounts once it intersects', async () => {
        const fetchMock = stubFetch([project()]);
        const observers = stubIntersectionObserver();

        const island = createIsland();

        expect(observers.last.observed).toEqual([q('section')]);
        expect(island.mounted).toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();

        observers.last.trigger([{ target: q('section') }]);

        expect(island.mounted).toBe(true);
        expect(observers.last.disconnected).toBe(true);
        await vi.waitFor(() => expect(document.querySelectorAll('.project-card')).toHaveLength(1));
    });

    it('stays dormant while the grid is out of view', () => {
        const fetchMock = stubFetch([project()]);
        const observers = stubIntersectionObserver();

        const island = createIsland();
        observers.last.trigger([{ target: q('section'), isIntersecting: false }]);

        expect(island.mounted).toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('observes the grid itself when it has no section ancestor', () => {
        document.body.innerHTML = '<div id="projects-grid"></div>';
        stubFetch([]);
        const observers = stubIntersectionObserver();

        createIsland();

        expect(observers.last.observed).toEqual([q('#projects-grid')]);
    });

    it('mounts eagerly when IntersectionObserver is unavailable', async () => {
        const fetchMock = stubFetch([project()]);
        delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;
        delete (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver;

        const island = createIsland();

        expect(island.mounted).toBe(true);
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    });

    it('mounts at most once', async () => {
        const fetchMock = stubFetch([project()]);
        stubIntersectionObserver();
        const island = createIsland();

        island.mount();
        island.mount();

        await vi.waitFor(() => expect(document.querySelectorAll('.project-card')).toHaveLength(1));
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('reports a render failure instead of throwing', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        stubFetch([]);
        stubIntersectionObserver();
        const island = createIsland();
        preactRender.shouldThrow = true;

        expect(() => island.mount()).not.toThrow();
        expect(island.mounted).toBe(false);
        expect(error).toHaveBeenCalled();
    });

    it('destroy() unmounts the island and disconnects the observer', async () => {
        stubFetch([project()]);
        const observers = stubIntersectionObserver();
        const island = createIsland();
        island.mount();
        await vi.waitFor(() => expect(document.querySelectorAll('.project-card')).toHaveLength(1));

        island.destroy();

        expect(island.mounted).toBe(false);
        expect(observers.last.disconnected).toBe(true);
        expect(q('#projects-grid').innerHTML).toBe('');
    });
});
