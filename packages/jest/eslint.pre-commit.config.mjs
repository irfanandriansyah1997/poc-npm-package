import eslintConfig from '@irfanandriansyah1997/eslint/react-pre-commit.cjs';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { 'js-file': jsFiles } = require('./etc/config/entrypoint-file.json');

const ignoredGeneratedFile = jsFiles.reduce((result, item) => {
  const { name } = item;

  result.push(
    ...[
      `.tmp_staging/${name}.js`,
      `.tmp_staging/${name}.d.ts`,
      `.tmp_staging/${name}.esm.js`,
      `.tmp_staging/${name}.esm.d.ts`
    ]
  );
  return result;
}, []);

export default eslintConfig([
  {
    plugins: {
      'simple-import-sort': eslintPluginSimpleImportSort
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^@?\\w'],
            [
              '^\\u0000',
              '^\\.\\.(?!/?$)',
              '^\\.\\./?$',
              '^\\./(?=.*/)(?!/?$)',
              '^\\.(?!/?$)',
              '^\\./?$'
            ]
          ]
        }
      ]
    }
  },
  {
    ignores: [
      '.tmp_staging/eslint.config.js',
      '.tmp_staging/eslint.config.mjs',
      '.tmp_staging/eslint.config.cjs',
      '.tmp_staging/eslint.pre-commit.config.js',
      '.tmp_staging/eslint.pre-commit.config.mjs',
      '.tmp_staging/eslint.pre-commit.config.cjs',
      '.tmp_staging/etc/*',
      '.tmp_staging/dist/*',
      '.tmp_staging/node_modules/*',
      '.tmp_staging/jest.config.cjs',
      '.tmp_staging/coverage/*',
      '.tmp_staging/rollup.config.cjs',
      ...ignoredGeneratedFile
    ]
  },
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        project: ['./tsconfig.pre-commit.json'],
        sourceType: 'module',
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
]);
