const reported = new WeakSet();

/**
 * Central error reporting.
 *
 * Every recoverable failure is funnelled through here so that it is always
 * visible in the console and observable by other modules (or future
 * monitoring) through the `app:error` event, instead of disappearing into an
 * empty catch block.
 *
 * @param {string} context - Where the failure happened, e.g. "contentLoader.loadProjects".
 * @param {unknown} error - The thrown value.
 * @param {Record<string, unknown>} [details] - Extra diagnostic data.
 * @returns {Error} The normalized error, so callers can rethrow it.
 */
export function reportError(context, error, details = {}) {
    const normalized = error instanceof Error ? error : new Error(String(error));

    // A rethrown error also reaches the global handler; report it only once.
    if (reported.has(normalized)) return normalized;
    reported.add(normalized);

    console.error(`[${context}]`, normalized, details);

    try {
        document.dispatchEvent(new CustomEvent('app:error', {
            detail: { context, error: normalized, details }
        }));
    } catch (dispatchError) {
        console.error(`[errors.reportError] Failed to dispatch app:error for "${context}"`, dispatchError);
    }

    return normalized;
}

/**
 * Runs a callback and reports (instead of swallowing) any synchronous or
 * asynchronous failure. Used for fire-and-forget work such as event handlers,
 * where there is no caller left to propagate the rejection to.
 *
 * @template T
 * @param {string} context
 * @param {() => T} callback
 * @returns {T|undefined} The callback result, or undefined when it threw.
 */
export function runSafely(context, callback) {
    try {
        const result = callback();
        if (result && typeof result.then === 'function') {
            return result.catch(error => reportError(context, error));
        }
        return result;
    } catch (error) {
        reportError(context, error);
        return undefined;
    }
}
