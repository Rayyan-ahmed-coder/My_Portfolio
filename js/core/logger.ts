/**
 * Single funnel for diagnostics. Console output is stripped from production
 * builds, so failures are also mirrored onto a DOM event that a monitoring
 * snippet can subscribe to without touching module internals.
 */

export const ERROR_EVENT = "portfolio:error";

export interface ErrorEventDetail {
    scope: string;
    message: string;
    error: unknown;
}

const isDev = (): boolean => {
    try {
        return Boolean(import.meta.env?.DEV);
    } catch {
        return false;
    }
};

export const toError = (value: unknown): Error =>
    value instanceof Error ? value : new Error(typeof value === "string" ? value : JSON.stringify(value));

export const debug = (scope: string, ...args: unknown[]): void => {
    if (isDev()) console.debug(`[${scope}]`, ...args);
};

export const warn = (scope: string, message: string, error?: unknown): void => {
    console.warn(`[${scope}] ${message}`, error ?? "");
};

export const reportError = (scope: string, message: string, error: unknown): void => {
    console.error(`[${scope}] ${message}`, error);

    try {
        document.dispatchEvent(
            new CustomEvent<ErrorEventDetail>(ERROR_EVENT, {
                detail: { scope, message, error: toError(error) },
            })
        );
    } catch {
        // Dispatching diagnostics must never become a second failure source.
    }
};

/** Runs `task` and reports instead of propagating, so one module cannot abort another. */
export const guard = <T>(scope: string, message: string, task: () => T): T | undefined => {
    try {
        return task();
    } catch (error) {
        reportError(scope, message, error);
        return undefined;
    }
};

/** Promise-returning counterpart of `guard`. */
export const guardAsync = async <T>(
    scope: string,
    message: string,
    task: () => Promise<T>
): Promise<T | undefined> => {
    try {
        return await task();
    } catch (error) {
        reportError(scope, message, error);
        return undefined;
    }
};

/** Installs the window-level safety net for otherwise invisible failures. */
export const installGlobalErrorHandlers = (): (() => void) => {
    const onRejection = (event: PromiseRejectionEvent): void => {
        warn("global", "Unhandled promise rejection", event.reason);
    };
    const onError = (event: ErrorEvent): void => {
        warn("global", `Uncaught error: ${event.message}`, event.error);
    };

    window.addEventListener("unhandledrejection", onRejection);
    window.addEventListener("error", onError);

    return () => {
        window.removeEventListener("unhandledrejection", onRejection);
        window.removeEventListener("error", onError);
    };
};
