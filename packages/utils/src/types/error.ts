/**
 * Represents a parsed stack trace frame with detailed location information.
 * Used by parseStackTrace utility to provide structured error location data.
 *
 * @interface FormattedStackTraceItemType
 * @property {number} column - The column number where the error occurred.
 * @property {string} file - The file path where the error occurred.
 * @property {string} function - The function name where the error occurred, or '<anonymous>' if unnamed.
 * @property {number} line - The line number where the error occurred.
 *
 * @example
 * const stackFrame: FormattedStackTraceItemType = {
 *   column: 15,
 *   file: '/src/utils/api.ts',
 *   function: 'fetchData',
 *   line: 42
 * };
 */
export interface FormattedStackTraceItemType {
  column: number;
  file: string;
  function: string;
  line: number;
}
