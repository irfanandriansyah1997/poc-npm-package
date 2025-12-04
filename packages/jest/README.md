# Jest Package

This npm package provides a shared configuration and CLI for running Jest (unit tests) in your services. It includes a default template configuration that you can use and customize with the available parameters.


## Installation

To install this package, use your preferred package manager:

### Using pnpm
```bash
pnpm add @cashbound-id/jest
```

### Using npm
```bash
npm install @cashbound-id/jest
```

### Using yarn
```bash
yarn add @cashbound-id/jest
```

## How To Use

### Step 1: Create or Update Your Jest Config

In your project root, create a `jest.config.cjs` file (if it doesn't already exist) and import the configuration:

```js
import jestConfig from '@cashbound-id/jest';

export default jestConfig({
  collectCoverage: true,
  moduleNameMapper: {
    '@/(.*)$': '<rootDir>/src/$1'
  },
  setupFiles: ['jest-localstorage-mock'],
  setupFilesAfterEnv: ['<rootDir>/src/setup-test.ts']
});
```

### Step 2: Customize Configuration

The method accepts several arguments that can be adjusted based on your requirements:

| Argument      | Example Value  | Description |
|--------------|--------------|-------------|
| `baseDir`       | `__dirname`   | Defines the base directory used when compiling JavaScript files. |
| `config`  | `{}`          | Allows adding custom configuration. Refer to the Jest documentation for guidance. |

### Step 3: Adjust Command Running Jest

Since we offer a CLI for running unit tests, you can use our package's CLI command instead of the default test command.

```json
  "script": {
    ...
    "test": "cbd-jest"
    ...
  }
```