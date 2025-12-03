#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

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
          "custom-config": customConfig,
          "js-file": jsFiles,
          "static-file": staticFiles,
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
