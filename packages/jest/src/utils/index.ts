/* eslint-disable @typescript-eslint/no-explicit-any */

import '@testing-library/jest-dom';

type JestMatchersType = Omit<
  ReturnType<typeof expect>,
  'not' | 'rejects' | 'resolves'
>;

type GenericJestMatcherType<J, T extends keyof JestMatchersType> = (
  ...args: Parameters<JestMatchersType[T]>
) => JestBuilder<J>;

/**
 * A utility class for building Jest assertions in a fluent style.
 * @template T - The type of DOM element or object under test.
 */
export class JestBuilder<T = HTMLElement> {
  private obj: T;

  private isPreviousContainsNot = false;

  /**
   * Constructs a new JestBuilder instance.
   * @param {T} args - The DOM element or object under test.
   */
  constructor(args: T) {
    this.obj = args;
  }

  /**
   * Generates a test case for a matcher method.
   * @private
   * @template Key - The key of the matcher method.
   * @param {Key} methodName - The name of the matcher method.
   * @param {...Parameters<JestMatchersType[Key]>} args - Arguments for the matcher method.
   * @returns {JestBuilder<T>} - The current JestBuilder instance.
   */
  private _generateTestCase<Key extends keyof JestMatchersType>(
    methodName: Key,
    ...args: Parameters<JestMatchersType[Key]>
  ) {
    if (this.isPreviousContainsNot) {
      // INFO: reset the test case
      this.isPreviousContainsNot = false;

      // @ts-expect-error: For testing purpose
      return expect(this.obj).not[methodName](...args);
    }

    // @ts-expect-error: For testing purpose
    return expect(this.obj)[methodName](...args);
  }

  public get not(): JestBuilder<T> {
    this.isPreviousContainsNot = true;
    return this;
  }

  public toThrow: GenericJestMatcherType<T, 'toThrow'> = (...args) => {
    this._generateTestCase('toThrow', ...args);
    return this;
  };

  public toBeInTheDocument: GenericJestMatcherType<T, 'toBeInTheDocument'> = (
    ...args
  ) => {
    this._generateTestCase('toBeInTheDocument', ...args);
    return this;
  };

  public toHaveTextContent: GenericJestMatcherType<T, 'toHaveTextContent'> = (
    ...args
  ) => {
    this._generateTestCase('toHaveTextContent', ...args);
    return this;
  };

  public toHaveAttribute: GenericJestMatcherType<T, 'toHaveAttribute'> = (
    ...args
  ) => {
    this._generateTestCase('toHaveAttribute', ...args);
    return this;
  };

  public toHaveClass: GenericJestMatcherType<T, 'toHaveClass'> = (...args) => {
    this._generateTestCase('toHaveClass', ...args);
    return this;
  };

  public toHaveLength: GenericJestMatcherType<T, 'toHaveLength'> = (
    ...args
  ) => {
    this._generateTestCase('toHaveLength', ...args);
    return this;
  };

  public toBeDisabled: GenericJestMatcherType<T, 'toBeDisabled'> = (
    ...args
  ) => {
    this._generateTestCase('toBeDisabled', ...args);
    return this;
  };

  public toStrictEqual: GenericJestMatcherType<T, 'toStrictEqual'> = (
    ...args
  ) => {
    this._generateTestCase('toStrictEqual', ...args);
    return this;
  };

  public toHaveFocus: GenericJestMatcherType<T, 'toHaveFocus'> = (...args) => {
    this._generateTestCase('toHaveFocus', ...args);
    return this;
  };

  public toHaveValue: GenericJestMatcherType<T, 'toHaveValue'> = (...args) => {
    this._generateTestCase('toHaveValue', ...args);
    return this;
  };

  public toHaveFormValues: GenericJestMatcherType<T, 'toHaveFormValues'> = (
    ...args
  ) => {
    this._generateTestCase('toHaveFormValues', ...args);
    return this;
  };

  public toBeNull: GenericJestMatcherType<T, 'toBeNull'> = (...args) => {
    this._generateTestCase('toBeNull', ...args);
    return this;
  };

  public toBeUndefined: GenericJestMatcherType<T, 'toBeUndefined'> = (
    ...args
  ) => {
    this._generateTestCase('toBeUndefined', ...args);
    return this;
  };

  public toBe: GenericJestMatcherType<T, 'toBe'> = (...args) => {
    this._generateTestCase('toBe', ...args);
    return this;
  };

  public toBeCalled: GenericJestMatcherType<T, 'toBeCalled'> = (...args) => {
    this._generateTestCase('toBeCalled', ...args);
    return this;
  };

  public toHaveBeenCalled: GenericJestMatcherType<T, 'toHaveBeenCalled'> = (
    ...args
  ) => {
    this._generateTestCase('toHaveBeenCalled', ...args);
    return this;
  };

  public toBeCalledTimes: GenericJestMatcherType<T, 'toBeCalledTimes'> = (
    ...args
  ) => {
    this._generateTestCase('toBeCalledTimes', ...args);
    return this;
  };

  public toHaveBeenCalledTimes: GenericJestMatcherType<
    T,
    'toHaveBeenCalledTimes'
  > = (...args) => {
    this._generateTestCase('toHaveBeenCalledTimes', ...args);
    return this;
  };

  public toHaveBeenCalledWith: GenericJestMatcherType<
    T,
    'toHaveBeenCalledWith'
  > = (...args) => {
    this._generateTestCase('toHaveBeenCalledWith', ...args);
    return this;
  };

  public nthCalledWith: GenericJestMatcherType<T, 'nthCalledWith'> = (
    ...args
  ) => {
    this._generateTestCase('nthCalledWith', ...args);
    return this;
  };

  public toHaveBeenNthCalledWith: GenericJestMatcherType<
    T,
    'toHaveBeenNthCalledWith'
  > = (...args) => {
    this._generateTestCase('toHaveBeenNthCalledWith', ...args);
    return this;
  };

  public toBeChecked: GenericJestMatcherType<T, 'toBeChecked'> = (...args) => {
    this._generateTestCase('toBeChecked', ...args);
    return this;
  };

  public toHaveStyle: GenericJestMatcherType<T, 'toHaveStyle'> = (...args) => {
    this._generateTestCase('toHaveStyle', ...args);
    return this;
  };

  public toBeEmptyDOMElement: GenericJestMatcherType<T, 'toBeEmptyDOMElement'> =
    (...args) => {
      this._generateTestCase('toBeEmptyDOMElement', ...args);
      return this;
    };

  /**
   * Static factory method for creating JestBuilder instances for testing.
   * @static
   * @param {*} args - The DOM element or object under test.
   * @returns {JestBuilder<*>} - A JestBuilder instance.
   */
  // INFO: for testing purpose

  public static test(args: any) {
    return new JestBuilder(args);
  }
}

interface GetJestMockArgumentArgs<Args extends any[], Results> {
  mockFn: jest.Mock<Results, Args>;
  mockPosition: number;
}

interface GetJestMockArgumentResponseType<Args extends any[], Results> {
  arguments?: Args;
  results?: jest.MockResult<Results>;
}

/**
 * Retrieves the arguments and result of a specific call to a Jest mock function.
 *
 * @template Args - The type of arguments the mock function accepts.
 * @template Results - The type of result the mock function returns.
 *
 * @param {GetJestMockArgumentArgs<Args, Results>} args - The arguments containing the mock function and call position.
 * @returns {GetJestMockArgumentResponseType<Args, Results> | undefined} The arguments and result of the specified call, or undefined if the position is invalid.
 */
export function getJestMockArgument<Args extends any[] = any[], Results = any>(
  args: GetJestMockArgumentArgs<Args, Results>
): GetJestMockArgumentResponseType<Args, Results> | undefined {
  const { mockFn, mockPosition } = args;
  try {
    const {
      mock: { calls, results }
    } = mockFn;

    return {
      arguments: calls[mockPosition],
      results: results[mockPosition]
    };
  } catch {
    return undefined;
  }
}
