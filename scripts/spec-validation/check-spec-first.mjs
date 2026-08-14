#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPO_ROOT = path.resolve(SCRIPT_DIR, "../..");
const CANONICAL_SPEC_PATTERN = /^spec\/src\/(?!SUMMARY\.md$).+\.md$/;

const IGNORED_PATTERNS = [
  /(^|\/)node_modules\//,
  /(^|\/)(?:dist|build|\.svelte-kit|\.turbo)\//,
  /(^|\/)(?:coverage|test-results|playwright-report|storybook-static)\//,
  /^spec\/book\//,
  /\.(?:spec|test)\.[cm]?[jt]sx?$/,
  /\.stories\.(?:svelte|[cm]?[jt]sx?)$/,
  /^stories\/(?!catalog\/)/,
  /^MIGRATION\.md$/,
  /^README\.md$/,
];

const RULES = [
  {
    name: "API package",
    pattern: /^packages\/api\/(?:src\/|package\.json$)/,
    chapters: ["spec/src/packages.md", "spec/src/architecture.md"],
  },
  {
    name: "API app database",
    pattern: /^packages\/api\/src\/lib\/storage\//,
    chapters: ["spec/src/app-database.md"],
  },
  {
    name: "API plugin lifecycle",
    pattern:
      /^packages\/api\/src\/lib\/(?:plugin(?:-manager)?\.ts|workspace\.svelte\.ts|context\.svelte\.ts)$/,
    chapters: ["spec/src/plugin-model.md"],
  },
  {
    name: "UI package",
    pattern: /^packages\/ui\/(?:src\/|package\.json$)/,
    chapters: ["spec/src/packages.md", "spec/src/ui-and-styling.md"],
  },
  {
    name: "Workspace package",
    pattern: /^packages\/workspace\/(?:src\/|package\.json$)/,
    chapters: [
      "spec/src/packages.md",
      "spec/src/architecture.md",
      "spec/src/workspace-shell.md",
    ],
  },
  {
    name: "File Explorer package",
    pattern: /^packages\/file-explorer\//,
    chapters: [
      "spec/src/packages.md",
      "spec/src/architecture.md",
      "spec/src/editor-demo.md",
    ],
  },
  {
    name: "Desktop Electron package",
    pattern: /^packages\/desktop-electron\//,
    chapters: [
      "spec/src/desktop-host.md",
      "spec/src/packages.md",
      "spec/src/architecture.md",
    ],
  },
  {
    name: "Web package",
    pattern: /^packages\/web\//,
    chapters: [
      "spec/src/web-host.md",
      "spec/src/packages.md",
      "spec/src/architecture.md",
    ],
  },
  {
    name: "Desktop Markdown language runtime",
    pattern:
      /^packages\/language-service\/(?:src\/markdownlint\/|package\.json$)/,
    chapters: ["spec/src/desktop-host.md"],
  },
  {
    name: "Markdown plugin package",
    pattern:
      /^packages\/plugins\/plugin-markdown\/(?:src\/|package\.json$|PARITY\.md$)/,
    chapters: [
      "spec/src/markdown-plugin.md",
      "spec/src/markdown-plugin/panels/index.md",
      "spec/src/packages.md",
      "spec/src/editor-demo.md",
    ],
  },
  {
    name: "API diagnostics bridge",
    pattern:
      /^packages\/api\/src\/lib\/(?:diagnostics\/|language-service\/|components\/editor\/language-service\/|workspace\.ts$|plugin\.ts$)/,
    chapters: ["spec/src/workspace-shell/panels/problems.md"],
  },
  {
    name: "Language service package",
    pattern: /^packages\/language-service\//,
    chapters: [
      "spec/src/workspace-shell/panels/problems.md",
      "spec/src/packages.md",
    ],
  },
  {
    name: "Markdownlint plugin package",
    pattern: /^packages\/plugins\/plugin-markdown-lint\//,
    chapters: [
      "spec/src/workspace-shell/panels/problems.md",
      "spec/src/packages.md",
      "spec/src/editor-demo.md",
    ],
  },
  {
    name: "Search plugin package",
    pattern: /^packages\/plugins\/plugin-search\//,
    chapters: [
      "spec/src/search-plugin.md",
      "spec/src/packages.md",
      "spec/src/architecture.md",
    ],
  },
  {
    name: "Roles consumer acceptance",
    pattern: /^stories\/workspace\/plugins\/(?:roles-plugin-shell\/|RolesWorkspace|CvFileView|create-roles-workspace-demo|create-cv-file-view-demo)/,
    chapters: [
      "spec/src/roles-plugin.md",
      "spec/src/storybook-catalog.md",
    ],
  },
  {
    name: "Retired in-tree Roles package",
    pattern: /^packages\/plugins\/plugin-roles\//,
    chapters: [
      "spec/src/roles-plugin.md",
      "spec/src/packages.md",
      "spec/src/architecture.md",
    ],
  },
  {
    name: "Markdown panel shell",
    pattern:
      /^packages\/plugins\/plugin-markdown\/src\/lib\/views\/sidebar-panel\//,
    chapters: ["spec/src/workspace-shell/panels.md"],
  },
  {
    name: "All Properties panel",
    pattern:
      /^packages\/plugins\/plugin-markdown\/src\/lib\/views\/all-properties\//,
    chapters: [
      "spec/src/markdown-plugin/panels/all-properties.md",
      "spec/src/workspace-shell/panels.md",
    ],
  },
  {
    name: "File Properties panel",
    pattern:
      /^packages\/plugins\/plugin-markdown\/src\/lib\/(?:views\/file-properties\/|frontmatter\/)/,
    chapters: [
      "spec/src/markdown-plugin/panels/file-properties.md",
      "spec/src/workspace-shell/panels.md",
    ],
  },
  {
    name: "Outline panel",
    pattern: /^packages\/plugins\/plugin-markdown\/src\/lib\/views\/outline\//,
    chapters: [
      "spec/src/markdown-plugin/panels/outline.md",
      "spec/src/workspace-shell/panels.md",
    ],
  },
  {
    name: "Backlinks panel",
    pattern:
      /^packages\/plugins\/plugin-markdown\/src\/lib\/views\/backlinks\//,
    chapters: [
      "spec/src/markdown-plugin/panels/backlinks.md",
      "spec/src/markdown-plugin/panels/link-previews.md",
      "spec/src/workspace-shell/panels.md",
    ],
  },
  {
    name: "Outgoing Links panel",
    pattern:
      /^packages\/plugins\/plugin-markdown\/src\/lib\/views\/outgoing-links\//,
    chapters: [
      "spec/src/markdown-plugin/panels/outgoing-links.md",
      "spec/src/markdown-plugin/panels/link-previews.md",
      "spec/src/workspace-shell/panels.md",
    ],
  },
  {
    name: "Markdown link previews",
    pattern:
      /^packages\/plugins\/plugin-markdown\/src\/lib\/(?:views\/link-sidebar\/|components\/embed\/|mira\/file-adapter\.|embed\.ts$)/,
    chapters: [
      "spec/src/markdown-plugin/panels/link-previews.md",
      "spec/src/workspace-shell/panels.md",
    ],
  },
  {
    name: "Storybook catalog",
    pattern: /^(?:\.storybook\/|stories\/catalog\/)/,
    chapters: ["spec/src/storybook-catalog.md"],
  },
  {
    name: "Specification governance",
    pattern:
      /^(?:scripts\/spec-validation\/|\.qmd\/index\.ya?ml$|\.gitignore$|spec\/book\.toml|AGENTS\.md$)/,
    chapters: ["spec/src/spec-governance.md"],
  },
  {
    name: "Repository architecture",
    pattern:
      /^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json|tsconfig(?:\.[^.]+)*\.json)$/,
    chapters: ["spec/src/architecture.md", "spec/src/packages.md"],
  },
];

function normalizePath(filePath) {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

function mergeChanges(inputChanges) {
  const changes = new Map();
  for (const input of inputChanges) {
    const change =
      typeof input === "string"
        ? { path: input, changedLines: [] }
        : { changedLines: [], ...input };
    const normalizedPath = normalizePath(change.path);
    if (!normalizedPath) continue;
    const current = changes.get(normalizedPath) ?? {
      path: normalizedPath,
      changedLines: [],
    };
    current.changedLines.push(...(change.changedLines ?? []));
    changes.set(normalizedPath, current);
  }
  return [...changes.values()].sort((left, right) =>
    left.path.localeCompare(right.path),
  );
}

export function classifySpecFirstChanges(inputChanges) {
  const changes = mergeChanges(inputChanges);
  const specFiles = changes
    .map((change) => change.path)
    .filter((filePath) => CANONICAL_SPEC_PATTERN.test(filePath));
  const protectedFiles = [];
  const requiredChapters = new Map();
  const unmappedProductionFiles = [];

  for (const change of changes) {
    const isSpecificationValidator = /^scripts\/spec-validation\//.test(
      change.path,
    );
    const isGovernedRolesStory =
      /^stories\/workspace\/plugins\/(?:roles-plugin-shell\/|RolesWorkspace|CvFileView|create-roles-workspace-demo|create-cv-file-view-demo)/.test(
        change.path,
      ) ||
      /^packages\/plugins\/plugin-roles\/(?:\.storybook\/|src\/stories\/)/.test(
        change.path,
      );
    if (
      CANONICAL_SPEC_PATTERN.test(change.path) ||
      (!isSpecificationValidator &&
        !isGovernedRolesStory &&
        IGNORED_PATTERNS.some((pattern) => pattern.test(change.path)))
    ) {
      continue;
    }
    const matchedRules = RULES.filter((rule) => rule.pattern.test(change.path));
    if (matchedRules.length === 0) {
      if (
        /^(?:packages\/[^/]+\/src\/|\.storybook\/|stories\/catalog\/)/.test(
          change.path,
        )
      ) {
        unmappedProductionFiles.push(change.path);
      }
      continue;
    }
    protectedFiles.push(change.path);
    for (const rule of matchedRules) {
      for (const chapter of rule.chapters) {
        const owners = requiredChapters.get(chapter) ?? [];
        owners.push(change.path);
        requiredChapters.set(chapter, owners);
      }
    }
  }

  const missingChapters = [...requiredChapters.keys()]
    .filter((chapter) => !specFiles.includes(chapter))
    .sort();
  return {
    files: changes.map((change) => change.path),
    specFiles,
    protectedFiles,
    requiredChapters: [...requiredChapters.keys()].sort(),
    missingChapters,
    unmappedProductionFiles,
    requiresSpec:
      protectedFiles.length > 0 || unmappedProductionFiles.length > 0,
    ok: missingChapters.length === 0 && unmappedProductionFiles.length === 0,
  };
}

function parseDiffHeader(line) {
  const source = line.slice("diff --git ".length);
  const match =
    /^(?:"((?:[^"\\]|\\.)*)"|(\S+))\s+(?:"((?:[^"\\]|\\.)*)"|(\S+))$/.exec(
      source,
    );
  if (!match) return null;
  const decode = (quoted, plain) => {
    const value = quoted === undefined ? plain : JSON.parse(`"${quoted}"`);
    return value?.replace(/^[ab]\//, "");
  };
  try {
    const before = decode(match[1], match[2]);
    const after = decode(match[3], match[4]);
    if (!before || !after) return null;
    return [before, after];
  } catch {
    return null;
  }
}

export function parseUnifiedDiff(source) {
  const changes = new Map();
  let currentPaths = [];
  let sawHeader = false;
  for (const line of source.split(/\r?\n/)) {
    if (line.startsWith("diff --git ")) {
      const header = parseDiffHeader(line);
      if (!header) throw new Error(`Unsupported unified diff header: ${line}`);
      sawHeader = true;
      currentPaths = [...new Set(header.map(normalizePath))];
      for (const currentPath of currentPaths) {
        if (!changes.has(currentPath)) {
          changes.set(currentPath, { path: currentPath, changedLines: [] });
        }
      }
      continue;
    }
    if (
      currentPaths.length === 0 ||
      line.startsWith("+++") ||
      line.startsWith("---")
    ) {
      continue;
    }
    if (line.startsWith("+") || line.startsWith("-")) {
      for (const currentPath of currentPaths) {
        changes.get(currentPath).changedLines.push(line.slice(1));
      }
    }
  }
  if (source.trim() && !sawHeader) {
    throw new Error(
      "Non-empty change-set output contained no unified diff headers",
    );
  }
  return [...changes.values()];
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const details = result.stderr.trim() || result.stdout.trim();
    throw new Error(
      `${command} ${args.join(" ")} failed${details ? `:\n${details}` : ""}`,
    );
  }
  return result.stdout;
}

function parseArgs(argv) {
  const options = { files: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") continue;
    if (argument === "--base") options.base = argv[++index];
    else if (argument === "--head") options.head = argv[++index];
    else if (argument === "--file") options.files.push(argv[++index]);
    else if (argument === "--help" || argument === "-h") options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (options.head && !options.base) throw new Error("--head requires --base");
  if (options.files.some((file) => !file)) {
    throw new Error("--file requires a path");
  }
  return options;
}

function changesFromVcs({ base, head, files }, repoRoot) {
  if (files.length > 0) return files;
  if (base) {
    return parseUnifiedDiff(
      run(
        "git",
        ["diff", "--no-ext-diff", "--unified=0", base, head ?? "HEAD", "--"],
        repoRoot,
      ),
    );
  }
  if (existsSync(path.join(repoRoot, ".jj"))) {
    return parseUnifiedDiff(
      run(
        "jj",
        [
          "--no-pager",
          "--color=never",
          "diff",
          "--git",
          "--from",
          "@-",
          "--to",
          "@",
        ],
        repoRoot,
      ),
    );
  }
  return parseUnifiedDiff(
    run(
      "git",
      ["diff", "--no-ext-diff", "--unified=0", "HEAD", "--"],
      repoRoot,
    ),
  );
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(
        "Usage: node check-spec-first.mjs [--base <rev>] [--head <rev>] [--file <path>...]",
      );
      return;
    }
    const result = classifySpecFirstChanges(
      changesFromVcs(options, DEFAULT_REPO_ROOT),
    );
    if (result.ok) {
      console.log(
        result.requiresSpec
          ? `Spec-first gate passed: ${result.protectedFiles.length} protected file(s), ${result.specFiles.length} canonical chapter(s).`
          : "Spec-first gate passed: no protected files changed.",
      );
      return;
    }
    console.error("Spec-first gate failed.");
    for (const chapter of result.missingChapters) {
      console.error(`  Missing mapped chapter: ${chapter}`);
    }
    for (const file of result.protectedFiles) {
      console.error(`    protected: ${file}`);
    }
    for (const file of result.unmappedProductionFiles) {
      console.error(`  Unmapped protected file: ${file}`);
    }
    process.exitCode = 1;
  } catch (error) {
    console.error(
      `Spec-first gate could not determine a trustworthy change set: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main();
}
