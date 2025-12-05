import type { Maybe, NullAble } from '@/types/utils';

/**
 * Safely parses an input to a string.
 *
 * @param {unknown} input - The input to be parsed.
 * @returns {string} The parsed string or an empty string if parsing fails.
 */
export const safeParseToString = (input: unknown): string => {
  try {
    if (typeof input === 'undefined' || input === null) throw new Error();

    if (typeof input === 'string') return input;

    if (typeof input === 'number' || typeof input === 'boolean') {
      return String(input);
    }

    throw new Error();
  } catch {
    return '';
  }
};

/**
 * Safely parses an input to a number.
 *
 * @param {unknown} input - The input to be parsed.
 * @returns {number} The parsed number or 0 if parsing fails.
 */
export const safeParseToNumber = (input: unknown): number => {
  try {
    if (typeof input === 'undefined' || input === null) throw new Error();

    // If input is already a number, return it
    if (typeof input === 'number') {
      return input;
    }

    // If input is a string, try parsing it into a number
    if (typeof input === 'string') {
      const parsedNumber = Number(input);

      if (!isNaN(parsedNumber)) return parsedNumber;
    }

    throw new Error();
  } catch {
    return 0;
  }
};

/**
 * Safely parses a JSON string.
 *
 * @param {NullAble<Maybe<string>>} input - The JSON string to be parsed.
 * @param {T} defaultValue - The default value to return if parsing fails.
 * @returns {T} The parsed JSON object or the default value if parsing fails.
 */
export const safeParseJSON = <T>(
  input: NullAble<Maybe<string>>,
  defaultValue: T
): T => {
  try {
    if (typeof input === 'string') {
      return JSON.parse(input);
    }

    throw new Error();
  } catch {
    return defaultValue;
  }
};

/**
 * Safely stringifies an input to JSON.
 *
 * @param {unknown} input - The input to be stringified.
 * @returns {string} The stringified JSON or an empty string if stringification fails.
 */
export const safeStringifyJSON = (input: unknown) => {
  try {
    if (input === null || input === undefined) throw new Error();

    return JSON.stringify(input);
  } catch {
    return '';
  }
};

/**
 * Safely parses an input to a boolean.
 *
 * @param {unknown} input - The input to be parsed.
 * @returns {boolean} The parsed boolean or false if parsing fails.
 */
export const safeParseBoolean = (input: unknown): boolean => {
  try {
    if (typeof input === 'boolean') return input;

    if (typeof input === 'string' && (input === 'true' || input === 'false')) {
      return input === 'true';
    }

    throw new Error();
  } catch {
    return false;
  }
};

/**
 * Type guard that checks if a value is an object and has the specified attribute(s).
 * Useful for narrowing unknown types to specific object shapes.
 *
 * @template T - The expected object type to check against.
 * @param {any} args - The value to check.
 * @param {keyof T | Array<keyof T>} attributeName - The attribute name(s) that must exist on the object.
 * @returns {args is T} True if the value is an object with all specified attributes.
 *
 * @example
 * interface User { name: string; age: number; }
 * if (checkIsObject<User>(data, ['name', 'age'])) {
 *   console.log(data.name); // TypeScript knows data is User
 * }
 */
export const checkIsObject = <T extends object>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any,
  attributeName: keyof T | Array<keyof T>
): args is T => {
  if (typeof args === 'object' && args && !Array.isArray(args)) {
    if (Array.isArray(attributeName)) {
      const missingAttribute = attributeName.find((item) => {
        return !Object.prototype.hasOwnProperty.call(args, item);
      });

      return !missingAttribute;
    }

    return Object.prototype.hasOwnProperty.call(args, attributeName);
  }

  return false;
};

/**
 * Type guard that checks if a value is a Promise.
 * Checks for the presence of `then` and `catch` methods.
 *
 * @template T - The type of the resolved value.
 * @param {unknown} value - The value to check.
 * @returns {value is Promise<T>} True if the value is a Promise.
 *
 * @example
 * const maybePromise = fetchData();
 * if (checkIsPromise(maybePromise)) {
 *   maybePromise.then(data => console.log(data));
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkIsPromise<T = any>(value: unknown): value is Promise<T> {
  return Boolean(
    value &&
    typeof value === 'object' &&
    // @ts-expect-error irfan.andriansyah@tiket.com expected error for check promise data
    typeof value.then === 'function' &&
    // @ts-expect-error irfan.andriansyah@tiket.com expected error for check promise data
    typeof value.catch === 'function'
  );
}

/**
 * Arguments for getting a value with a default fallback.
 *
 * @template Value - The type of the value.
 * @template DefaultValue - The type of the default value (defaults to Value).
 * @interface GetValueArgs
 * @property {DefaultValue} defaultValue - The fallback value to use if value is falsy or nullish.
 * @property {Value} [value] - The optional value to check.
 */
interface GetValueArgs<Value, DefaultValue = Value> {
  defaultValue: DefaultValue;
  value?: Value;
}

/**
 * Returns the value if truthy, otherwise returns the default value.
 * Uses the OR (||) operator, so falsy values (0, '', false, null, undefined) will return the default.
 *
 * @template Value - The type of the value.
 * @template DefaultValue - The type of the default value.
 * @param {GetValueArgs<Value, DefaultValue>} args - The arguments containing value and defaultValue.
 * @returns {Value | DefaultValue} The value if truthy, otherwise the defaultValue.
 *
 * @example
 * getValueWithOr({ value: 'hello', defaultValue: 'default' }); // 'hello'
 * getValueWithOr({ value: '', defaultValue: 'default' }); // 'default' (empty string is falsy)
 * getValueWithOr({ value: 0, defaultValue: 10 }); // 10 (0 is falsy)
 */
export const getValueWithOr = <Value, DefaultValue = Value>(
  args: GetValueArgs<Value, DefaultValue>
): Value | DefaultValue => args.value || args.defaultValue;

/**
 * Returns the value if not null or undefined, otherwise returns the default value.
 * Uses the nullish coalescing operator (??), so only null and undefined trigger the default.
 * Unlike getValueWithOr, this preserves falsy values like 0, '', and false.
 *
 * @template Value - The type of the value.
 * @template DefaultValue - The type of the default value.
 * @param {GetValueArgs<Value, DefaultValue>} args - The arguments containing value and defaultValue.
 * @returns {Value | DefaultValue} The value if not nullish, otherwise the defaultValue.
 *
 * @example
 * getValueWithNullish({ value: 'hello', defaultValue: 'default' }); // 'hello'
 * getValueWithNullish({ value: '', defaultValue: 'default' }); // '' (empty string is preserved)
 * getValueWithNullish({ value: 0, defaultValue: 10 }); // 0 (0 is preserved)
 * getValueWithNullish({ value: null, defaultValue: 'default' }); // 'default'
 */
export const getValueWithNullish = <Value, DefaultValue = Value>(
  args: GetValueArgs<Value, DefaultValue>
): Value | DefaultValue => args.value ?? args.defaultValue;
