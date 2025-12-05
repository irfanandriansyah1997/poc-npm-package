/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Represents all JavaScript primitive types.
 * Includes string, number, boolean, null, undefined, symbol, and bigint.
 *
 * @example
 * function isPrimitive(value: unknown): value is Primitive {
 *   return value === null || typeof value !== 'object';
 * }
 */
export type Primitive =
  | string
  | number
  | boolean
  | null
  | undefined
  | symbol
  | bigint;

/**
 * Creates a union type that allows specific literal values while still accepting
 * any value of the base type. Useful for providing autocomplete suggestions
 * while allowing custom values.
 *
 * @template LiteralType - The specific literal values to suggest.
 * @template BaseType - The base primitive type that extends Primitive.
 *
 * @example
 * // Provides autocomplete for 'sm', 'md', 'lg' but accepts any string
 * type Size = LiteralUnion<'sm' | 'md' | 'lg', string>;
 * const size: Size = 'sm'; // autocomplete works
 * const customSize: Size = 'xl'; // also valid
 *
 * @example
 * // Provides autocomplete for common ports but accepts any number
 * type Port = LiteralUnion<80 | 443 | 8080, number>;
 */
export type LiteralUnion<LiteralType, BaseType extends Primitive> =
  | LiteralType
  | (BaseType & Record<never, never>);

/**
 * Represents a type that can either hold a value of type T or null.
 * @template T - The type of value that can be nullable.
 * @typedef {T | null} NullAble
 * @example
 *
 * type X = NullAble<string> => string | null
 */
export type NullAble<T> = T | null;

/**
 * Represents a type that can either hold a value of type T or undefined.
 * @template T - The type of value that can be optional.
 * @typedef {T | undefined} Maybe
 * @example
 *
 * type X = Maybe<string> => string | undefined
 */
export type Maybe<T> = T | undefined;

/**
 * Represents a type where all properties are mutable.
 * @template T - The type of the object.
 * @typedef {{ -readonly [k in keyof T]: T[k] }} Mutable
 */
export type Mutable<T> = {
  -readonly [k in keyof T]: T[k];
};

/**
 * Recursively makes all properties of a type required, removing optional modifiers
 * from nested objects as well. Functions are preserved as-is.
 *
 * @template T - The type to make deeply required.
 *
 * @example
 * interface Config {
 *   host?: string;
 *   settings?: {
 *     timeout?: number;
 *     retries?: number;
 *   };
 * }
 *
 * type RequiredConfig = DeepRequired<Config>;
 * // All properties including nested ones are now required:
 * // { host: string; settings: { timeout: number; retries: number; } }
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object
    ? // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      T[P] extends Function
      ? T[P]
      : DeepRequired<T[P]>
    : T[P];
};

/**
 * Retrieves the inner type of an array or array-like structure.
 * @template T - The type of the array or array-like structure.
 * @param {T} arr - The array or array-like structure.
 * @returns {unknown} The inner type of the array or array-like structure.
 * @example
 *
 * const arr: Array<string> = ["a", "b"];
 * ArrayGetInnerType(typeof arr) => string;
 */
export type ArrayGetInnerType<T> = T extends
  | (any | null | undefined)[]
  | null
  | undefined
  ? NonNullable<NonNullable<T>[number]>
  : T extends (any | null | undefined)[]
    ? NonNullable<T[number]>
    : T extends any[] | null | undefined
      ? NonNullable<T>[number]
      : T extends any[]
        ? T[number]
        : T;

/**
 * Internal helper type that retrieves a field from an object by key,
 * supporting both regular keys and numeric string indices for arrays.
 *
 * @template T - The object type to index into.
 * @template K - The key to access.
 * @internal
 */
type GetIndexedField<T, K> = K extends keyof T
  ? T[K]
  : K extends `${number}`
    ? '0' extends keyof T
      ? undefined
      : number extends keyof T
        ? NonNullable<T[number]>
        : undefined
    : undefined;

/**
 * Internal helper type that wraps GetField to handle potentially undefined values.
 * Used for traversing nested paths where intermediate values might be undefined.
 *
 * @template T - The type to extract the field from.
 * @template Key - The key path to the field.
 * @internal
 */
type FieldWithPossiblyUndefined<T, Key> =
  | GetField<Exclude<T, undefined>, Key>
  | Extract<T, undefined>;

/**
 * Internal helper type that wraps GetIndexedField to handle potentially undefined values.
 * Used for accessing array elements where the array itself might be undefined.
 *
 * @template T - The type to extract the indexed field from.
 * @template Key - The index key to access.
 * @internal
 */
type IndexedFieldWithPossiblyUndefined<T, Key> =
  | GetIndexedField<Exclude<T, undefined>, Key>
  | Extract<T, undefined>;

/**
 * Retrieves the type of a field within an object, possibly including undefined.
 * @template T - The type of the object.
 * @template P - The type of the field path.
 * @example
 *
 * interface Address {
 *   postCode: string;
 *   street: Array<string>;
 * }
 *
 * interface User {
 *   address: Address;
 * }
 *
 * type UserStreet = GetField<User, 'address.street[0]'> => string
 */
export type GetField<T, P> = P extends `${infer Left}.${infer Right}`
  ? Left extends keyof T
    ? FieldWithPossiblyUndefined<NonNullable<T[Left]>, Right>
    : Left extends `${infer FieldKey}[${infer IndexKey}]`
      ? FieldKey extends keyof T
        ? FieldWithPossiblyUndefined<
            IndexedFieldWithPossiblyUndefined<
              NonNullable<T[FieldKey]>,
              IndexKey
            >,
            Right
          >
        : undefined
      : undefined
  : P extends keyof T
    ? NonNullable<T[P]>
    : P extends `${infer FieldKey}[${infer IndexKey}]`
      ? FieldKey extends keyof T
        ? IndexedFieldWithPossiblyUndefined<NonNullable<T[FieldKey]>, IndexKey>
        : undefined
      : undefined;

/**
 * Generates all possible dot-separated deep key paths of a deeply required object type `TObj`.
 *
 * This is used to create autocomplete-friendly union types of valid property paths in deeply nested objects,
 * including array indexing and recursion into array elements.
 *
 * @template TObj - The input object to extract deep keys from.
 *
 * @example
 * type Example = {
 *   user: {
 *     name: string;
 *     addresses: { city: string }[];
 *   };
 * };
 * type Keys = GetKeys<Example>;
 * // 'user' | 'user.name' | 'user.addresses' | 'user.addresses[0]' | 'user.addresses[0]city'
 */
export type GetKeys<T, Prev extends string = ''> =
  T extends ReadonlyArray<infer U>
    ? `${Prev}[${number}]` | GetKeys<U, `${Prev}[${number}]`>
    : T extends object
      ? {
          [K in keyof T & (string | number)]: T[K] extends Primitive
            ? `${Prev}${Prev extends '' ? '' : '.'}${K}`
            :
                | `${Prev}${Prev extends '' ? '' : '.'}${K}`
                | GetKeys<T[K], `${Prev}${Prev extends '' ? '' : '.'}${K}`>;
        }[keyof T & (string | number)]
      : never;
