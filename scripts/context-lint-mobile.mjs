#!/usr/bin/env node

/**
 * Validates ai.context.mobile.md files for mobile features.
 * Usage:
 *   node scripts/context-lint-mobile.mjs            # all features
 *   node scripts/context-lint-mobile.mjs --changed   # only git-changed features
 *   node scripts/context-lint-mobile.mjs --staged    # only git-staged features
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const FEATURES_DIR = join(ROOT, "apps", "mobile", "src", "features");
const ALLOW_TODO = process.env.ALLOW_TODO_PLACEHOLDER === "true";

const REQUIRED_SECTIONS = [
  "## Purpose",
  "## Non-goals",
  "## Boundaries & Ownership",
  "## Code pointers",
  "## Components",
  "## Hooks",
  "## API Integration",
  "## Contracts",
  "## Error Handling",
  "## Performance",
  "## Test matrix",
  "## Examples",
  "## Change log / Decisions",
];

function getChangedFeatures(mode) {
  try {
    const cmd =
      mode === "--staged"
        ? "git diff --cached --name-only"
        : "git diff --name-only HEAD~1";
    const output = execSync(cmd, { cwd: ROOT, encoding: "utf-8" });
    const features = new Set();
    for (const line of output.split("\n")) {
      const match = line.match(/apps\/mobile\/src\/features\/([^/]+)\//);
      if (match) features.add(match[1]);
    }
    return [...features];
  } catch {
    return null;
  }
}

function lintFile(filePath, featureName) {
  const errors = [];
  const content = readFileSync(filePath, "utf-8");

  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      errors.push(`Missing section: ${section}`);
    }
  }

  if (!ALLOW_TODO && /TODO|PLACEHOLDER/i.test(content)) {
    errors.push("Contains TODO/PLACEHOLDER content (set ALLOW_TODO_PLACEHOLDER=true to allow)");
  }

  if (errors.length > 0) {
    console.error(`\n❌ ${featureName}/ai.context.mobile.md:`);
    for (const err of errors) console.error(`   - ${err}`);
  }

  return errors.length;
}

function main() {
  const mode = process.argv[2];
  let features;

  if (mode === "--changed" || mode === "--staged") {
    const changed = getChangedFeatures(mode);
    if (!changed) {
      console.warn("Could not determine changed features, linting all...");
      features = null;
    } else if (changed.length === 0) {
      console.warn("No mobile features changed, skipping.");
      process.exit(0);
    } else {
      features = changed;
    }
  }

  if (!existsSync(FEATURES_DIR)) {
    console.warn("No mobile features directory found, skipping.");
    process.exit(0);
  }

  const dirs = features ?? readdirSync(FEATURES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let totalErrors = 0;

  for (const dir of dirs) {
    const contextFile = join(FEATURES_DIR, dir, "ai.context.mobile.md");
    if (!existsSync(contextFile)) {
      console.warn(`⚠️  ${dir}/ has no ai.context.mobile.md`);
      continue;
    }
    totalErrors += lintFile(contextFile, dir);
  }

  if (totalErrors > 0) {
    console.error(`\n${totalErrors} error(s) found in mobile context files.`);
    process.exit(1);
  }

  console.warn("✅ All mobile context files are valid.");
}

main();
