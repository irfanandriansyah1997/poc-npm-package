import type { RollupCommonJSOptions } from '@rollup/plugin-commonjs';
import commonjs from '@rollup/plugin-commonjs';
import swc from '@rollup/plugin-swc';
import typescript from '@rollup/plugin-typescript';
import type { CommonJsConfig, Config, Es6Config } from '@swc/core';
import fs from 'fs';
import path from 'path';
import type {
  InputPluginOption,
  OutputPluginOption,
  RollupOptions
} from 'rollup';

/////////////////////////////////////////////////////////////////////////////
// Generate swc configuration
/////////////////////////////////////////////////////////////////////////////

interface GenerateSWCConfigArgs {
  baseDir: string;
  format: 'es6' | 'cjs';
}

/**
 * Generates an SWC configuration based on a given base directory and module format.
 * Attempts to load an SWC config from `.cb-swcrc`, falling back to a default React configuration.
 *
 * @param {GenerateSWCConfigArgs} args - The arguments for generating the SWC configuration.
 * @returns {Config} The generated SWC configuration.
 */
const generateSWCConfig = (args: GenerateSWCConfigArgs): Config => {
  const { baseDir, format } = args;
  /**
   * Attempts to load SWC configuration from `.fit-swcrc` file.
   * If the file is not found, it falls back to a default configuration for React (automatic runtime).
   *
   * @type {Config} swcConfig - SWC configuration object.
   */
  let swcConfig: Config = {};

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

  const es6Module: Es6Config = { type: 'es6' };
  const cjsModule: CommonJsConfig = { type: 'commonjs' };

  return {
    ...swcConfig,
    jsc: {
      ...swcConfig.jsc,
      baseUrl: baseDir
    },
    module: format === 'cjs' ? cjsModule : es6Module,
    sourceMaps: false
  };
};

/////////////////////////////////////////////////////////////////////////////
// Recursively find all .ts and .tsx files
/////////////////////////////////////////////////////////////////////////////

/**
 * Recursively retrieves all `.ts` and `.tsx` files from a given directory.
 *
 * @param {string} baseDir - The directory to search for TypeScript files.
 * @returns {string[]} An array of file paths for all `.ts` and `.tsx` files.
 */
const collectAllTSFiles = (baseDir: string): string[] => {
  const items = fs.readdirSync(baseDir);
  const result: string[] = [];

  items.forEach((item) => {
    const fullPath = path.join(baseDir, item);

    if (fs.statSync(fullPath).isDirectory()) {
      result.push(...collectAllTSFiles(fullPath));
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      result.push(fullPath);
    }
  });

  return result;
};

/**
 * Collects TypeScript entry files for Rollup, excluding test and storybook-related files.
 *
 * @param {string} baseDir - The base directory to search for TypeScript files.
 * @returns {Record<string, string>} An object mapping entry names to file paths.
 */

const collectEntryFiles = (baseDir: string): Record<string, string> => {
  const inputDir = 'src';
  const prohibitedFiles = [
    '.test.',
    'stories',
    '.d.',
    'storybook',
    'setup-test'
  ];

  return collectAllTSFiles(path.join(baseDir, inputDir)).reduce<
    Record<string, string>
  >((acc, file) => {
    const entry = path.relative(inputDir, file);
    const name = entry.replace(/\.[^/.]+$/, ''); // Remove file extension

    const isFileProhibited = Boolean(
      prohibitedFiles.find((item) => entry.includes(item))
    );

    // Ignore files you want to exclude
    if (!isFileProhibited) {
      acc[name] = path.join(inputDir, entry);
    }

    return acc;
  }, {});
};

/////////////////////////////////////////////////////////////////////////////
// Rollup Configuration
/////////////////////////////////////////////////////////////////////////////

interface RollupConfigArgs {
  baseDir: string;
  cjsConfig?: RollupCommonJSOptions;
  inputPlugins?: InputPluginOption[];
  outputPlugins?: OutputPluginOption[];
}

/**
 * Generates a Rollup configuration object.
 *
 * @param {RollupConfigArgs} args - Arguments to configure Rollup.
 * @returns {RollupOptions} The Rollup configuration object.
 */
export const rollupConfig = (args: RollupConfigArgs): RollupOptions => {
  const {
    baseDir,
    cjsConfig = { defaultIsModuleExports: true, esmExternals: true },
    inputPlugins = [],
    outputPlugins = []
  } = args;
  const outputDir = 'dist';

  return {
    input: collectEntryFiles(baseDir),
    output: [
      {
        dir: outputDir,
        entryFileNames: '[name].esm.js',
        format: 'es',
        plugins: [
          swc(generateSWCConfig({ baseDir, format: 'es6' })),
          ...outputPlugins
        ],
        sourcemap: true
      },
      {
        dir: outputDir,
        format: 'cjs',
        plugins: [
          swc(generateSWCConfig({ baseDir, format: 'es6' })),
          ...outputPlugins
        ],
        sourcemap: true
      }
    ],
    plugins: [commonjs(cjsConfig), typescript(), ...inputPlugins]
  };
};
