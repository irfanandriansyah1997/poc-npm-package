import { createRequire } from 'node:module';

import { createEslintConfig } from './etc/eslint/create-eslint-config.mjs';

const require = createRequire(import.meta.url);
const { 'js-file': jsFiles } = require('./etc/config/entrypoint-file.json');

export default createEslintConfig({
  additionalIgnores: [
    '.tmp_staging/eslint.config.js',
    '.tmp_staging/eslint.config.mjs',
    '.tmp_staging/eslint.config.cjs',
    '.tmp_staging/eslint.pre-commit.config.js',
    '.tmp_staging/eslint.pre-commit.config.mjs',
    '.tmp_staging/eslint.pre-commit.config.cjs',
    '.tmp_staging/etc/*',
    '.tmp_staging/dist/*',
    '.tmp_staging/node_modules/*',
    '.tmp_staging/jest.config.js',
    '.tmp_staging/coverage/*',
    '.tmp_staging/rollup.config.cjs'
  ],
  enableConsistentTypeImports: false,
  enableImportSort: false,
  generatedFilePrefix: '.tmp_staging',
  jsFiles,
  tsconfigPath: './tsconfig.pre-commit.json'
});
