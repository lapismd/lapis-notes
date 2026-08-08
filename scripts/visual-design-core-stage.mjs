import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

const defaultStoryPrefixes = [
  "api-",
  "workspace-shell-",
  "workspace-lapis-editor-demo-",
];
const nonvisualStoryIds = new Set([
  "api-confirm-dialog--cancel",
  "api-helpers--helpers",
]);

const designCoreSource = path.resolve(repoRoot, "../design-core");
const stagedDesignCore = path.join(repoRoot, ".deps/design-core");
const rootPackage = path.join(repoRoot, "package.json");

export function spawnInRepo(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    ...options,
  });
}

export function selectVisualStoryIds(prefixes = defaultStoryPrefixes) {
  const index = JSON.parse(
    readFileSync(path.join(repoRoot, "storybook-static/index.json"), "utf8"),
  );
  return Object.keys(index.entries ?? {}).filter(
    (id) =>
      prefixes.some((prefix) => id.startsWith(prefix)) &&
      !id.includes("--docs") &&
      !nonvisualStoryIds.has(id),
  );
}

function assertSucceeded(result, description) {
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${description} failed with exit code ${result.status}`);
  }
}

function setDesignCoreSpecifier(specifier) {
  const data = JSON.parse(readFileSync(rootPackage, "utf8"));
  data.devDependencies["@lapismd/design-core"] = specifier;
  data.pnpm.overrides["@lapismd/design-core"] = specifier;
  writeFileSync(rootPackage, `${JSON.stringify(data, null, 2)}\n`);
}

function stageDesignCore() {
  mkdirSync(path.dirname(stagedDesignCore), { recursive: true });
  assertSucceeded(
    spawnInRepo("rsync", [
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
    ]),
    "Staging design-core",
  );
}

/**
 * Visual Delta captures run in Docker with this repository as their build
 * context. Temporarily make the sibling design-core checkout part of that
 * context, then restore the permanent local dependency even when capture fails.
 */
export function withStagedDesignCore(capture) {
  const originalPackage = readFileSync(rootPackage, "utf8");
  let captureResult;
  let captureError;
  let restoreError;

  try {
    stageDesignCore();
    setDesignCoreSpecifier("file:./.deps/design-core");
    assertSucceeded(
      spawnInRepo("pnpm", ["install", "--ignore-scripts"]),
      "Installing staged design-core",
    );
    captureResult = capture();
  } catch (error) {
    captureError = error;
  } finally {
    writeFileSync(rootPackage, originalPackage);
    const restoreResult = spawnInRepo("pnpm", ["install", "--ignore-scripts"]);
    rmSync(path.join(repoRoot, ".deps"), { recursive: true, force: true });
    try {
      assertSucceeded(restoreResult, "Restoring permanent dependencies");
    } catch (error) {
      restoreError = error;
    }
  }

  if (captureError) throw captureError;
  if (restoreError) throw restoreError;
  return captureResult;
}
