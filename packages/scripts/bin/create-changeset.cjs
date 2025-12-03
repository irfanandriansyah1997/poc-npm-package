#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Creates a changeset file for specified package
 *
 * Usage:
 *   pkg-create-changeset --package="@irfanandriansyah1997/compiler" --type="minor" --message="Add new feature"
 *   pkg-create-changeset -p "@irfanandriansyah1997/compiler" -t "minor" -m "Add new feature"
 *
 *   # From git commits (generates message from commits since last tag)
 *   pkg-create-changeset -p "@irfanandriansyah1997/compiler" --from-commits
 *   pkg-create-changeset -p "@irfanandriansyah1997/compiler" -c
 *
 * Options:
 *   --package, -p       Package name(s), comma-separated for multiple packages (required)
 *   --type, -t          Version bump type: major, minor, patch (default: minor, auto-detected with --from-commits)
 *   --message, -m       Changeset summary message (required unless --from-commits)
 *   --from-commits, -c  Generate message from git commits since last tag
 */

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {
    fromCommits: false,
    message: "",
    packages: [],
    type: "minor", // Default to minor
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
    } else if (arg.startsWith("--type=") || arg.startsWith("-t=")) {
      result.type = arg.split("=")[1];
    } else if (arg === "--type" || arg === "-t") {
      result.type = args[++i];
    } else if (arg.startsWith("--message=") || arg.startsWith("-m=")) {
      result.message = arg.split("=")[1];
    } else if (arg === "--message" || arg === "-m") {
      result.message = args[++i];
    } else if (arg === "--from-commits" || arg === "-c") {
      result.fromCommits = true;
    }
  }

  return result;
};

const generateChangesetId = () => {
  // Generate a random changeset ID similar to what @changesets/cli does
  const adjectives = [
    "brave",
    "bright",
    "calm",
    "clever",
    "cool",
    "fair",
    "fast",
    "fresh",
    "fuzzy",
    "gentle",
    "gold",
    "green",
    "happy",
    "heavy",
    "hungry",
    "kind",
    "light",
    "little",
    "loud",
    "lucky",
    "mighty",
    "neat",
    "nice",
    "old",
    "orange",
    "pink",
    "proud",
    "purple",
    "quick",
    "quiet",
    "rare",
    "red",
    "rich",
    "rude",
    "sad",
    "shy",
    "silly",
    "slow",
    "small",
    "soft",
    "sour",
    "spicy",
    "sweet",
    "tall",
    "tame",
    "thick",
    "thin",
    "tiny",
    "tough",
    "warm",
    "weak",
    "wet",
    "wild",
    "wise",
    "young",
  ];
  const nouns = [
    "ants",
    "apples",
    "bats",
    "beans",
    "bears",
    "bees",
    "birds",
    "bottles",
    "boxes",
    "bugs",
    "buses",
    "buttons",
    "cars",
    "cats",
    "chairs",
    "cheetahs",
    "clouds",
    "coins",
    "cows",
    "crabs",
    "cups",
    "days",
    "dogs",
    "donkeys",
    "doors",
    "dots",
    "ducks",
    "eagles",
    "ears",
    "eggs",
    "elephants",
    "eyes",
    "fans",
    "feet",
    "fish",
    "flies",
    "foxes",
    "frogs",
    "games",
    "geese",
    "goats",
    "grapes",
    "hands",
    "hats",
    "hearts",
    "hills",
    "horses",
    "houses",
    "islands",
    "jars",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${randomAdjective}-${randomNoun}`;
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

  return null;
};

/**
 * Get the last git tag (any tag, sorted by version)
 */
const getLastTag = (workspaceRoot) => {
  try {
    // Fetch latest tags from origin
    execSync(`git fetch --tags origin`, {
      cwd: workspaceRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Get all tags, exclude beta tags, sort by version, get the latest
    const result = execSync(
      `git tag -l | grep -v '\\-beta\\-' | sort -V | tail -1`,
      {
        cwd: workspaceRoot,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    ).trim();

    return result || null;
  } catch {
    return null;
  }
};

/**
 * Get commits since a specific tag or all commits if no tag
 */
const getCommitsSince = (workspaceRoot, since) => {
  try {
    const range = since ? `${since}..HEAD` : "HEAD";
    const format = "%H|%s|%b---END---";

    const result = execSync(`git log ${range} --pretty=format:"${format}"`, {
      cwd: workspaceRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (!result.trim()) {
      return [];
    }

    const commits = result
      .split("---END---")
      .filter((c) => c.trim())
      .map((commit) => {
        const [hash, subject, ...bodyParts] = commit.trim().split("|");
        const body = bodyParts.join("|").trim();
        return { body, hash, subject };
      });

    return commits;
  } catch (error) {
    console.error("❌ Failed to get git commits:", error.message);
    return [];
  }
};

/**
 * Parse conventional commit message
 * Format: type(scope): message
 */
const parseConventionalCommit = (subject) => {
  // Match: type(scope): message or type: message
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?:\s*(.+)$/);

  if (match) {
    return {
      message: match[3].trim(),
      scope: match[2] || null,
      type: match[1].toLowerCase(),
    };
  }

  // Not a conventional commit
  return {
    message: subject,
    scope: null,
    type: "other",
  };
};

/**
 * Generate changelog message from commits
 */
const generateMessageFromCommits = (commits) => {
  const grouped = {
    breaking: [],
    chore: [],
    docs: [],
    feat: [],
    fix: [],
    other: [],
    perf: [],
    refactor: [],
    style: [],
    test: [],
  };

  const typeLabels = {
    breaking: "🚨 Breaking Changes",
    chore: "🔧 Chores",
    docs: "📚 Documentation",
    feat: "✨ Features",
    fix: "🐛 Bug Fixes",
    other: "📝 Other Changes",
    perf: "⚡ Performance",
    refactor: "♻️ Refactoring",
    style: "💄 Styles",
    test: "✅ Tests",
  };

  for (const commit of commits) {
    const parsed = parseConventionalCommit(commit.subject);
    const { message, scope, type } = parsed;

    // Check for breaking changes in body
    if (
      commit.body.includes("BREAKING CHANGE") ||
      commit.subject.includes("!:")
    ) {
      const breakingMessage = scope ? `**${scope}**: ${message}` : message;
      grouped.breaking.push(breakingMessage);
      continue;
    }

    const formattedMessage = scope ? `**${scope}**: ${message}` : message;

    if (grouped[type]) {
      grouped[type].push(formattedMessage);
    } else {
      grouped.other.push(formattedMessage);
    }
  }

  // Build the message
  const sections = [];

  for (const [type, label] of Object.entries(typeLabels)) {
    if (grouped[type] && grouped[type].length > 0) {
      const items = grouped[type].map((msg) => `- ${msg}`).join("\n");
      sections.push(`### ${label}\n\n${items}`);
    }
  }

  if (sections.length === 0) {
    return "No conventional commits found";
  }

  return sections.join("\n\n");
};

const createChangeset = ({ fromCommits, message, packages, type }) => {
  const workspaceRoot = findWorkspaceRoot();

  if (!workspaceRoot) {
    console.error(
      "❌ Could not find .changeset directory. Make sure you're in a workspace with changesets configured."
    );
    process.exit(1);
  }

  if (packages.length === 0) {
    console.error(
      "❌ No packages specified. Use --package or -p to specify package name(s)."
    );
    console.error(
      '   Example: pkg-create-changeset -p "@irfanandriansyah1997/compiler" -m "Add feature"'
    );
    process.exit(1);
  }

  let finalMessage = message;
  let finalType = type;

  // Generate from commits if requested
  if (fromCommits) {
    console.log("\n📜 Generating changeset from git commits...\n");

    // Get the last tag as starting point
    const lastTag = getLastTag(workspaceRoot);

    if (lastTag) {
      console.log(`   Starting from last tag: ${lastTag}`);
    } else {
      console.log("   No previous tags found, using all commits");
    }

    // Get commits since last tag
    const commits = getCommitsSince(workspaceRoot, lastTag);

    if (commits.length === 0) {
      console.error("❌ No commits found since the last tag");
      process.exit(1);
    }

    console.log(`   Found ${commits.length} commit(s)\n`);
    console.log(`   Using version type: ${finalType}`);

    // Generate message
    finalMessage = generateMessageFromCommits(commits);
  }

  if (!finalMessage) {
    console.error(
      "❌ No message specified. Use --message or -m to specify the changeset message."
    );
    console.error("   Or use --from-commits to generate from git history");
    process.exit(1);
  }

  const validTypes = ["major", "minor", "patch"];
  if (!validTypes.includes(finalType)) {
    console.error(
      `❌ Invalid type "${finalType}". Must be one of: ${validTypes.join(", ")}`
    );
    process.exit(1);
  }

  const changesetId = generateChangesetId();
  const changesetDir = path.join(workspaceRoot, ".changeset");
  const changesetFile = path.join(changesetDir, `${changesetId}.md`);

  // Build the changeset content
  const packageLines = packages
    .map((pkg) => `"${pkg}": ${finalType}`)
    .join("\n");
  const content = `---
${packageLines}
---

${finalMessage}
`;

  fs.writeFileSync(changesetFile, content, "utf8");

  console.log(`\n✅ Created changeset: .changeset/${changesetId}.md`);
  console.log(`   Packages: ${packages.join(", ")}`);
  console.log(`   Type: ${finalType}`);

  if (fromCommits) {
    console.log(`\n📋 Generated changelog:\n`);
    console.log(finalMessage);
  } else {
    console.log(`   Message: ${finalMessage}`);
  }
};

const { fromCommits, message, packages, type } = parseArgs();
createChangeset({ fromCommits, message, packages, type });
