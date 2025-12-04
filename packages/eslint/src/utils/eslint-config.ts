import type { Linter } from 'eslint';

import { DEFAULT_PRE_COMMIT_TEMP_DIR } from '@/constant';

/**
 * Normalize ESLint ignore configuration by adding additional paths.
 *
 * This function takes an ESLint configuration object and processes the `ignores` array.
 * It appends paths prefixed with `.tmp_staging/` to each item in the original `ignores` array
 * that doesn't already include `.tmp_staging`. This is useful for adding temporary staging
 * directories to the list of files ignored by ESLint.
 *
 * @param {Linter.Config} args - ESLint configuration object.
 * @returns {Linter.Config} - The modified ESLint configuration with updated ignore paths.
 */
const _normalizeEslintIgnore = (args: Linter.Config): Linter.Config => {
  if (!args) return {};

  const { ignores = [] } = args;

  let formattedEslintIgnore: string[] = [];

  if (Array.isArray(ignores) && ignores.length > 0) {
    formattedEslintIgnore = [...ignores];
    formattedEslintIgnore.push(
      ...ignores.reduce<string[]>((response, item) => {
        if (item && !item.includes(DEFAULT_PRE_COMMIT_TEMP_DIR)) {
          response.push(`${DEFAULT_PRE_COMMIT_TEMP_DIR}/${item}`);
        }

        return response;
      }, [])
    );
  }

  if (formattedEslintIgnore.length > 0) {
    return {
      ...args,
      ignores: formattedEslintIgnore
    };
  }

  return {
    ...args
  };
};

interface HOFEslintConfigGeneratorArgs {
  defaultConfig: Linter.Config | Linter.Config[];
  isPreCommit?: boolean;
}

/**
 * Higher-order function that generates an ESLint configuration.
 *
 * This function generates a custom ESLint configuration based on provided arguments.
 * It takes an object containing the default configuration and an optional `isPreCommit` flag.
 * The returned function can then be used to extend the configuration further by accepting
 * additional ESLint settings. If the `isPreCommit` flag is true, it will normalize the ESLint
 * ignores based on the logic provided by `_normalizeEslintIgnore`.
 *
 * @param {{ defaultConfig: import('eslint').Linter.Config[]; isPreCommit?: boolean }} hofArgs - Object containing configuration options.
 * @param {import('eslint').Linter.Config[]} hofArgs.defaultConfig - The default ESLint configuration.
 * @param {boolean} [hofArgs.isPreCommit=false] - Toggle to determine if the ESLint config is used for pre-commit. Defaults to `false`.
 * @returns {Function} - A function that takes additional arguments to extend the default configuration.
 */
export const hofEslintConfigGenerator = (
  hofArgs: HOFEslintConfigGeneratorArgs
) => {
  const { defaultConfig, isPreCommit = false } = hofArgs;
  const defaultIgnoreFile = {
    ignores: [
      'eslint.config.js',
      'eslint.config.mjs',
      'eslint.config.cjs',
      'eslint.pre-commit.config.js',
      'eslint.pre-commit.config.mjs',
      'eslint.pre-commit.config.cjs'
    ]
  };

  if (!isPreCommit) defaultIgnoreFile.ignores.push('.tmp_staging/*');

  /**
   * Extends the default ESLint configuration.
   *
   * @param {Linter.Config | Linter.Config[] | undefined} args - Additional ESLint configuration. Can be an object or an array.
   * @returns {Array} - Merged ESLint configuration.
   */
  return (
    args: Linter.Config | Linter.Config[] | undefined = undefined
  ): Linter.Config[] => {
    if (typeof args === 'object' && Array.isArray(args)) {
      return [
        ...(defaultConfig as Linter.Config[]),
        ...(isPreCommit
          ? [...args, defaultIgnoreFile].map(_normalizeEslintIgnore)
          : [...args, defaultIgnoreFile])
      ];
    }

    if (typeof args === 'object' && args) {
      return [
        defaultConfig as Linter.Config,
        ...(isPreCommit
          ? [args, defaultIgnoreFile].map(_normalizeEslintIgnore)
          : [args, defaultIgnoreFile])
      ];
    }

    return [];
  };
};
