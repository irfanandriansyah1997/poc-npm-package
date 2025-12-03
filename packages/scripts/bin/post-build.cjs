#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

/////////////////////////////////////////////////////////////////////////////
// Generating the public API
/////////////////////////////////////////////////////////////////////////////

const generatePublicAPI = (args) => {
  const { dir, jsFiles } = args;
  /**
   * Iterates through the `FILE_LIST` and generates JavaScript and TypeScript declaration files (.d.ts)
   * for both ESM and CommonJS (CJS) module formats.
   *
   * For each item in the `FILE_LIST`, the following files are created:
   * - `${item.name}.js` (CJS format)
   * - `${item.name}.esm.js` (ESM format)
   * - `${item.name}.d.ts` (TypeScript declaration file for CJS)
   * - `${item.name}.esm.d.ts` (TypeScript declaration file for ESM)
   *
   * Each generated file corresponds to the specified entry points.
   *
   * @param {Array<{ name: string, file: string }>} FILE_LIST - Array of file objects containing the `name` and `file` paths.
   */
  jsFiles.forEach((item) => {
    const { "entry-point": entryPoint, "export-kind": kind, file, name } = item;

    /**
     * INFO: Build JS File Path
     */
    const jsFilePath = path.join(dir, `./${name}.js`);
    const modernJSFilePath = path.join(dir, `./${name}.esm.js`);
    const dtsFilePath = path.join(dir, `./${name}.d.ts`);
    const modernDtsFilePath = path.join(dir, `./${name}.esm.d.ts`);

    /**
     * INFO: Build JS Content
     */
    let modernJSContent = "";
    let oldJSContent = "";
    let modernDTSContent = "";
    let dtsContent = "";

    switch (kind) {
      case "default export": {
        modernJSContent = `'use client';\nexport { default } from '${file}.esm';\n`;
        oldJSContent = `'use client';\nmodule.exports = require('${file}');\n`;
        modernDTSContent = `export { default } from '${file}.esm';\n`;
        dtsContent = `export { default } from '${file}';\n`;
        break;
      }

      case "named export": {
        if (Array.isArray(entryPoint) && entryPoint.length > 0) {
          const formattedEntryPointDTS = entryPoint.reduce((result, item) => {
            let temp = [];
            if (result) temp.push(result);

            if (typeof item === "string") {
              return [...temp, item].join(", ");
            }

            if (
              typeof item === "object" &&
              item &&
              item.type === "interface" &&
              typeof item.name === "string" &&
              item.name
            ) {
              return [...temp, `type ${item.name}`].join(", ");
            }

            return result;
          }, "");
          const formattedEntryPointNonType = entryPoint.reduce(
            (result, item) => {
              let temp = [];
              if (result) temp.push(result);

              if (typeof item === "string") {
                return [...temp, item].join(", ");
              }

              return result;
            },
            ""
          );

          modernJSContent = `'use client';\nexport { ${formattedEntryPointNonType} } from '${file}.esm';\n`;
          oldJSContent = [
            "'use client';",
            `const { ${formattedEntryPointNonType} } = require('${file}');`,
            `module.exports = { ${formattedEntryPointNonType} };`,
          ].join("\n");
          modernDTSContent = `export { ${formattedEntryPointDTS} } from '${file}.esm';\n`;
          dtsContent = `export { ${formattedEntryPointDTS} } from '${file}';\n`;
        }
        break;
      }
    }

    if (!modernJSContent || !oldJSContent || !modernDTSContent || !dtsContent) {
      console.log(`❌ Failured ${name}.js and ${name}.d.ts`);
      return;
    }

    fs.writeFileSync(jsFilePath, oldJSContent, "utf8");
    fs.writeFileSync(modernJSFilePath, modernJSContent, "utf8");
    fs.writeFileSync(dtsFilePath, dtsContent, "utf8");
    fs.writeFileSync(modernDtsFilePath, modernDTSContent, "utf8");

    console.log(`✅ Success create ${item.name}.js and ${item.name}.d.ts`);
  });
};

/////////////////////////////////////////////////////////////////////////////
// Generate d.ts contract API
// /////////////////////////////////////////////////////////////////////////////

/**
 * Recursively retrieves all `.d.ts` files from a directory, excluding `.esm.d.ts` and `.cjs.d.ts` files.
 *
 * @param {string} dir - The directory to search for `.d.ts` files.
 * @param {string[]} [fileList=[]] - An array to hold the found `.d.ts` file paths.
 * @returns {string[]} An array of `.d.ts` file paths.
 */
const getAllDtsFiles = (dir, fileList = []) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllDtsFiles(filePath, fileList); // Recursively search in subdirectories
    } else if (
      file.endsWith(".d.ts") &&
      !file.endsWith(".esm.d.ts") &&
      !file.endsWith(".cjs.d.ts")
    ) {
      fileList.push(filePath); // Only add regular .d.ts files (skip existing .esm.d.ts and .cjs.d.ts)
    }
  });

  return fileList;
};

const generateDTSFileForESM = (args) => {
  const { dir } = args;

  /**
   * Reads all `.d.ts` files from the `dist` directory, generates corresponding `.esm.d.ts` files,
   * and appends export statements to them.
   */
  const distDir = path.join(dir, "./dist");
  const dtsFiles = getAllDtsFiles(distDir);

  dtsFiles.forEach((dtsFilePath) => {
    const relativePath = path.relative(distDir, dtsFilePath);
    const baseFileName = path.basename(relativePath, ".d.ts");

    // Generate .esm.d.ts
    const esmFilePath = path.join(
      distDir,
      `${relativePath.replace(".d.ts", "")}.esm.d.ts`
    );
    const esmExportContent = `export * from './${baseFileName}';\nexport { default } from './${baseFileName}';`;
    fs.writeFileSync(esmFilePath, esmExportContent);
  });
};

// console.log('ESM and CJS declaration files created successfully.');

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
          "js-file": jsFiles,
        } = require(`${stdout}/etc/config/entrypoint-file.json`);

        console.log(stdout);

        Promise.all([
          generatePublicAPI({ dir: stdout, jsFiles }),
          generateDTSFileForESM({ dir: stdout }),
        ]);
      }
    }
  );
}
