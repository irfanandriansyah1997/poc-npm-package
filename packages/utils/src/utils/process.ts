import { castingError } from './error';

/**
 * Creates an abort signal with the given timeout in milliseconds
 * (polyfill if abortsignal is undefined on browser).
 *
 * @param {number} milisecond - The timeout duration in milliseconds.
 * @param {string} reason - Optional custom error message for the timeout.
 * @returns {AbortSignal} - An abort signal instance.
 */
export const createAbortSignal = (
  milisecond: number,
  reason?: string
): AbortSignal => {
  const timeoutReason = reason || 'Signal Timeout';

  const controller = new AbortController();
  setTimeout(() => controller.abort(new Error(timeoutReason)), milisecond);
  return controller.signal;
};

interface AbortProcessArgs<T> {
  delay?: number;
  fn: Promise<T>;
  signals?: AbortSignal[];
}

interface AbortProcessResponseType<T> {
  error?: Error;
  result?: T;
}

/**
 * Aborts a process after a specified delay.
 *
 * @template T - The type of the result expected from the process.
 * @param args - The arguments for aborting the process.
 * @returns  A promise resolving to the response of the aborted process.
 */
export async function abortProcess<T>(
  args: AbortProcessArgs<T>
): Promise<AbortProcessResponseType<T>> {
  try {
    const { delay = 1000, fn, signals = [] } = args;
    const signal = combineAbortSignal([createAbortSignal(delay), ...signals]);

    const response = await new Promise<T>((resolve, reject) => {
      fn.then((response) => resolve(response)).catch((e) => reject(e));

      if (signal) {
        signal.addEventListener('abort', () => {
          reject(new Error('Abort Process'));
        });
      }
    });

    return { result: response };
  } catch (e) {
    return {
      error: castingError(e)
    };
  }
}

/**
 * Combines multiple AbortSignal instances into a single AbortSignal.
 * The returned signal will be aborted if any of the input signals are aborted.
 * Preserves the abort reason from the first signal that aborts.
 *
 * @param {AbortSignal[]} signals - An array of AbortSignal instances to combine.
 * @throws {CashboundError} Throws an error if the argument is not an array or if any element is not an AbortSignal.
 * @returns {AbortSignal} A new AbortSignal that will be aborted if any of the input signals are aborted.
 */
export const combineAbortSignal = (signals: AbortSignal[]) => {
  if (!Array.isArray(signals)) {
    throw new TypeError('The argument must be an array of AbortSignals.');
  }

  const signalIncorrect = signals.find(
    (item) => !(item instanceof AbortSignal)
  );
  if (signalIncorrect) {
    throw new TypeError('All elements must be AbortSignal instances.');
  }

  const controller = new AbortController();
  const eventController = new AbortController();
  const signal = controller.signal;

  const abortHandler = (event: Event) => {
    if (!signal.aborted) {
      // Preserve the reason from the aborted signal
      const abortedSignal = event.target as AbortSignal;
      const reason = abortedSignal.reason || new Error('Request aborted');
      controller.abort(reason);
      eventController.abort();
    }
  };

  let isAbort = false;
  for (const s of signals) {
    if (isAbort) return signal;

    s.addEventListener('abort', abortHandler, eventController);

    // Check if any signal is already aborted
    if (s.aborted) {
      isAbort = true;
      const reason = s.reason || new Error('Request aborted');
      controller.abort(reason);
      eventController.abort();
    }
  }

  return signal;
};
