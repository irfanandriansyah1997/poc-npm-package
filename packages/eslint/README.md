# ESLint Template

These packages offer ESLint configuration templates that can be applied to any JavaScript or TypeScript project. Currently, you're required to upgrade to the latest major version of ESLint (9.x.x).

## Installation

To install this package, use your preferred package manager:

### Using pnpm
```bash
pnpm add -D @irfanandriansyah1997/eslint
```

### Using npm
```bash
npm install --dev @irfanandriansyah1997/eslint
```

### Using yarn
```bash
yarn add -D @irfanandriansyah1997/eslint
```

## How to used
We currently provide two templates: one for React projects and another for non-React JavaScript projects. Starting with ESLint version 9, we now use flat configuration for defining ESLint configuration. Here are the steps to use the ESLint configuration:

### 1. Install Package & remove ESLint and ESLint plugin package
Before creating the configuration file, please remove all existing ESLint and ESLint plugin packages. Then, you can install the ESLint package using yarn, npm, or pnpm, which will automatically install the necessary peer dependencies.

```bash
pnpm add -D @irfanandriansyah1997/eslint $(pnpm info @irfanandriansyah1997/eslint peerDependencies --json  | jq -r 'keys[]')
```

### 2. Import the ESLint configuration
Once you already create a new file configuration you can directly to import the eslint. Here a snippet how to implement eslint configuration

```js
const eslintConfig = require('@irfanandriansyah1997/eslint/react.js');

module.exports = eslintConfig([
  {
    ignores: [
      'etc/*',
      'dist/*',
      'node_modules/*',
      'jest.config.mjs',
      ...ignoredGeneratedFile
    ],
  },
  // You can adding other eslint rules in this section here
]);

```

As shown in the snippet, only the ignored files configuration is provided. To add new rules, simply include a new object within the array. You can refer to the documentation through this [link](https://eslint.org/docs/latest/use/configure/rules) to learn more about adding ESLint rules.

### 3. Replace command run eslint on package json
In your package.json, you can simplify the ESLint command by just using eslint, as the files to be linted are already specified in the ESLint configuration. Here's the update you'll need to make in the package.json file:

```json
{
  ...
  "scripts": {
    "lint": "eslint",
    ...
  },
}
```

And that's it! You've successfully set up the latest version of ESLint and installed the our custom eslint package.
