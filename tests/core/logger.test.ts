import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    ERROR_EVENT,
    debug,
    guard,
    guardAsync,
    installGlobalErrorHandlers,
    reportError,
    toError,
    warn,
    type ErrorEventDetail,
} from '../../js/core/logger.js';

/** Captures the diagnostic events emitted by reportError. */
function captureErrorEvents(): { details: ErrorEventDetail[]; stop(): void } {
    const details: ErrorEventDetail[] = [];
    const handler = (event: Event): void => {
        details.push((event as CustomEvent<ErrorEventDetail>).detail);
    };
    document.addEventListener(ERROR_EVENT, handler);

    return {
        details,
        stop: () => document.removeEventListener(ERROR_EVENT, handler),
    };
}

describe('core/logger', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'debug').mockImplementation(() => {});
    });

    describe('toError', () => {
        it('passes Error instances through untouched', () => {
            const error = new TypeError('bad type');

            expect(toError(error)).toBe(error);
        });

        it('wraps strings and structured values', () => {
            expect(toError('plain failure').message).toBe('plain failure');
            expect(toError({ status: 500 }).message).toBe('{"status":500}');
        });
    });

    describe('warn', () => {
        it('prefixes the scope and tolerates a missing error', () => {
            warn('theme', 'storage unavailable');

            expect(console.warn).toHaveBeenCalledWith('[theme] storage unavailable', '');
        });

        it('forwards the error when one is given', () => {
            const error = new Error('nope');

            warn('theme', 'storage unavailable', error);

            expect(console.warn).toHaveBeenCalledWith('[theme] storage unavailable', error);
        });
    });

    describe('debug', () => {
        it('never throws regardless of the build mode', () => {
            expect(() => debug('scope', 'message', 1)).not.toThrow();
        });
    });

    describe('reportError', () => {
        it('logs and emits a diagnostic event carrying a real Error', () => {
            const events = captureErrorEvents();

            reportError('contentLoader', 'load failed', 'network down');

            expect(console.error).toHaveBeenCalledWith('[contentLoader] load failed', 'network down');
            expect(events.details).toHaveLength(1);
            expect(events.details[0]?.scope).toBe('contentLoader');
            expect(events.details[0]?.message).toBe('load failed');
            expect(events.details[0]?.error).toBeInstanceOf(Error);
            events.stop();
        });

        it('never lets a failing listener become a second failure', () => {
            const handler = (): never => {
                throw new Error('listener exploded');
            };
            const dispatch = vi.spyOn(document, 'dispatchEvent').mockImplementation(handler);

            expect(() => reportError('scope', 'message', new Error('original'))).not.toThrow();

            dispatch.mockRestore();
        });
    });

    describe('guard', () => {
        it('returns the value of a successful task', () => {
            expect(guard('scope', 'message', () => 42)).toBe(42);
        });

        it('reports and returns undefined when the task throws', () => {
            const events = captureErrorEvents();

            const result = guard('scope', 'boom', () => {
                throw new Error('boom');
            });

            expect(result).toBeUndefined();
            expect(events.details).toHaveLength(1);
            events.stop();
        });
    });

    describe('guardAsync', () => {
        it('resolves with the value of a successful task', async () => {
            await expect(guardAsync('scope', 'message', async () => 'ok')).resolves.toBe('ok');
        });

        it('reports and resolves undefined when the task rejects', async () => {
            const events = captureErrorEvents();

            await expect(
                guardAsync('scope', 'message', () => Promise.reject(new Error('rejected')))
            ).resolves.toBeUndefined();

            expect(events.details).toHaveLength(1);
            events.stop();
        });
    });

    describe('installGlobalErrorHandlers', () => {
        it('logs uncaught errors and unhandled rejections until uninstalled', () => {
            const uninstall = installGlobalErrorHandlers();

            window.dispatchEvent(new ErrorEvent('error', { message: 'kaboom', error: new Error('kaboom') }));
            expect(console.warn).toHaveBeenCalledWith('[global] Uncaught error: kaboom', expect.any(Error));

            const rejection = new Event('unhandledrejection') as Event & { reason?: unknown };
            rejection.reason = new Error('nobody caught me');
            window.dispatchEvent(rejection);
            expect(console.warn).toHaveBeenCalledWith('[global] Unhandled promise rejection', expect.any(Error));

            uninstall();
            (console.warn as unknown as { mockClear(): void }).mockClear();
            window.dispatchEvent(new ErrorEvent('error', { message: 'after teardown' }));

            expect(console.warn).not.toHaveBeenCalled();
        });
    });
});
