import type { Linter } from 'eslint';
import eslintPluginJest from 'eslint-plugin-jest';
import globals from 'globals';

const eslintJestConfig = (path = '**/__tests__'): Linter.Config[] => {
  return [
    {
      files: [`${path}/**/*.{js,cjs,ts,jsx,tsx}`],
      languageOptions: {
        globals: { ...globals.jest }
      },
      plugins: { jest: eslintPluginJest },
      rules: {
        ...eslintPluginJest.configs['flat/recommended'].rules,
        ...eslintPluginJest.configs['flat/style'].rules,
        'jest/expect-expect': [
          'error',
          {
            additionalTestBlockFunctions: [],
            assertFunctionNames: ['expect', 'JestBuilder.test']
          }
        ],
        'jest/no-mocks-import': 'off'
      }
    }
  ];
};

export default eslintJestConfig;
