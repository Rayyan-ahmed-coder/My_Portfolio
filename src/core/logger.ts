/**
 * @file logger.ts
 * @description Robust structural application error monitoring and diagnostics funnel.
 * @version 1.0.4
 * @author Rayyan Khan
 */

export const ERROR_EVENT = "portfolio:error";

export interface ErrorEventDetail {
  scope: string;
  message: string;
  error: unknown;
}

/**
 * Determines if the current environment is set to development.
 * @returns True if development flag is active in environmental meta.
 */
const isDev = (): boolean => {
  try {
    return Boolean(import.meta.env?.DEV);
  } catch {
    return false;
  }
};

/**
 * Normalizes unknown values safely into standard Error instances.
 * @param value Raw incoming data layer requiring validation.
 * @returns Concrete Error object structure.
 */
export const toError = (value: unknown): Error =>
  value instanceof Error ? value : new Error(typeof value === "string" ? value : JSON.stringify(value));

/**
 * Logs debug entries to the console strictly in development mode.
 * @param scope Module contextual identifier tracking the source block.
 * @param args Variadic data payload parameters to output.
 */
export const debug = (scope: string, ...args: unknown[]): void => {
  if (isDev()) console.debug(`[${scope}]`, ...args);
};

/**
 * Dispatches warning messages safely to the console tracker.
 * @param scope Module tracking code boundary zone.
 * @param message Structural status flag content note.
 * @param error Optional secondary diagnostic failure layer.
 */
export const warn = (scope: string, message: string, error?: unknown): void => {
  console.warn(`[${scope}] ${message}`, error ?? "");
};

/**
 * Reports errors to console and fires a global diagnostic DOM event.
 * @param scope Operational layout system block code.
 * @param message Error description context string.
 * @param error Raw caught execution exception element.
 */
export const reportError = (scope: string, message: string, error: unknown): void => {
  console.error(`[${scope}] ${message}`, error);
  try {
    document.dispatchEvent(
      new CustomEvent<ErrorEventDetail>(ERROR_EVENT, {
        detail: { scope, message, error: toError(error) },
      }),
    );
  } catch {
    console.error("reportError() could not run correctly");
  }
};

/**
 * Executes a synchronous module task inside a fail-safe try/catch block.
 * @template T Implicit runtime return type of the wrapped task.
 * @param scope Isolation boundary target tracking key.
 * @param message Descriptive message string fallback on failure.
 * @param task Code function logic block sequence to evaluate.
 * @returns Result of the task run execution loop, or undefined if faulted.
 */
export const guard = <T>(scope: string, message: string, task: () => T): T | undefined => {
  try {
    return task();
  } catch (error) {
    reportError(scope, message, error);
    return undefined;
  }
};

/**
 * Executes an asynchronous task inside a fail-safe try/catch boundary.
 * @template T Expected underlying target completion data structure.
 * @param scope Asynchronous isolation boundary tag key.
 * @param message Logging context text tracking descriptor.
 * @param task Promise-returning background worker function wrapper.
 * @returns Promise resolving to the inner task result, or undefined on exceptions.
 */
export const guardAsync = async <T>(scope: string, message: string, task: () => Promise<T>): Promise<T | undefined> => {
  try {
    return await task();
  } catch (error) {
    reportError(scope, message, error);
    return undefined;
  }
};

/**
 * Installs global event interception boundaries for uncaught rejections.
 * @returns Automated teardown cancellation method handle.
 */
export const installGlobalErrorHandlers = (): (() => void) => {
  if (typeof window === "undefined") return () => undefined;

  const onRejection = (e: PromiseRejectionEvent) => warn("global", "Unhandled rejection", e.reason);
  const onError = (e: ErrorEvent) => warn("global", `Uncaught: ${e.message}`, e.error);

  window.addEventListener("unhandledrejection", onRejection);
  window.addEventListener("error", onError);

  return () => {
    window.removeEventListener("unhandledrejection", onRejection);
    window.removeEventListener("error", onError);
  };
};
