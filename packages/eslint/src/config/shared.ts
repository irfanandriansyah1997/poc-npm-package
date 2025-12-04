import eslint from '@eslint/js';
import type { Linter } from 'eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginSortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import eslintPluginSortKeysFix from 'eslint-plugin-sort-keys-fix';
import eslintPluginTypescriptSortKeys from 'eslint-plugin-typescript-sort-keys';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const eslintSharedConfig = (path = '**'): Linter.Config[] => {
  return [
    /////////////////////////////////////////////////////////////////////////////
    // Shared Config
    /////////////////////////////////////////////////////////////////////////////

    {
      languageOptions: {
        globals: { ...globals.browser, ...globals.commonjs, ...globals.node }
      }
    },
    {
      files: [`${path}/*.{js,cjs,ts,jsx,tsx}`],
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
      files: [`${path}/*.js`],
      ...tseslint.configs.disableTypeChecked
    },
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

    /////////////////////////////////////////////////////////////////////////////
    // Eslint Auto Formatting Pluggin
    /////////////////////////////////////////////////////////////////////////////

    eslintPluginPrettierRecommended,
    {
      plugins: {
        'sort-destructure-keys': eslintPluginSortDestructureKeys,
        'sort-keys-fix': eslintPluginSortKeysFix,
        'typescript-sort-keys': eslintPluginTypescriptSortKeys
      },
      rules: {
        'prettier/prettier': 'error',
        'sort-destructure-keys/sort-destructure-keys': [
          'error',
          { caseSensitive: false }
        ],
        'sort-imports': 'off',
        'sort-keys-fix/sort-keys-fix': 'error',
        'typescript-sort-keys/interface': 'error',
        'typescript-sort-keys/string-enum': 'error'
      }
    }
  ];
};

export default eslintSharedConfig;
