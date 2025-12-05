import type { FormattedStackTraceItemType } from '@/types/error';

import { checkIsObject } from './parse';

/**
 * Casts an unknown value to an Error object.
 * If the input value is already an Error instance, it returns it unchanged.
 * If the input value is a string or number, it creates a new Error object with the value converted to a string.
 * If the input value is of any other type, it creates a new Error object with an "Unknown error" message.
 * @param e - The value to cast to an Error object.
 * @returns The resulting Error object.
 */
export const castingError = (e: unknown): Error => {
  if (e instanceof Error) return e;

  if (typeof e === 'string' || typeof e === 'number') {
    return new Error(String(e));
  }

  if (
    e &&
    typeof e === 'object' &&
    !Array.isArray(e) &&
    checkIsObject<Error>(e, 'message')
  ) {
    return new Error(e.message);
  }

  return new Error('Something went wrong.');
};

/**
 * Throws an error with the provided message and logs the message using the error logger.
 * This function is typically used for handling unexpected errors in the application.
 * @param message - The error message to throw and log.
 * @throws {Error} - Always throws an Error object with the default error message.
 * @returns {never} - This function never returns as it always throws an error.
 */
export const throwError = (message: string): never => {
  /**
   * INFO: for logging purpose
   */

  // INFO: since this method for logging purpose skip the typecheck from TSC.
  // eslint-disable-next-line no-console
  console.log(message);

  throw new Error('Something went wrong.');
};

/**
 * A custom Error class for HTTP-related errors that includes an HTTP status code.
 * Extends the native Error class with additional status information.
 *
 * @class HTTPError
 * @extends Error
 *
 * @example
 * throw new HTTPError('Resource not found', 404);
 *
 * @example
 * try {
 *   // API call
 * } catch (e) {
 *   if (e instanceof HTTPError && e.status === 401) {
 *     // Handle unauthorized
 *   }
 * }
 */
export class HTTPError extends Error {
  constructor(
    message: string,
    public status: number = 500
  ) {
    super(message);
  }
}

/**
 * Casts an unknown value to an HTTPError object.
 * If the input is already an HTTPError, it returns it unchanged.
 * Otherwise, it creates a new HTTPError with a default status of 500.
 *
 * @param {unknown} e - The value to cast to an HTTPError.
 * @returns {HTTPError} The resulting HTTPError object.
 *
 * @example
 * try {
 *   await fetchData();
 * } catch (e) {
 *   const httpError = castingHTTPError(e);
 *   console.log(httpError.status); // 500 (default) or original status
 * }
 */
export const castingHTTPError = (e: unknown): HTTPError => {
  if (e instanceof HTTPError) return e;

  const error = castingError(e);

  return new HTTPError(error.message);
};

/**
 * Parses an error stack trace string into a structured array of stack frame objects.
 * Extracts function name, file path, line number, and column number from each stack frame.
 *
 * @param {string} [stack] - The stack trace string to parse (typically from Error.stack).
 * @param {number} [limit=5] - Maximum number of stack frames to return.
 * @returns {FormattedStackTraceItemType[]} An array of parsed stack frame objects.
 *
 * @example
 * try {
 *   throw new Error('Test error');
 * } catch (e) {
 *   const stackFrames = parseStackTrace(e.stack, 3);
 *   // Returns: [
 *   //   { function: 'functionName', file: '/path/to/file.ts', line: 10, column: 5 },
 *   //   ...
 *   // ]
 * }
 */
export const parseStackTrace = (
  stack?: string,
  limit = 5
): FormattedStackTraceItemType[] => {
  if (!stack) return [];

  const lines = stack.split('\n').map((line) => line.trim());

  return lines.reduce<FormattedStackTraceItemType[]>((result, line) => {
    if (result.length >= limit) return result;

    // Common stack trace format:
    // at functionName (fileName:line:column)
    // or at fileName:line:column
    const regex = /at\s+(?:(.*?)\s+\()?(.+):(\d+):(\d+)\)?/;
    const match = line.match(regex);

    if (!match) return result;

    const [, fnName, file, lineNumber, columnNumber] = match;

    result.push({
      column: Number(columnNumber),
      file,
      function: fnName || '<anonymous>',
      line: Number(lineNumber)
    });

    return result;
  }, []);
};
