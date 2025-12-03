#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * Runs changeset version and creates git tags for updated packages
 *
 * Usage:
 *   pkg-version
 *   pkg-version --push    # Create branch, push tags, and create PR with bump-version label
 *
 * This script will:
 * 1. Run `changeset version` to bump versions
 * 2. Commit changes with message "chore(semver): bump version"
 * 3. Create git tags for each updated package
 * 4. With --push: Create branch, push tags, and create PR with bump-version label
 */

const generateBranchName = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `chore/bump-version-${timestamp}-${random}`;
};

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

const configureGitBot = (workspaceRoot) => {
  // Configure git to use GitHub Actions bot
  const botName = "github-actions[bot]";
  const botEmail = "github-actions[bot]@users.noreply.github.com";

  try {
    execSync(`git config user.name "${botName}"`, {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
    execSync(`git config user.email "${botEmail}"`, {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
    console.log(`🤖 Git configured as: ${botName}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to configure git bot:", error.message);
    return false;
  }
};

const commitVersionBump = (workspaceRoot, updatedPackages) => {
  console.log("\n📝 Committing version changes...\n");

  try {
    // Configure git bot for commits
    configureGitBot(workspaceRoot);

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

const getRepoInfo = (workspaceRoot) => {
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      cwd: workspaceRoot,
      encoding: "utf8",
    }).trim();

    // Parse GitHub URL (supports both HTTPS and SSH formats)
    // HTTPS: https://github.com/owner/repo.git
    // SSH: git@github.com:owner/repo.git
    let match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }

    throw new Error("Could not parse GitHub repository URL");
  } catch (error) {
    console.error("❌ Failed to get repository info:", error.message);
    return null;
  }
};

const createPRWithGitHubAPI = async (
  owner,
  repo,
  branchName,
  updatedPackages
) => {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.error("❌ GITHUB_TOKEN environment variable is not set");
    return null;
  }

  const packageList = updatedPackages
    .map(
      ({ name, oldVersion, newVersion }) =>
        `- ${name}: ${oldVersion} → ${newVersion}`
    )
    .join("\n");

  // Generate PR title with package names and versions
  const packageVersions = updatedPackages
    .map(({ name, newVersion }) => `${name}@${newVersion}`)
    .join(", ");
  const prTitle = `chore(semver): bump version ${packageVersions}`;
  const prBody = `## 📦 Version Bump

This PR bumps the following packages:

${packageList}

---
_Auto-generated by pkg-version_`;

  try {
    // Create PR
    const createPRResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: prTitle,
          body: prBody,
          head: branchName,
          base: "main",
        }),
      }
    );

    if (!createPRResponse.ok) {
      const error = await createPRResponse.json();
      throw new Error(error.message || "Failed to create PR");
    }

    const prData = await createPRResponse.json();
    console.log(`✅ Pull Request created: ${prData.html_url}`);

    // Add label to PR
    const addLabelResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prData.number}/labels`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          labels: ["bump-version"],
        }),
      }
    );

    if (addLabelResponse.ok) {
      console.log("✅ Added 'bump-version' label to PR");
    } else {
      console.warn("⚠️  Could not add label (label might not exist in repo)");
    }

    return prData;
  } catch (error) {
    console.error("❌ Failed to create PR via GitHub API:", error.message);
    return null;
  }
};

const createBranchAndPR = async (updatedPackages, tags, workspaceRoot) => {
  const branchName = generateBranchName();

  console.log(`\n🌿 Creating branch: ${branchName}\n`);

  try {
    // Get repo info
    const repoInfo = getRepoInfo(workspaceRoot);
    if (!repoInfo) {
      throw new Error("Could not determine repository owner/name");
    }

    // Create and checkout new branch
    execSync(`git checkout -b "${branchName}"`, {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
    console.log(`✅ Created branch: ${branchName}`);

    // Push branch to remote
    console.log("\n📤 Pushing branch to remote...\n");
    execSync(`git push origin "${branchName}"`, {
      cwd: workspaceRoot,
      stdio: "inherit",
    });

    // Push tags
    if (tags.length > 0) {
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
    }

    // Create PR with label using GitHub API
    console.log("\n📝 Creating Pull Request via GitHub API...\n");

    const prData = await createPRWithGitHubAPI(
      repoInfo.owner,
      repoInfo.repo,
      branchName,
      updatedPackages
    );

    if (!prData) {
      throw new Error("Failed to create PR");
    }

    // Switch back to main
    execSync("git checkout main", {
      cwd: workspaceRoot,
      stdio: "pipe",
    });

    return { branchName, success: true, prUrl: prData.html_url };
  } catch (error) {
    console.error("❌ Failed to create branch/PR:", error.message);

    // Try to switch back to main
    try {
      execSync("git checkout main", {
        cwd: workspaceRoot,
        stdio: "pipe",
      });
    } catch {}

    return { branchName, success: false };
  }
};

const main = async () => {
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

  // Create branch, push tags, and create PR
  if (push && tags.length > 0) {
    const {
      branchName,
      success: prSuccess,
      prUrl,
    } = await createBranchAndPR(updatedPackages, tags, workspaceRoot);

    if (prSuccess) {
      console.log("\n✅ Version complete!");
      console.log(`\n📌 Branch: ${branchName}`);
      console.log("📌 Label: bump-version");
      if (prUrl) {
        console.log(`📌 PR: ${prUrl}`);
      }
      console.log("\n💡 Review and merge the PR to complete the release\n");
    } else {
      process.exit(1);
    }
    return;
  }

  if (tags.length > 0) {
    console.log("\n💡 To create branch and PR, run:");
    console.log("   pkg-version --push");
    console.log("\n⚠️  Make sure GITHUB_TOKEN environment variable is set");
  }

  console.log("\n✅ Version complete!\n");
};

main().catch((error) => {
  console.error("❌ Version failed:", error.message);
  process.exit(1);
});
