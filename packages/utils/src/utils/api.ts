import { getValueWithOr } from './parse';
import { combineAbortSignal, createAbortSignal } from './process';

/**
 * Arguments for creating an API abort signal.
 *
 * @interface CreateAbortSignalAPIArgs
 * @property {number} [duration] - The timeout duration in milliseconds. Defaults to 5000ms if not provided.
 * @property {string} [reason] - Custom reason message for the abort signal timeout.
 * @property {AbortSignal} [signal] - An optional external AbortSignal to combine with the timeout signal.
 */
interface CreateAbortSignalAPIArgs {
  duration?: number;
  reason?: string;
  signal?: AbortSignal;
}

/**
 * Creates an AbortSignal for API requests with a configurable timeout.
 * Combines a timeout-based abort signal with an optional external signal.
 *
 * @param {CreateAbortSignalAPIArgs} args - The configuration arguments for the abort signal.
 * @returns {AbortSignal} A combined AbortSignal that will abort after the specified duration or when the external signal aborts.
 *
 * @example
 * // Basic usage with default 5 second timeout
 * const signal = createAbortSignalAPI({});
 * fetch('/api/data', { signal });
 *
 * @example
 * // Custom timeout with external signal
 * const controller = new AbortController();
 * const signal = createAbortSignalAPI({
 *   duration: 10000,
 *   reason: 'API request timeout',
 *   signal: controller.signal
 * });
 */
export const createAbortSignalAPI = (args: CreateAbortSignalAPIArgs) => {
  const { duration, reason, signal } = args;

  return combineAbortSignal([
    createAbortSignal(
      getValueWithOr({
        defaultValue: 5000,
        value: duration
      }),
      reason
    ),
    ...(signal ? [signal] : [])
  ]);
};
