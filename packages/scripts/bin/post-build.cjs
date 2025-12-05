#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

/**
 * Ensures the directory exists and writes the file.
 * If the file path contains directories, it will create them recursively.
 *
 * @param {string} filePath - The full path to the file to write.
 * @param {string} content - The content to write to the file.
 */
const ensureDirAndWriteFile = (filePath, content) => {
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(filePath, content, "utf8");
};

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
     * INFO: Calculate relative path prefix based on directory depth
     * e.g., "utils/api" has depth 1, so prefix is "../"
     * e.g., "a/b/api" has depth 2, so prefix is "../../"
     */
    const depth = (name.match(/\//g) || []).length;
    const relativePrefix = depth > 0 ? "../".repeat(depth) : "";
    // Remove leading "./" from file when adding relative prefix to avoid ".././dist/..."
    const normalizedFile =
      depth > 0 && file.startsWith("./") ? file.slice(2) : file;
    const adjustedFile = `${relativePrefix}${normalizedFile}`;

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
        modernJSContent = `'use client';\nexport { default } from '${adjustedFile}.esm';\n`;
        oldJSContent = `'use client';\nmodule.exports = require('${adjustedFile}');\n`;
        modernDTSContent = `export { default } from '${adjustedFile}.esm';\n`;
        dtsContent = `export { default } from '${adjustedFile}';\n`;
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

          modernJSContent = `'use client';\nexport { ${formattedEntryPointNonType} } from '${adjustedFile}.esm';\n`;
          oldJSContent = [
            "'use client';",
            `const { ${formattedEntryPointNonType} } = require('${adjustedFile}');`,
            `module.exports = { ${formattedEntryPointNonType} };`,
          ].join("\n");
          modernDTSContent = `export { ${formattedEntryPointDTS} } from '${adjustedFile}.esm';\n`;
          dtsContent = `export { ${formattedEntryPointDTS} } from '${adjustedFile}';\n`;
        }
        break;
      }
    }

    if (!modernJSContent || !oldJSContent || !modernDTSContent || !dtsContent) {
      console.log(`❌ Failured ${name}.js and ${name}.d.ts`);
      return;
    }

    ensureDirAndWriteFile(jsFilePath, oldJSContent);
    ensureDirAndWriteFile(modernJSFilePath, modernJSContent);
    ensureDirAndWriteFile(dtsFilePath, dtsContent);
    ensureDirAndWriteFile(modernDtsFilePath, modernDTSContent);

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
          "js-file": jsFiles = [],
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
