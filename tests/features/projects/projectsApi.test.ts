import { describe, it, expect, vi } from 'vitest';
import {
    PROJECTS_URL,
    fetchProjects,
    isAbortError,
    matchesFilter,
    parseProjects,
} from '../../../js/features/projects/projectsApi.js';
import type { Project } from '../../../js/core/types.js';
import { project, stubFetch, type RawProject } from './fixtures.js';

const load = (): Promise<readonly Project[]> => fetchProjects(new AbortController().signal);

describe('features/projects/projectsApi', () => {
    describe('parseProjects()', () => {
        it('returns an empty list for a non-array payload', () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});

            expect(parseProjects({ not: 'an array' })).toEqual([]);
            expect(parseProjects(null)).toEqual([]);
        });

        it('drops entries that are not objects but keeps the valid ones', () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});

            expect(parseProjects([null, 'nope', 7, project()])).toHaveLength(1);
        });

        it('normalises category, target and tags', () => {
            const [parsed] = parseProjects([
                project({ category: '  GameDev ', target: '_SELF', tags: ['a', 3, null] }),
            ]);

            expect(parsed).toMatchObject({ category: 'gamedev', openInNewTab: false, tags: ['a'] });
        });

        it('falls back to placeholder values for missing fields', () => {
            const [parsed] = parseProjects([
                { number: 'abc', type: undefined, content: undefined, preview: undefined },
            ]);

            expect(parsed).toMatchObject({
                number: 0,
                type: 'Type Value not set',
                heading: 'Untitled Project',
                description: 'Description not set',
                category: 'unknown',
                link: '#',
                preview: ['Not Defined', 'Not Defined'],
            });
        });
    });

    describe('fetchProjects()', () => {
        it('requests the manifest from cache with an Accept header', async () => {
            const fetchMock = stubFetch([project()]);

            await load();

            expect(fetchMock).toHaveBeenCalledWith(
                PROJECTS_URL,
                expect.objectContaining({
                    cache: 'force-cache',
                    headers: { Accept: 'application/json' },
                })
            );
        });

        it('retries once and then rejects on a failing HTTP response', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
            const fetchMock = stubFetch(null, { ok: false, status: 500 });

            await expect(load()).rejects.toThrow(/HTTP 500/);
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('recovers when the retry succeeds', async () => {
            vi.spyOn(console, 'warn').mockImplementation(() => {});
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

            await expect(load()).resolves.toHaveLength(1);
            expect(attempt).toBe(2);
        });

        it('does not retry an aborted request', async () => {
            const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
            const fetchMock = vi.fn(() => Promise.reject(abortError));
            vi.stubGlobal('fetch', fetchMock);

            await expect(load()).rejects.toBe(abortError);
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('forwards the caller signal so in-flight requests can be cancelled', async () => {
            const fetchMock = stubFetch([project()]);
            const controller = new AbortController();

            await fetchProjects(controller.signal);
            controller.abort();

            const options = fetchMock.mock.calls[0]?.[1] as RequestInit;
            expect((options.signal as AbortSignal).aborted).toBe(true);
        });
    });

    describe('helpers', () => {
        const categorised = (category: string): Project =>
            parseProjects([project({ category } as RawProject)])[0] as Project;

        it('matches every project for the "all" filter', () => {
            expect(matchesFilter(categorised('web'), 'all')).toBe(true);
        });

        it('matches on a category substring', () => {
            expect(matchesFilter(categorised('web-game'), 'game')).toBe(true);
            expect(matchesFilter(categorised('web'), 'game')).toBe(false);
        });

        it('recognises abort errors only', () => {
            expect(isAbortError(Object.assign(new Error('x'), { name: 'AbortError' }))).toBe(true);
            expect(isAbortError(new Error('boom'))).toBe(false);
            expect(isAbortError('AbortError')).toBe(false);
        });
    });
});
