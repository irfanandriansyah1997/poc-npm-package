#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

/**
 * ============================================================================
 * SYNC-FILE SCRIPT
 * ============================================================================
 *
 * This script synchronizes the package.json exports and .gitignore based on
 * the configuration defined in `etc/config/entrypoint-file.json`.
 *
 * USAGE:
 *   node sync-file.cjs --file-name=<package-name>
 *
 * CONFIGURATION FILE STRUCTURE (entrypoint-file.json):
 * {
 *   "js-file": [...],
 *   "static-file": [...],
 *   "custom-config": [...]
 * }
 *
 * ============================================================================
 * CUSTOM-CONFIG DOCUMENTATION
 * ============================================================================
 *
 * The `custom-config` field allows you to define custom export configurations
 * that don't follow the standard `js-file` pattern. This is useful for:
 *
 * - Root exports (e.g., ".")
 * - Complex conditional exports
 * - Non-standard file patterns
 * - Exporting additional files like CSS, JSON, or other assets
 *
 * STRUCTURE:
 * {
 *   "custom-config": [
 *     {
 *       "name": "<export-path>",
 *       "export-config": { ... },
 *       "files-config": [ ... ]
 *     }
 *   ]
 * }
 *
 * FIELDS:
 * - name: The export path in package.json exports field
 *         Use "." for root export, or "./path" for subpath exports
 *
 * - export-config: The export configuration object that will be set as
 *                  the value of exports[name] in package.json
 *                  Can be a string or an object with import/require/types
 *
 * - files-config: Array of file paths to add to the "files" field in
 *                 package.json (for npm publish inclusion)
 *
 * ============================================================================
 * EXAMPLES
 * ============================================================================
 *
 * Example 1: Root export with conditional exports
 * {
 *   "custom-config": [
 *     {
 *       "name": ".",
 *       "export-config": {
 *         "import": "./dist/index.esm.js",
 *         "require": "./dist/index.cjs.js",
 *         "types": "./dist/index.d.ts"
 *       },
 *       "files-config": [
 *         "dist/index.esm.js",
 *         "dist/index.cjs.js",
 *         "dist/index.d.ts"
 *       ]
 *     }
 *   ]
 * }
 *
 * Example 2: Export CSS/SCSS files
 * {
 *   "custom-config": [
 *     {
 *       "name": "./styles",
 *       "export-config": "./dist/styles/main.css",
 *       "files-config": ["dist/styles/main.css"]
 *     }
 *   ]
 * }
 *
 * Example 3: Export with browser/node conditions
 * {
 *   "custom-config": [
 *     {
 *       "name": "./client",
 *       "export-config": {
 *         "browser": "./dist/client.browser.js",
 *         "node": "./dist/client.node.js",
 *         "import": "./dist/client.esm.js",
 *         "require": "./dist/client.cjs.js",
 *         "types": "./dist/client.d.ts"
 *       },
 *       "files-config": [
 *         "dist/client.browser.js",
 *         "dist/client.node.js",
 *         "dist/client.esm.js",
 *         "dist/client.cjs.js",
 *         "dist/client.d.ts"
 *       ]
 *     }
 *   ]
 * }
 *
 * Example 4: Export package.json subpath
 * {
 *   "custom-config": [
 *     {
 *       "name": "./package.json",
 *       "export-config": "./package.json",
 *       "files-config": []
 *     }
 *   ]
 * }
 *
 * Example 5: Multiple custom exports
 * {
 *   "custom-config": [
 *     {
 *       "name": ".",
 *       "export-config": {
 *         "import": "./dist/index.esm.js",
 *         "require": "./dist/index.cjs.js",
 *         "types": "./dist/index.d.ts"
 *       },
 *       "files-config": ["dist/index.esm.js", "dist/index.cjs.js", "dist/index.d.ts"]
 *     },
 *     {
 *       "name": "./utils",
 *       "export-config": {
 *         "import": "./dist/utils/index.esm.js",
 *         "require": "./dist/utils/index.cjs.js",
 *         "types": "./dist/utils/index.d.ts"
 *       },
 *       "files-config": ["dist/utils/index.esm.js", "dist/utils/index.cjs.js", "dist/utils/index.d.ts"]
 *     }
 *   ]
 * }
 *
 * ============================================================================
 */

/**
 * Removes the generated section in the `.gitignore` file and updates it
 * with the list of files from `FILE_LIST`.
 */
const registerGITIgnoreFiles = async (args) => {
  const { dir, jsFiles } = args;

  console.log("⚙️ Update Git Ignore File");

  const GIT_IGNORE_START_LINE = "### Start Generated Section";
  const GIT_IGNORE_END_LINE = "### End Generated Section";
  const GIT_IGNORE_FILE_PATH = path.join(`${dir}/.gitignore`);

  // Read the content of .gitignore
  const content = fs.readFileSync(GIT_IGNORE_FILE_PATH, "utf8");
  const lines = content.split("\n");

  let inGeneratedSection = false;
  const filteredLines = lines.filter((line) => {
    if (line.includes(GIT_IGNORE_START_LINE)) {
      inGeneratedSection = true;
      return false;
    }
    if (line.includes(GIT_IGNORE_END_LINE)) {
      inGeneratedSection = false;
      return false;
    }
    return !inGeneratedSection;
  });

  // Append the new generated section
  filteredLines.push(GIT_IGNORE_START_LINE);
  jsFiles.forEach((item) => {
    filteredLines.push(
      ...[
        `${item.name}.js`,
        `${item.name}.d.ts`,
        `${item.name}.esm.js`,
        `${item.name}.esm.d.ts`,
      ]
    );
  });
  filteredLines.push(GIT_IGNORE_END_LINE);

  // Write the updated content back to .gitignore
  fs.writeFileSync(GIT_IGNORE_FILE_PATH, filteredLines.join("\n"), "utf8");

  console.log("✅ Update Git Ignore Success");
};

/**
 * Updates `package.json` by adding an array of files that should be included
 * in the published package.
 *
 * @param {Object} args - The arguments object
 * @param {Array} args.customConfig - Custom export configurations (see top documentation)
 * @param {string} args.dir - The package directory path
 * @param {Array} args.jsFiles - Array of JS file configurations
 * @param {Array} args.staticFiles - Array of static file configurations
 */
const registerExposedFiles = async (args) => {
  const { customConfig, dir, jsFiles, staticFiles } = args;

  console.log("⚙️ Update Package JSON");

  const PACKAGE_JSON_FILE_PATH = path.join(`${dir}/package.json`);
  const PACKAGE_JSON_CONTENT = require(PACKAGE_JSON_FILE_PATH);

  // Clone package.json content
  const content = { ...PACKAGE_JSON_CONTENT };
  content.files = ["dist"];
  content.exports = {};

  /**
   * Process custom-config entries
   * Each item should have:
   * - name: export path (e.g., ".", "./utils")
   * - export-config: the exports value (string or object)
   * - files-config: array of files to include in package
   */
  customConfig.forEach((item) => {
    content.exports[item.name] = item["export-config"];
    content.files.push(...item["files-config"]);
  });

  staticFiles.forEach((item) => {
    content.exports[`./${item.name}`] = item.file;
  });

  // Add files & exports from FILE_LIST
  jsFiles.forEach((item) => {
    content.files.push(
      ...[
        `${item.name}.js`,
        `${item.name}.d.ts`,
        `${item.name}.esm.js`,
        `${item.name}.esm.d.ts`,
      ]
    );

    content.exports[`./${item.name}`] = {
      import: `./${item.name}.esm.js`,
      require: `./${item.name}.esm.js`,
      types: `./${item.name}.d.ts`,
    };

    content.exports[`./${item.name}.cjs`] = {
      import: `./${item.name}.js`,
      require: `./${item.name}.js`,
      types: `./${item.name}.d.ts`,
    };
  });

  // Write the updated package.json file
  fs.writeFileSync(
    PACKAGE_JSON_FILE_PATH,
    JSON.stringify(content, null, 2),
    "utf8"
  );

  console.log("✅ Update Package JSON Success");
};

const argument = process.argv.slice(2).reduce((result, current) => {
  const [key, value] = current.split("=");

  if (!Object.prototype.hasOwnProperty.call(result, key)) {
    result[key] = value;
  }

  return result;
}, {});

if (argument["--file-name"]) {
  const packageName = argument["--file-name"];
  exec(
    `pnpm list --filter ${packageName} --json | jq -r '.[0].path' | tr -d '\n'`,
    function (_, stdout) {
      if (stdout) {
        const {
          "custom-config": customConfig = [],
          "js-file": jsFiles = [],
          "static-file": staticFiles = [],
        } = require(`${stdout}/etc/config/entrypoint-file.json`);

        Promise.all([
          registerGITIgnoreFiles({ dir: stdout, jsFiles }),
          registerExposedFiles({
            customConfig,
            dir: stdout,
            jsFiles,
            staticFiles,
          }),
        ]);
      }
    }
  );
}
