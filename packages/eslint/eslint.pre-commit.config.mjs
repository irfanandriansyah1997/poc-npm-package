import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintPluginSortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import eslintPluginSortKeysFix from 'eslint-plugin-sort-keys-fix';
import eslintPluginTypescriptSortKeys from 'eslint-plugin-typescript-sort-keys';
import globals from 'globals';
import { createRequire } from 'node:module';
import tseslint from 'typescript-eslint';

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

export default [
  /////////////////////////////////////////////////////////////////////////////
  // Shared Config
  /////////////////////////////////////////////////////////////////////////////

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.commonjs, ...globals.node }
    }
  },
  {
    files: [`**/*.{js,cjs,ts,jsx,tsx}`],
    rules: {
      'import/default': 'off',
      'import/namespace': 'off',
      'import/no-named-as-default-member': 'off',
      'import/order': 'off',
      indent: 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': 'off'
    },
    settings: {
      'import/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx'] },
      'import/resolver': { typescript: { alwaysTryTypes: true } }
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [`**/*.{ts,tsx}`],
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { disallowTypeAnnotations: false, prefer: 'type-imports' }
      ],
      '@typescript-eslint/method-signature-style': ['error', 'property']
    }
  },
  {
    files: [`**/*.js`],
    ...tseslint.configs.disableTypeChecked
  },

  /////////////////////////////////////////////////////////////////////////////
  // Eslint Auto Formatting Pluggin
  /////////////////////////////////////////////////////////////////////////////

  eslintPluginPrettierRecommended,
  {
    plugins: {
      'simple-import-sort': eslintPluginSimpleImportSort,
      'sort-destructure-keys': eslintPluginSortDestructureKeys,
      'sort-keys-fix': eslintPluginSortKeysFix,
      'typescript-sort-keys': eslintPluginTypescriptSortKeys
    },
    rules: {
      'prettier/prettier': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^@?\\w'],
            ['@/utils', '@/config'],
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
      ],
      'sort-destructure-keys/sort-destructure-keys': [
        'error',
        { caseSensitive: false }
      ],
      'sort-imports': 'off',
      'sort-keys-fix/sort-keys-fix': 'error',
      'typescript-sort-keys/interface': 'error',
      'typescript-sort-keys/string-enum': 'error'
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
      '.tmp_staging/jest.config.js',
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
];
