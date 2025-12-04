import type { Linter } from 'eslint';

import eslintJestConfig from './config/jest';
import eslintSharedConfig from './config/shared';
import { hofEslintConfigGenerator } from './utils/eslint-config';

const templateEslintNonReact: Linter.Config[] = [
  ...eslintSharedConfig(),
  ...eslintJestConfig(),
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        project: true,
        sourceType: 'module',
        tsconfigRootDir: '.'
      }
    }
  }
];

const eslintNonReact = hofEslintConfigGenerator({
  defaultConfig: templateEslintNonReact
});

export default eslintNonReact;
