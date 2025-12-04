import type { Linter } from 'eslint';

import eslintJestConfig from './config/jest';
import eslintReactConfig from './config/react';
import eslintSharedConfig from './config/shared';
import { hofEslintConfigGenerator } from './utils/eslint-config';

const templateEslintReact: Linter.Config[] = [
  ...eslintSharedConfig(),
  ...eslintReactConfig(),
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

const eslintReact = hofEslintConfigGenerator({
  defaultConfig: templateEslintReact
});

export default eslintReact;
