# @irfanandriansyah1997/compiler

A pre-configured compiler toolkit for building TypeScript/JavaScript packages with Rollup, SWC, and TypeScript. This package simplifies the bundling process by providing sensible defaults while allowing customization.

## Installation

```bash
# Using npm
npm install @irfanandriansyah1997/compiler --save-dev

# Using pnpm
pnpm add @irfanandriansyah1997/compiler -D

# Using yarn
yarn add @irfanandriansyah1997/compiler -D
```

### Peer Dependencies

Make sure to install the required peer dependencies:

```bash
pnpm add -D @rollup/plugin-commonjs @rollup/plugin-swc @rollup/plugin-typescript @swc/cli @swc/core rollup typescript typescript-transform-paths
```

## API Reference

### Exports

| Export Path | Description |
|-------------|-------------|
| `@irfanandriansyah1997/compiler/rollup` | Rollup configuration helper (ESM) |
| `@irfanandriansyah1997/compiler/rollup.cjs` | Rollup configuration helper (CommonJS) |
| `@irfanandriansyah1997/compiler/tsconfig.json` | Base TypeScript configuration |

---

## Usage

### 1. Rollup Configuration

The `rollupConfig` function generates a complete Rollup configuration with dual output (ESM + CommonJS).

#### Basic Usage

```javascript
// rollup.config.js
const { rollupConfig } = require('@irfanandriansyah1997/compiler/rollup.cjs');

module.exports = rollupConfig({
  baseDir: __dirname
});
```

Or using ESM:

```javascript
// rollup.config.mjs
import { rollupConfig } from '@irfanandriansyah1997/compiler/rollup';

export default rollupConfig({
  baseDir: import.meta.dirname
});
```

#### Advanced Usage with Custom Plugins

```javascript
const { rollupConfig } = require('@irfanandriansyah1997/compiler/rollup.cjs');
const copy = require('rollup-plugin-copy');

module.exports = rollupConfig({
  baseDir: __dirname,
  cjsConfig: {
    defaultIsModuleExports: true,
    esmExternals: true
  },
  inputPlugins: [
    copy({
      targets: [{ src: 'src/assets/*', dest: 'dist/assets' }]
    })
  ],
  outputPlugins: []
});
```

#### `rollupConfig` Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `baseDir` | `string` | ✅ | - | The base directory for resolving files (usually `__dirname`) |
| `cjsConfig` | `RollupCommonJSOptions` | ❌ | `{ defaultIsModuleExports: true, esmExternals: true }` | CommonJS plugin configuration |
| `inputPlugins` | `InputPluginOption[]` | ❌ | `[]` | Additional Rollup input plugins |
| `outputPlugins` | `OutputPluginOption[]` | ❌ | `[]` | Additional Rollup output plugins |

#### Output Structure

The configuration generates two outputs in the `dist` directory:

```
dist/
├── [module].esm.js      # ES Module format
├── [module].esm.js.map  # Source map for ESM
├── [module].js          # CommonJS format
└── [module].js.map      # Source map for CJS
```

#### File Collection Behavior

- Automatically collects all `.ts` and `.tsx` files from the `src` directory
- Excludes test files (`*.test.ts`, `*.test.tsx`)
- Excludes storybook files (`*.stories.ts`, `*.stories.tsx`)
- Excludes type declaration files (`*.d.ts`)
- Excludes setup files (`setup-test.*`)

---

### 2. TypeScript Configuration

Extend the base TypeScript configuration in your project:

```json
// tsconfig.json
{
  "extends": "@irfanandriansyah1997/compiler/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Base Configuration Features

The provided `tsconfig.json` includes:

- **Strict Mode**: Full TypeScript strict mode enabled
- **Modern ES Support**: Supports ES5 through ES2020 features
- **React Support**: JSX configured for React
- **Path Transformation**: Uses `typescript-transform-paths` for path alias resolution
- **Declaration Files**: Configured to emit declaration files

---

### 3. Custom SWC Configuration (Optional)

You can customize SWC behavior by creating a `.swcrc` file in your project root:

```json
// .swcrc
{
  "jsc": {
    "transform": {
      "react": {
        "runtime": "automatic"
      }
    },
    "parser": {
      "syntax": "typescript",
      "tsx": true
    }
  }
}
```

If no `.swcrc` file is found, the default configuration uses React automatic runtime.

---

## Complete Example

### Project Structure

```
my-package/
├── src/
│   ├── index.ts
│   ├── utils/
│   │   └── helper.ts
│   └── components/
│       └── Button.tsx
├── package.json
├── rollup.config.cjs
├── tsconfig.json
└── tsconfig.build.json
```

### `package.json`

```json
{
  "name": "my-package",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "rollup -c --bundleConfigAsCjs"
  },
  "devDependencies": {
    "@irfanandriansyah1997/compiler": "^2.0.0",
    "@rollup/plugin-commonjs": "^28.0.0",
    "@rollup/plugin-swc": "^0.4.0",
    "@rollup/plugin-typescript": "^12.0.0",
    "@swc/cli": "^0.6.0",
    "@swc/core": "^1.11.0",
    "rollup": "^4.0.0",
    "typescript": "^5.0.0",
    "typescript-transform-paths": "^3.0.0"
  }
}
```

### `rollup.config.cjs`

```javascript
const { rollupConfig } = require('@irfanandriansyah1997/compiler/rollup.cjs');

module.exports = rollupConfig({
  baseDir: __dirname
});
```

### `tsconfig.json`

```json
{
  "extends": "@irfanandriansyah1997/compiler/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```