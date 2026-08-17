import { vi } from 'vitest';

export type RawProject = Record<string, unknown>;

export const gridMarkup = '<section><div id="projects-grid"></div></section>';

export const filtersMarkup = `
    <div class="project-filters">
        <button class="filter-button active" data-filter="all">All</button>
        <button class="filter-button" data-filter="web">Web</button>
        <button class="filter-button" data-filter="game">Game</button>
    </div>
`;

export const project = (overrides: RawProject = {}): RawProject => ({
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
export function stubFetch(payload: unknown, { ok = true, status = 200 } = {}) {
    const fetchMock = vi.fn((_url: string, _options?: RequestInit) =>
        Promise.resolve({
            ok,
            status,
            json: () => Promise.resolve(payload),
        } as unknown as Response)
    );
    vi.stubGlobal('fetch', fetchMock);
    return fetchMock;
}
