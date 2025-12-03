import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort';
import eslintPluginSortDestructureKeys from 'eslint-plugin-sort-destructure-keys';
import eslintPluginSortKeysFix from 'eslint-plugin-sort-keys-fix';
import eslintPluginTypescriptSortKeys from 'eslint-plugin-typescript-sort-keys';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * @typedef {Object} CreateEslintConfigOptions
 * @property {Array<{name: string}>} jsFiles - List of JS entry point files
 * @property {string} [generatedFilePrefix=''] - Prefix for generated file paths
 * @property {string[]} [additionalIgnores=[]] - Additional ignore patterns
 * @property {boolean} [enableImportSort=false] - Enable simple-import-sort rules
 * @property {boolean} [enableConsistentTypeImports=false] - Enable consistent-type-imports rule
 * @property {string} [tsconfigPath] - Custom tsconfig path for type checking
 */

/**
 * Creates the ignored generated file patterns based on entry point files
 * @param {Array<{name: string}>} jsFiles
 * @param {string} prefix
 * @param {string[]} initialFiles
 * @returns {string[]}
 */
const createIgnoredGeneratedFiles = (
  jsFiles,
  prefix = '',
  initialFiles = []
) => {
  return jsFiles.reduce((result, item) => {
    const { name } = item;
    const prefixPath = prefix ? `${prefix}/` : '';

    result.push(
      ...[
        `${prefixPath}${name}.js`,
        `${prefixPath}${name}.d.ts`,
        `${prefixPath}${name}.esm.js`,
        `${prefixPath}${name}.esm.d.ts`
      ]
    );
    return result;
  }, initialFiles);
};

/**
 * Creates the base ESLint configuration shared across all configs
 * @returns {import('eslint').Linter.Config[]}
 */
const createBaseConfig = () => [
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
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error']
        }
      ],
      'no-unused-vars': 'off'
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true
        }
      }
    }
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [`**/*.js`],
    ...tseslint.configs.disableTypeChecked
  }
];

/**
 * Creates the formatting plugins configuration
 * @param {Object} options
 * @param {boolean} options.enableImportSort
 * @returns {import('eslint').Linter.Config[]}
 */
const createFormattingConfig = ({ enableImportSort }) => {
  const baseRules = {
    'prettier/prettier': 'error',
    'sort-destructure-keys/sort-destructure-keys': [
      'error',
      { caseSensitive: false }
    ],
    'sort-imports': 'off',
    'sort-keys-fix/sort-keys-fix': 'error',
    'typescript-sort-keys/interface': 'error',
    'typescript-sort-keys/string-enum': 'error'
  };

  const importSortRules = enableImportSort
    ? {
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
        ]
      }
    : {};

  return [
    eslintPluginPrettierRecommended,
    {
      plugins: {
        'simple-import-sort': eslintPluginSimpleImportSort,
        'sort-destructure-keys': eslintPluginSortDestructureKeys,
        'sort-keys-fix': eslintPluginSortKeysFix,
        'typescript-sort-keys': eslintPluginTypescriptSortKeys
      },
      rules: {
        ...baseRules,
        ...importSortRules
      }
    }
  ];
};

/**
 * Creates the TypeScript specific configuration
 * @param {Object} options
 * @param {boolean} options.enableConsistentTypeImports
 * @returns {import('eslint').Linter.Config[]}
 */
const createTypescriptConfig = ({ enableConsistentTypeImports }) => {
  if (!enableConsistentTypeImports) return [];

  return [
    {
      files: [`**/*.{ts,tsx}`],
      rules: {
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            disallowTypeAnnotations: false,
            prefer: 'type-imports'
          }
        ]
      }
    }
  ];
};

/**
 * Creates the parser options configuration
 * @param {Object} options
 * @param {string} [options.tsconfigPath]
 * @returns {import('eslint').Linter.Config[]}
 */
const createParserOptionsConfig = ({ tsconfigPath }) => {
  if (!tsconfigPath) return [];

  return [
    {
      languageOptions: {
        parserOptions: {
          ecmaVersion: 'latest',
          project: [tsconfigPath],
          sourceType: 'module'
        }
      }
    }
  ];
};

/**
 * Creates a complete ESLint configuration
 * @param {CreateEslintConfigOptions} options
 * @returns {import('eslint').Linter.Config[]}
 */
export const createEslintConfig = ({
  additionalIgnores = [],
  enableConsistentTypeImports = false,
  enableImportSort = false,
  generatedFilePrefix = '',
  jsFiles,
  tsconfigPath
}) => {
  const initialIgnoredFiles =
    generatedFilePrefix === ''
      ? ['index.js', 'index.d.ts', 'index.esm.js', 'index.esm.d.ts']
      : [];

  const ignoredGeneratedFiles = createIgnoredGeneratedFiles(
    jsFiles,
    generatedFilePrefix,
    initialIgnoredFiles
  );

  return [
    ...createBaseConfig(),
    ...createTypescriptConfig({ enableConsistentTypeImports }),
    ...createFormattingConfig({ enableImportSort }),
    {
      ignores: [...additionalIgnores, ...ignoredGeneratedFiles]
    },
    ...createParserOptionsConfig({ tsconfigPath })
  ];
};

export default createEslintConfig;
