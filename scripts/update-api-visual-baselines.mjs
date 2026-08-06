#!/usr/bin/env node
/**
 * Regenerate API visual-pending baselines via Visual Delta's Docker runner.
 *
 * Docker stages only this repo. The permanent sibling dep is `file:../design-core`,
 * which is outside the staged tree. For capture we briefly stage a real copy at
 * `.deps/design-core` and retarget package.json `file:` entries so pnpm inside
 * the container can resolve design-core. Specifiers are restored afterward.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const designCoreSource = path.resolve(root, "../design-core");
const stagedDesignCore = path.join(root, ".deps/design-core");

const packageFiles = [
  {
    rel: "package.json",
    capture: "file:./.deps/design-core",
    permanent: "file:../design-core",
    section: "devDependencies",
  },
  {
    rel: "packages/api/package.json",
    capture: "file:../../.deps/design-core",
    permanent: "file:../../../design-core",
    section: "dependencies",
  },
  {
    rel: "packages/ui/package.json",
    capture: "file:../../.deps/design-core",
    permanent: "file:../../../design-core",
    section: "dependencies",
  },
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    ...options,
  });
  if (result.status) {
    process.exit(result.status ?? 1);
  }
}

function setDesignCoreSpecifier(specifier) {
  for (const entry of packageFiles) {
    const abs = path.join(root, entry.rel);
    const data = JSON.parse(readFileSync(abs, "utf8"));
    data[entry.section]["@lapismd/design-core"] = specifier(entry);
    writeFileSync(abs, `${JSON.stringify(data, null, 2)}\n`);
  }
}

function stageDesignCoreForCapture() {
  mkdirSync(path.dirname(stagedDesignCore), { recursive: true });
  run("rsync", [
    "-a",
    "--delete",
    "--exclude",
    "node_modules",
    "--exclude",
    ".git",
    "--exclude",
    ".jj",
    "--exclude",
    "storybook-static",
    "--exclude",
    ".svelte-kit",
    "--exclude",
    ".visual-delta",
    "--exclude",
    ".ui-generator",
    `${designCoreSource}/`,
    `${stagedDesignCore}/`,
  ]);
}

function restorePermanentSpecifiers() {
  setDesignCoreSpecifier((entry) => entry.permanent);
  run("pnpm", ["install", "--ignore-scripts"]);
  rmSync(path.join(root, ".deps"), { recursive: true, force: true });
}

const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8"));
const skip = new Set([
  "api-helpers--helpers",
  "api-confirm-dialog--cancel",
]);
const ids = Object.keys(index.entries ?? {}).filter(
  (id) => id.startsWith("api-") && !id.includes("--docs") && !skip.has(id),
);

let captureFailed = false;
try {
  stageDesignCoreForCapture();
  setDesignCoreSpecifier((entry) => entry.capture);
  run("pnpm", ["install", "--ignore-scripts"]);

  const args = [
    "exec",
    "visual-delta",
    "update",
    "--baseline-path-mode",
    "nested-import",
    "--approved",
    ...ids.flatMap((id) => ["--story-id", id]),
  ];
  const result = spawnSync("pnpm", args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, VISUAL_UPDATE_APPROVED: "1" },
  });
  captureFailed = Boolean(result.status);
} finally {
  restorePermanentSpecifiers();
}

process.exit(captureFailed ? 1 : 0);
