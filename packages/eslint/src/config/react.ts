import type { Linter } from 'eslint';
import eslintJsxA11y from 'eslint-plugin-jsx-a11y';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const eslintReactConfig = (
  tsConfigPath = './tsconfig.json'
): Linter.Config[] => {
  return [
    eslintPluginReact.configs.flat.recommended,
    eslintPluginReact.configs.flat['jsx-runtime'],
    {
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          project: [tsConfigPath],
          sourceType: 'module',
          tsconfigRootDir: '.'
        }
      },
      rules: {
        'react/display-name': 'off',
        'react/no-unescaped-entities': 'off',
        'react/prop-types': 'off'
      },
      settings: {
        react: { version: 'detect' }
      }
    },
    {
      plugins: {
        'react-hooks': eslintPluginReactHooks
      },
      rules: eslintPluginReactHooks.configs.recommended.rules
    },
    eslintJsxA11y.flatConfigs.recommended,
    {
      languageOptions: {
        ...eslintJsxA11y.flatConfigs.recommended.languageOptions,
        globals: {
          ...globals.serviceworker,
          ...globals.browser
        }
      }
    }
  ];
};

export default eslintReactConfig;
