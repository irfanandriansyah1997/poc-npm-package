import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks using DOMPurify.
 * Works in both server-side (SSR) and client-side (CSR) environments.
 *
 * @param {string} text - The HTML string to sanitize.
 * @returns {string} The sanitized HTML string with potentially dangerous content removed.
 *
 * @example
 * // Removes script tags and event handlers
 * sanitizeHTML('<div onclick="alert(1)">Hello</div>');
 * // Returns: '<div>Hello</div>'
 *
 * @example
 * // Preserves safe HTML
 * sanitizeHTML('<p>Hello <strong>World</strong></p>');
 * // Returns: '<p>Hello <strong>World</strong></p>'
 */
export const sanitizeHTML = (text: string): string => {
  try {
    // INFO: sanitize the HTML content on SSR & import the jsdom move into inside the method
    if (typeof window === 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { JSDOM } = require('jsdom');
      const window = new JSDOM('').window;
      const purify = DOMPurify(window);

      return purify.sanitize(text);
    }

    // INFO: sanitize the HTML content on CSR
    return DOMPurify.sanitize(text);
  } catch {
    return text;
  }
};
