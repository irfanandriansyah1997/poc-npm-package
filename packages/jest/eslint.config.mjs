import eslintConfig from '@irfanandriansyah1997/eslint/react/index.cjs';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { 'js-file': jsFiles } = require('./etc/config/entrypoint-file.json');

const ignoredGeneratedFile = jsFiles.reduce(
  (result, item) => {
    const { name } = item;

    result.push(
      ...[`${name}.js`, `${name}.d.ts`, `${name}.esm.js`, `${name}.esm.d.ts`]
    );
    return result;
  },
  ['index.js', 'index.d.ts', 'index.esm.js', 'index.esm.d.ts']
);

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
      'etc/*',
      'dist/*',
      'node_modules/*',
      'jest.config.js',
      'coverage/*',
      'rollup.config.cjs',
      ...ignoredGeneratedFile
    ]
  },
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        project: ['./tsconfig.json'],
        sourceType: 'module',
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
]);
