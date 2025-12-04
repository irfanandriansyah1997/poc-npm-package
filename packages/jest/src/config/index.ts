import type { Config as SWCConfig } from '@swc/core';
import fs from 'fs';
import type { Config as JestConfig } from 'jest';
import path from 'path';

/////////////////////////////////////////////////////////////////////////////
// Generate swc configuration
/////////////////////////////////////////////////////////////////////////////

/**
 * Generates an SWC configuration based on a given base directory and module format.
 * Attempts to load an SWC config from `.cb-swcrc`, falling back to a default React configuration.
 *
 * @returns {SWCConfig} The generated SWC configuration.
 */
const generateSWCConfig = (baseDir: string): SWCConfig => {
  /**
   * Attempts to load SWC configuration from `.fit-swcrc` file.
   * If the file is not found, it falls back to a default configuration for React (automatic runtime).
   *
   * @type {SWCConfig} swcConfig - SWC configuration object.
   */
  let swcConfig: SWCConfig = {};

  try {
    const swcConfigPath = path.resolve(baseDir, '.cb-swcrc');
    swcConfig = JSON.parse(fs.readFileSync(swcConfigPath, 'utf-8'));
  } catch {
    swcConfig = {
      jsc: {
        transform: {
          react: {
            runtime: 'automatic'
          }
        }
      }
    };
  }

  return swcConfig;
};

interface JestConfigArgs {
  baseDir: string;
  config?: JestConfig;
}

/**
 * Generates a Jest configuration object with SWC transformation settings.
 *
 * @param {JestConfigArgs} args - The initial Jest configuration object.
 * @returns {JestConfig} - The Jest configuration object with SWC settings and additional configurations.
 */
export const jestConfig = (args: JestConfigArgs): JestConfig => {
  const { baseDir, config } = args;

  let formattedArgs: Partial<JestConfig> = {};
  if (config) formattedArgs = config;

  const {
    collectCoverageFrom,
    coverageReporters,
    moduleFileExtensions,
    moduleNameMapper,
    roots,
    setupFiles,
    setupFilesAfterEnv,
    testMatch,
    transform,
    transformIgnorePatterns,
    watchPlugins
  } = formattedArgs;

  return {
    ...formattedArgs,
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.{ts,tsx}', ...(collectCoverageFrom || [])],
    coverageReporters: ['json', 'html', ...(coverageReporters || [])],
    moduleFileExtensions: [
      'js',
      'jsx',
      'ts',
      'tsx',
      ...(moduleFileExtensions || [])
    ],
    moduleNameMapper: {
      // Handle CSS imports (without CSS modules)
      '^.+\\.(css|sass|scss)$': require.resolve('../mock-test/style.mock.js'),

      // Handle image imports
      '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp)$': require.resolve(
        `../mock-test/file.mock.js`
      ),

      // Handle SVG imports separately to make overriding easy
      '^.+\\.(svg)$': require.resolve(`../mock-test/file.mock.js`),

      /**
       * Handle CSS imports (with CSS modules)
       * @see https://jestjs.io/docs/webpack#mocking-css-modules
       */
      '^.+\\.module\\.(css|sass|scss)$':
        require.resolve('../mock-test/style.mock.js'),

      ...(moduleNameMapper || {})
    },
    passWithNoTests: true,
    resetMocks: false,
    roots: ['<rootDir>/src', ...(roots || [])],
    setupFiles: [...(setupFiles || [])],
    setupFilesAfterEnv: [...(setupFilesAfterEnv || [])],
    testEnvironment: 'jest-environment-jsdom',
    testMatch: [
      '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
      ...(testMatch || [])
    ],
    transform: {
      '^.+\\.(t|j)sx?$': [
        '@swc/jest',
        generateSWCConfig(baseDir) as Record<string, unknown>
      ],
      ...(transform || {})
    },
    transformIgnorePatterns: [...(transformIgnorePatterns || [])],
    watchPlugins: [
      'jest-watch-typeahead/filename',
      'jest-watch-typeahead/testname',
      ...(watchPlugins || [])
    ]
  };
};
