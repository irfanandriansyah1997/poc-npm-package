import { createRequire } from 'node:module';

import { createEslintConfig } from './etc/eslint/create-eslint-config.mjs';

const require = createRequire(import.meta.url);
const { 'js-file': jsFiles } = require('./etc/config/entrypoint-file.json');

export default createEslintConfig({
  additionalIgnores: [
    'etc/*',
    'dist/*',
    'node_modules/*',
    'jest.config.js',
    'coverage/*',
    'rollup.config.cjs'
  ],
  enableConsistentTypeImports: true,
  enableImportSort: true,
  jsFiles
});
