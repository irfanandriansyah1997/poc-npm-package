#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Runs changeset version and creates git tags for updated packages
 *
 * Usage:
 *   pkg-version
 *   pkg-version --push    # Also push tags to remote
 *
 * This script will:
 * 1. Run `changeset version` to bump versions
 * 2. Commit changes with message "chore(semver): bump version"
 * 3. Create git tags for each updated package
 * 4. Optionally push tags to remote
 */

const parseArgs = () => {
  const args = process.argv.slice(2);
  return {
    push: args.includes("--push") || args.includes("-p"),
  };
};

const findWorkspaceRoot = () => {
  let currentDir = process.cwd();

  while (currentDir !== path.parse(currentDir).root) {
    const pnpmWorkspace = path.join(currentDir, "pnpm-workspace.yaml");
    const packageJson = path.join(currentDir, "package.json");

    if (fs.existsSync(pnpmWorkspace) || fs.existsSync(packageJson)) {
      // Check if this is the root (has .changeset)
      const changesetDir = path.join(currentDir, ".changeset");
      if (fs.existsSync(changesetDir)) {
        return currentDir;
      }
    }
    currentDir = path.dirname(currentDir);
  }

  return process.cwd();
};

const getWorkspacePackages = (workspaceRoot) => {
  try {
    const result = execSync("pnpm list -r --json --depth -1", {
      cwd: workspaceRoot,
      encoding: "utf8",
    });

    const packages = JSON.parse(result);
    return packages
      .filter((pkg) => pkg.name && pkg.version && pkg.path)
      .map((pkg) => ({
        name: pkg.name,
        path: pkg.path,
        version: pkg.version,
      }));
  } catch {
    console.error("❌ Failed to get workspace packages");
    return [];
  }
};

const getPackageVersionsBefore = (packages) => {
  const versions = {};
  packages.forEach((pkg) => {
    versions[pkg.name] = pkg.version;
  });
  return versions;
};

const getPackageVersionsAfter = (packages) => {
  const versions = {};
  packages.forEach((pkg) => {
    try {
      const packageJsonPath = path.join(pkg.path, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      versions[pkg.name] = packageJson.version;
    } catch {
      versions[pkg.name] = pkg.version;
    }
  });
  return versions;
};

const runChangesetVersion = (workspaceRoot) => {
  console.log("📦 Running changeset version...\n");

  try {
    execSync("pnpm changeset version", {
      cwd: workspaceRoot,
      stdio: "inherit",
    });
    return true;
  } catch {
    console.error("❌ Failed to run changeset version");
    return false;
  }
};

const commitVersionBump = (workspaceRoot, updatedPackages) => {
  console.log("\n📝 Committing version changes...\n");

  try {
    // Stage all changes
    execSync("git add -A", {
      cwd: workspaceRoot,
      stdio: "pipe",
    });

    // Create commit with the specified message
    const packageNames = updatedPackages.map((p) => p.name).join(", ");
    const commitMessage = "chore(semver): bump version";

    execSync(`git commit -m "${commitMessage}"`, {
      cwd: workspaceRoot,
      stdio: "pipe",
    });

    console.log(`✅ Committed: "${commitMessage}"`);
    return true;
  } catch (error) {
    // Check if there's nothing to commit
    if (error.message.includes("nothing to commit")) {
      console.log("⚠️  Nothing to commit");
      return true;
    }
    console.error("❌ Failed to commit:", error.message);
    return false;
  }
};

const createGitTags = (updatedPackages, workspaceRoot) => {
  const tags = [];

  updatedPackages.forEach(({ name, newVersion }) => {
    // Create tag name: @scope/package@version or package@version
    const tagName = `${name}@${newVersion}`;

    try {
      // Check if tag already exists
      try {
        execSync(`git rev-parse ${tagName}`, {
          cwd: workspaceRoot,
          stdio: "pipe",
        });
        console.log(`⚠️  Tag ${tagName} already exists, skipping...`);
        return;
      } catch {
        // Tag doesn't exist, we can create it
      }

      // Create the tag
      execSync(`git tag -a "${tagName}" -m "Release ${tagName}"`, {
        cwd: workspaceRoot,
        stdio: "pipe",
      });

      console.log(`🏷️  Created tag: ${tagName}`);
      tags.push(tagName);
    } catch (error) {
      console.error(`❌ Failed to create tag ${tagName}:`, error.message);
    }
  });

  return tags;
};

const pushTags = (tags, workspaceRoot) => {
  if (tags.length === 0) {
    console.log("\n⚠️  No tags to push");
    return;
  }

  console.log("\n📤 Pushing tags to remote...\n");

  tags.forEach((tag) => {
    try {
      execSync(`git push origin "${tag}"`, {
        cwd: workspaceRoot,
        stdio: "inherit",
      });
      console.log(`✅ Pushed tag: ${tag}`);
    } catch {
      console.error(`❌ Failed to push tag ${tag}`);
    }
  });
};

const pushMainBranch = (workspaceRoot) => {
  console.log("\n📤 Pushing to main branch (force)...\n");

  try {
    execSync("git push origin main --force", {
      cwd: workspaceRoot,
      stdio: "inherit",
    });
    console.log("✅ Pushed to main branch");
    return true;
  } catch {
    console.error("❌ Failed to push to main branch");
    return false;
  }
};

const main = () => {
  const { push } = parseArgs();
  const workspaceRoot = findWorkspaceRoot();

  console.log(`\n🔍 Workspace root: ${workspaceRoot}\n`);

  // Get packages before version bump
  const packagesBefore = getWorkspacePackages(workspaceRoot);
  const versionsBefore = getPackageVersionsBefore(packagesBefore);

  // Run changeset version
  const success = runChangesetVersion(workspaceRoot);
  if (!success) {
    process.exit(1);
  }

  // Get packages after version bump
  const versionsAfter = getPackageVersionsAfter(packagesBefore);

  // Find updated packages
  const updatedPackages = [];
  Object.keys(versionsBefore).forEach((name) => {
    if (versionsBefore[name] !== versionsAfter[name]) {
      updatedPackages.push({
        name,
        newVersion: versionsAfter[name],
        oldVersion: versionsBefore[name],
      });
    }
  });

  if (updatedPackages.length === 0) {
    console.log("\n✅ No packages were updated");
    return;
  }

  console.log("\n📋 Updated packages:\n");
  updatedPackages.forEach(({ name, newVersion, oldVersion }) => {
    console.log(`   ${name}: ${oldVersion} → ${newVersion}`);
  });

  // Commit the version bump
  const committed = commitVersionBump(workspaceRoot, updatedPackages);
  if (!committed) {
    process.exit(1);
  }

  // Create git tags
  console.log("\n🏷️  Creating git tags...\n");
  const tags = createGitTags(updatedPackages, workspaceRoot);

  // Push tags and main branch if requested
  if (push && tags.length > 0) {
    pushTags(tags, workspaceRoot);
    pushMainBranch(workspaceRoot);
  } else if (tags.length > 0) {
    console.log("\n💡 To push tags and main branch, run:");
    console.log("   git push origin --tags && git push origin main --force");
    console.log("   Or use: pkg-version --push");
  }

  console.log("\n✅ Version complete!\n");
};

main();
