import type { ReactElement, ReactNode } from 'react';
import { Children, isValidElement } from 'react';

import { getValueWithOr } from '@/utils/parse';
import type { GenericCompoundComponentType } from '@/types/react';
import type { Maybe, NullAble } from '@/types/utils';

/////////////////////////////////////////////////////////////////////////////
// Compound Component Utils Section
/////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a React element has the correct COMPONENT_NAME static property.
 *
 * @param {any} element - The React element to check.
 * @param {string} componentName - The expected component name to match.
 * @returns {boolean} True if the element's COMPONENT_NAME matches the provided componentName.
 * @private
 */
const _isComponentNameCorrect = (
  // INFO: need to force casting to enable check the react element
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any,
  componentName: string
): element is GenericCompoundComponentType<Record<string, unknown>, string> => {
  if (Object.prototype.hasOwnProperty.call(element?.type, 'COMPONENT_NAME')) {
    const { COMPONENT_NAME: name } = element.type as unknown as Record<
      string,
      unknown
    >;

    return name === componentName;
  }

  return false;
};

/**
 * Checks if a React element has a matching `name` prop.
 *
 * @template P - The type of props expected on the element.
 * @param {any} element - The React element to check.
 * @param {string} propsName - The expected name prop value to match.
 * @returns {boolean} True if the element's `name` prop matches the provided propsName.
 * @private
 */
const _isPropsNameCorrect = <P>(
  // INFO: need to force casting to enable check the react element
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  element: any,
  propsName: string
): element is ReactElement<P> => {
  const compare = `${element?.props?.name}` || '';

  return compare === propsName;
};

/**
 * Checks if the provided element is a valid React element and its component name matches the specified name.
 *
 * @param element The element to check (ReactElement).
 * @param predicate the predicate to find. In this context we are using COMPONENT_NAME
 */
export const isCompoundComponentValid = <P>(
  element: Maybe<NullAble<unknown>>,
  predicate: string
): element is ReactElement<P> => {
  if (isValidElement(element)) {
    const isCoumpondValid = _isComponentNameCorrect(element, predicate);
    const isPropsNameValid = _isPropsNameCorrect(element, predicate);

    return isCoumpondValid || isPropsNameValid;
  }

  return false;
};

/////////////////////////////////////////////////////////////////////////////
// Shared DOM Utils
/////////////////////////////////////////////////////////////////////////////

/**
 * Checks if a compound component with the specified predicate exists within the children.
 *
 * @param {ReactNode} children - The React children to search through.
 * @param {string} predicate - The COMPONENT_NAME or name prop to match against.
 * @returns {boolean} True if a matching compound component is found among the children.
 *
 * @example
 * const hasHeader = doesElementExist(children, 'Header');
 * if (hasHeader) {
 *   // Render header section
 * }
 */
export const doesElementExist = (
  children: ReactNode,
  predicate: string
): boolean => {
  let isMatched = false;

  Children.forEach(children, (child) => {
    if (!isMatched && isCompoundComponentValid(child, predicate)) {
      isMatched = true;
    }
  });

  return isMatched;
};

/**
 * a helper function to find an element, the same as Array.prototype.find() more or less.
 *
 * @param children array of react child
 * @param predicate the predicate to find. In this context we are using COMPONENT_NAME
 */
export const findAndCloneChild = (
  children: ReactNode,
  predicate: string
): ReactElement | undefined => {
  let Element: ReactElement | null = null;
  let isMatched = false;

  Children.forEach(children, (child) => {
    if (!isMatched && isCompoundComponentValid(child, predicate)) {
      isMatched = true;
      Element = child;
    }
  });

  if (!isValidElement(Element)) return undefined;

  return Element;
};

/**
 * Finds all compound components matching the predicate and extracts their props.
 *
 * @template T - The type of props to extract from the matching elements.
 * @param {ReactNode} children - The React children to search through.
 * @param {string} predicate - The COMPONENT_NAME or name prop to match against.
 * @returns {T[]} An array of props objects from all matching compound components.
 *
 * @example
 * interface TabProps {
 *   label: string;
 *   content: ReactNode;
 * }
 * const tabProps = findAndExtractProps<TabProps>(children, 'Tab');
 * // Returns: [{ label: 'Tab 1', content: ... }, { label: 'Tab 2', content: ... }]
 */
export function findAndExtractProps<T = unknown>(
  children: ReactNode,
  predicate: string
): T[] {
  const result: T[] = [];

  Children.forEach(children, (child) => {
    if (isCompoundComponentValid(child, predicate) && isValidElement(child)) {
      result.push(child.props as T);
    }
  });

  return result;
}

/**
 * Extracts all data attributes from an HTML element and returns them as an object.
 * Converts camelCase dataset keys back to kebab-case data attribute format.
 *
 * @param {HTMLElement} element - The HTML element to extract data attributes from.
 * @returns {Record<`data-${string}`, string | number | boolean>} An object containing all data attributes with their original kebab-case names.
 *
 * @example
 * // Given: <div data-user-id="123" data-is-active="true"></div>
 * const attrs = getDataAttributes(element);
 * // Returns: { 'data-user-id': '123', 'data-is-active': 'true' }
 */
export const getDataAttributes = (
  element: HTMLElement
): Record<`data-${string}`, string | number | boolean> => {
  return Object.fromEntries(
    Object.entries(element.dataset).map(([key, value]) => [
      'data-' + key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()),
      value
    ])
  ) as Record<`data-${string}`, string | number | boolean>;
};

/**
 * Safely retrieves an HTML element by its ID.
 * Returns null if the element is not found instead of undefined.
 *
 * @param {string} id - The ID of the element to retrieve.
 * @returns {NullAble<HTMLElement>} The HTML element if found, otherwise null.
 *
 * @example
 * const header = getElementById('main-header');
 * if (header) {
 *   header.classList.add('visible');
 * }
 */
export const getElementById = (id: string): NullAble<HTMLElement> => {
  return getValueWithOr({
    defaultValue: null,
    value: document.getElementById(id)
  });
};

/**
 * Safely retrieves an HTML element using a CSS selector.
 * Only returns the element if it is an instance of HTMLElement.
 *
 * @param {string} selector - The CSS selector to query.
 * @returns {NullAble<HTMLElement>} The HTML element if found and is an HTMLElement, otherwise null.
 *
 * @example
 * const button = getElementByQuerySelector('.submit-btn');
 * const input = getElementByQuerySelector('input[name="email"]');
 */
export const getElementByQuerySelector = (
  selector: string
): NullAble<HTMLElement> => {
  const element = getValueWithOr({
    defaultValue: null,
    value: document.querySelector(selector)
  });

  if (element instanceof HTMLElement) return element;

  return null;
};

/**
 * Arguments for loading a JavaScript script dynamically.
 *
 * @interface LoadScriptArgs
 * @property {number} [maxRetry=5] - Maximum number of retry attempts if loading fails.
 * @property {number} [retry=0] - Current retry attempt count (used internally for recursion).
 * @property {string} url - The URL of the JavaScript file to load.
 */
interface LoadJSScriptArgs {
  maxRetry?: number;
  retry?: number;
  url: string;
}

/**
 * Dynamically loads a JavaScript file by creating a script element and appending it to the document head.
 * Implements retry logic if the script fails to load.
 *
 * @param {LoadJSScriptArgs} args - The configuration arguments for loading the script.
 * @returns {Promise<boolean>} A promise that resolves to true if the script loaded successfully, false otherwise.
 *
 * @example
 * // Load a third-party script
 * const loaded = await loadJSScript({ url: 'https://cdn.example.com/lib.js' });
 * if (loaded) {
 *   console.log('Script loaded successfully');
 * }
 *
 * @example
 * // Load with custom retry settings
 * const loaded = await loadJSScript({
 *   url: 'https://cdn.example.com/lib.js',
 *   maxRetry: 3
 * });
 */
export async function loadJSScript(args: LoadJSScriptArgs): Promise<boolean> {
  const { maxRetry = 5, retry = 0, url } = args;

  if (retry === maxRetry) {
    return Promise.resolve(false);
  }

  const result = await new Promise<boolean>((resolve) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      resolve(false);
    };

    document.head.appendChild(script);
  });

  if (result) return true;

  const element = document.querySelector(`script[src="${url}"]`);
  if (element) element.remove();
  return loadJSScript({ ...args, retry: retry + 1 });
}
