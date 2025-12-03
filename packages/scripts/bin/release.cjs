#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

/**
 * Full release workflow: create changeset from commits → version → push tags
 *
 * Usage:
 *   pkg-release --package="@irfanandriansyah1997/compiler"
 *   pkg-release -p "@irfanandriansyah1997/compiler"
 *   pkg-release -p "@irfanandriansyah1997/compiler,@irfanandriansyah1997/scripts"
 *
 * Options:
 *   --package, -p   Package name(s), comma-separated for multiple packages (required)
 *   --skip-push     Skip pushing tags to remote
 */

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {
    packages: [],
    skipPush: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg.startsWith("--package=") || arg.startsWith("-p=")) {
      result.packages = arg
        .split("=")[1]
        .split(",")
        .map((p) => p.trim());
    } else if (arg === "--package" || arg === "-p") {
      result.packages = args[++i].split(",").map((p) => p.trim());
    } else if (arg === "--skip-push") {
      result.skipPush = true;
    }
  }

  return result;
};

const findWorkspaceRoot = () => {
  let currentDir = process.cwd();

  while (currentDir !== path.parse(currentDir).root) {
    const changesetDir = path.join(currentDir, ".changeset");
    if (fs.existsSync(changesetDir)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return process.cwd();
};

const runCommand = (command, options = {}) => {
  const { showOutput = true } = options;

  console.log(`\n$ ${command}\n`);

  try {
    execSync(command, {
      cwd: findWorkspaceRoot(),
      stdio: showOutput ? "inherit" : "pipe",
    });
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    return false;
  }
};

const main = async () => {
  const { packages, skipPush } = parseArgs();

  if (packages.length === 0) {
    console.error(
      "❌ No packages specified. Use --package or -p to specify package name(s)."
    );
    console.error(
      '   Example: pkg-release -p "@irfanandriansyah1997/compiler"'
    );
    process.exit(1);
  }

  const workspaceRoot = findWorkspaceRoot();
  const packageList = packages.join(",");

  console.log("\n🚀 Starting release workflow...\n");
  console.log(`   Packages: ${packages.join(", ")}`);
  console.log(`   Workspace: ${workspaceRoot}`);

  // Step 1: Create changeset from commits
  console.log("\n" + "=".repeat(60));
  console.log("📝 Step 1: Creating changeset from git commits");
  console.log("=".repeat(60));

  const changesetCmd = `pkg-create-changeset -p "${packageList}" --from-commits`;
  if (!runCommand(changesetCmd, {})) {
    console.error("\n❌ Failed to create changeset");
    process.exit(1);
  }

  // Step 2: Run version (bumps versions, updates changelog, commits, creates tags)
  console.log("\n" + "=".repeat(60));
  console.log("📦 Step 2: Bumping versions and creating tags");
  console.log("=".repeat(60));

  const versionCmd = skipPush ? "pkg-version" : "pkg-version --push";
  if (!runCommand(versionCmd, {})) {
    console.error("\n❌ Failed to version packages");
    process.exit(1);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("✅ Release workflow completed!");
  console.log("=".repeat(60));

  console.log("\n📋 Summary:");
  console.log("   ✓ Created changeset from git commits");
  console.log("   ✓ Bumped package versions");
  console.log("   ✓ Updated CHANGELOG.md");
  console.log("   ✓ Commit the bump version");
  console.log("   ✓ Created git tags");

  if (!skipPush) {
    console.log("   ✓ Pushed tags to remote");
    console.log("   ✓ Pushed to main branch (force)");
  } else {
    console.log("\n💡 Changes were not pushed. Run:");
    console.log("   git push origin --tags && git push origin main --force");
  }

  console.log("\n🎉 Next step: Run 'pnpm release:publish' to publish to npm\n");
};

main().catch((error) => {
  console.error("❌ Release failed:", error.message);
  process.exit(1);
});
