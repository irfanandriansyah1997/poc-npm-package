import type { Linter } from 'eslint';

import eslintJestConfig from './config/jest';
import eslintSharedConfig from './config/shared';
import { hofEslintConfigGenerator } from './utils/eslint-config';

const templateEslintReactPreCommit: Linter.Config[] = [
  ...eslintSharedConfig('.tmp_staging/**'),
  ...eslintJestConfig('.tmp_staging/**/__tests__'),
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        project: ['./tsconfig.pre-commit.json'],
        sourceType: 'module',
        tsconfigRootDir: '.'
      }
    }
  }
];

const eslintNonReactPreCommit = hofEslintConfigGenerator({
  defaultConfig: templateEslintReactPreCommit,
  isPreCommit: true
});

export default eslintNonReactPreCommit;
