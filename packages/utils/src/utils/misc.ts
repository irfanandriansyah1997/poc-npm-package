import type { GetField, GetKeys, Maybe, NullAble } from '@/types/utils';

import { safeParseJSON, safeStringifyJSON } from './parse';

/**
 * A no-operation function that does nothing.
 * Useful as a default callback or placeholder function.
 *
 * @returns {void}
 *
 * @example
 * const onClick = props.onClick || noop;
 */
export const noop = () => {};

/**
 * Capitalizes the first letter of each word in a string.
 * Converts all other letters to lowercase.
 *
 * @param {string} value - The string to capitalize.
 * @returns {string} The string with each word's first letter capitalized.
 *
 * @example
 * capitalizeFirstLetter('hello world'); // 'Hello World'
 * capitalizeFirstLetter('HELLO WORLD'); // 'Hello World'
 */
export const capitalizeFirstLetter = (value: string) =>
  value
    .split(' ')
    .map((word) => {
      if (word) return word[0].toUpperCase() + word.slice(1).toLowerCase();

      return '';
    })
    .join(' ');

/**
 * Arguments for retrieving data by a path string.
 *
 * @template TData - The type of the data object.
 * @template TPath - The type of the path string (derived from TData keys).
 * @interface GetDataByPathArgs
 * @property {TData} data - The data object to traverse.
 * @property {TPath} pathStr - The dot-notation path string to the desired value.
 */
interface GetDataByPathArgs<
  TData extends object,
  TPath extends GetKeys<TData> = GetKeys<TData>
> {
  data: TData;
  pathStr: TPath;
}

/**
 * Retrieves a value from a nested object using a dot-notation path string.
 * Supports array index notation (e.g., 'items[0].name').
 *
 * @template TData - The type of the data object.
 * @template TPath - The type of the path string.
 * @param {GetDataByPathArgs<TData, TPath>} args - The arguments containing the data and path.
 * @returns {Maybe<GetField<TData, TPath>>} The value at the specified path, or undefined if not found.
 *
 * @example
 * const data = { user: { profile: { name: 'John' } } };
 * getDataByPath({ data, pathStr: 'user.profile.name' }); // 'John'
 *
 * @example
 * const data = { items: [{ id: 1 }, { id: 2 }] };
 * getDataByPath({ data, pathStr: 'items[1].id' }); // 2
 */
export function getDataByPath<
  TData extends object,
  TPath extends GetKeys<TData> = GetKeys<TData>
>(args: GetDataByPathArgs<TData, TPath>): Maybe<GetField<TData, TPath>> {
  const { data, pathStr } = args;
  try {
    // INFO: as for now need to casting to prevent error typecheck; but if unexpected
    // happen when retrieve the data will returning undefined as a fallback data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let target: any = data;

    const path = pathStr
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(Boolean);

    while (path.length) target = target[path.shift()!];

    return target;
  } catch {
    return undefined;
  }
}

/**
 * Creates a promise that resolves after a specified time delay.
 * Useful for adding delays in async functions.
 *
 * @param {number} time - The delay time in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the specified delay.
 *
 * @example
 * await delay(1000); // Wait for 1 second
 * console.log('1 second later');
 */
export const delay = async (time: number): Promise<void> => {
  return await new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

/**
 * Schedules a function to be executed after a specified time delay.
 * Non-async version using setTimeout.
 *
 * @param {() => void} fn - The function to execute after the delay.
 * @param {number} time - The delay time in milliseconds.
 * @returns {ReturnType<typeof setTimeout>} The timeout ID that can be used to cancel the scheduled execution.
 *
 * @example
 * const timeoutId = delayNonAsync(() => console.log('Hello'), 1000);
 * // To cancel: clearTimeout(timeoutId);
 */
export const delayNonAsync = (
  fn: () => void,
  time: number
): ReturnType<typeof setTimeout> => {
  return setTimeout(fn, time);
};

/**
 * Arguments for the log function.
 *
 * @interface LogArgs
 * @property {Parameters<typeof console.log>} payload - The arguments to pass to console.log or console.error.
 * @property {'stdout' | 'stderr'} type - The output stream type: 'stdout' for console.log, 'stderr' for console.error.
 */
interface LogArgs {
  payload: Parameters<typeof console.log>;
  type: 'stdout' | 'stderr';
}

/**
 * Logs messages to the console with support for stdout and stderr output streams.
 *
 * @param {LogArgs} args - The log arguments containing the payload and output type.
 * @returns {void}
 *
 * @example
 * log({ type: 'stdout', payload: ['Info:', 'Operation successful'] });
 * log({ type: 'stderr', payload: ['Error:', 'Something went wrong'] });
 */
export const log = (args: LogArgs) => {
  const { payload, type } = args;

  if (type === 'stderr') {
    // INFO: since this method for logging purpose skip the typecheck from TSC.

    console.error(...payload);
    return;
  }

  // INFO: since this method for logging purpose skip the typecheck from TSC.
  // eslint-disable-next-line no-console
  console.log(...payload);
};

/**
 * Creates a debounced version of a function that delays execution until after
 * a specified wait period has elapsed since the last call.
 *
 * @template T - The type of the function to debounce.
 * @param {T} func - The function to debounce.
 * @param {number} [timeout=300] - The debounce delay in milliseconds.
 * @returns {(...args: Parameters<T>) => void} The debounced function.
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   fetchSearchResults(query);
 * }, 500);
 *
 * // Called multiple times rapidly, only the last call executes
 * debouncedSearch('h');
 * debouncedSearch('he');
 * debouncedSearch('hello'); // Only this one executes after 500ms
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  timeout = 300
) {
  let timer: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func(...args);
    }, timeout);
  };
}

/**
 * Creates a throttled version of a function that only executes once per specified time interval.
 * The first call executes immediately, subsequent calls within the interval are ignored.
 *
 * @template T - The type of the function to throttle.
 * @param {T} func - The function to throttle.
 * @param {number} [delay=300] - The throttle interval in milliseconds.
 * @returns {(...args: Parameters<T>) => void} The throttled function.
 *
 * @example
 * const throttledScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 *
 * window.addEventListener('scroll', throttledScroll);
 * // Executes at most once every 100ms during scrolling
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay = 300
) {
  let timer: NullAble<ReturnType<typeof setTimeout>> = null;

  return (...args: Parameters<T>) => {
    if (!timer) {
      func(...args);

      timer = setTimeout(() => {
        clearTimeout(timer!);
        timer = null;
      }, delay);
    }
  };
}

/**
 * Generates a random string of 10 characters using cryptographically secure random values.
 * Falls back to an empty string if crypto API is unavailable.
 *
 * @returns {string} A random 10-character string, or an empty string if generation fails.
 *
 * @example
 * const id = randString(); // e.g., 'a1b2c3d4e5'
 */
export const randString = () => {
  try {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(36))
      .join('')
      .substring(0, 10);
  } catch {
    return '';
  }
};

/**
 * Arguments for deep copying a value.
 *
 * @template T - The type of the value to copy.
 * @interface DeepCopyArgs
 * @property {T} defaultValue - The fallback value if JSON parsing fails.
 * @property {T} value - The value to deep copy.
 */
interface DeepCopyArgs<T> {
  defaultValue: T;
  value: T;
}

/**
 * Creates a deep copy of a value using JSON serialization.
 * Note: This method does not preserve functions, undefined values, or circular references.
 *
 * @template T - The type of the value to copy.
 * @param {DeepCopyArgs<T>} args - The arguments containing the value and default fallback.
 * @returns {T} A deep copy of the value, or the default value if copying fails.
 *
 * @example
 * const original = { nested: { value: 1 } };
 * const copy = deepCopy({ value: original, defaultValue: {} });
 * copy.nested.value = 2;
 * console.log(original.nested.value); // Still 1
 */
export function deepCopy<T>(args: DeepCopyArgs<T>): T {
  const { defaultValue, value } = args;

  return safeParseJSON<T>(safeStringifyJSON(value), defaultValue);
}

/**
 * Converts a camelCase string to snake_case.
 *
 * @param {string} key - The camelCase string to convert.
 * @returns {string} The snake_case version of the string.
 *
 * @example
 * camelToSnakeCase('firstName'); // 'first_name'
 * camelToSnakeCase('getUserById'); // 'get_user_by_id'
 */
export const camelToSnakeCase = (key: string): string => {
  const result = key
    .trim()
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .join('_')
    .toLowerCase();

  if (result.charAt(0) === '_') {
    return result.slice(1);
  }

  return result;
};

/**
 * Transforms all keys of an object from camelCase to snake_case.
 * Only transforms the top-level keys, not nested objects.
 *
 * @param {object} obj - The object whose keys should be transformed.
 * @returns {Record<string, unknown>} A new object with snake_case keys.
 *
 * @example
 * const input = { firstName: 'John', lastName: 'Doe' };
 * transformObjectKeysCamelToSnake(input);
 * // Returns: { first_name: 'John', last_name: 'Doe' }
 */
export const transformObjectKeysCamelToSnake = (
  obj: object
): Record<string, unknown> => {
  if (typeof obj === 'object' && obj) {
    return Object.keys(obj).reduce<Record<string, unknown>>(
      (result, attributeName) => {
        // @ts-expect-error - since this method for mapping various data skip the type check from TSC.
        result[camelToSnakeCase(attributeName)] = obj[attributeName];

        return result;
      },
      {}
    );
  }

  return {};
};
