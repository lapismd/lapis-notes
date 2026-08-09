import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
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

const siblingDeps = [
  {
    name: "@lapismd/design-core",
    source: path.resolve(repoRoot, "../design-core"),
    staged: path.join(repoRoot, ".deps/design-core"),
    stagedSpecifier: "file:./.deps/design-core",
  },
  {
    name: "@lapismd/mira",
    source: path.resolve(repoRoot, "../mira-mde/packages/mira"),
    staged: path.join(repoRoot, ".deps/mira"),
    stagedSpecifier: "file:./.deps/mira",
    // Visual Delta drops path segments named `dist` when staging Docker input.
    rewriteDistToBuilt: true,
  },
  {
    name: "@lapismd/mira-editor",
    source: path.resolve(repoRoot, "../mira-mde/packages/mira-editor"),
    staged: path.join(repoRoot, ".deps/mira-editor"),
    stagedSpecifier: "file:./.deps/mira-editor",
    rewriteDistToBuilt: true,
  },
  {
    name: "@lapismd/mira-plugin-ai",
    source: path.resolve(repoRoot, "../mira-mde/packages/mira-plugin-ai"),
    staged: path.join(repoRoot, ".deps/mira-plugin-ai"),
    stagedSpecifier: "file:./.deps/mira-plugin-ai",
    rewriteDistToBuilt: true,
  },
  {
    name: "@lapismd/mira-plugin-mermaid",
    source: path.resolve(repoRoot, "../mira-mde/packages/mira-plugin-mermaid"),
    staged: path.join(repoRoot, ".deps/mira-plugin-mermaid"),
    stagedSpecifier: "file:./.deps/mira-plugin-mermaid",
    rewriteDistToBuilt: true,
  },
];

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

function setSiblingSpecifiers(getSpecifier) {
  const data = JSON.parse(readFileSync(rootPackage, "utf8"));
  for (const dep of siblingDeps) {
    const specifier = getSpecifier(dep);
    data.devDependencies[dep.name] = specifier;
    data.pnpm.overrides[dep.name] = specifier;
  }
  writeFileSync(rootPackage, `${JSON.stringify(data, null, 2)}\n`);
}

function rewriteMiraDistToBuilt(stagedRoot) {
  const distDir = path.join(stagedRoot, "dist");
  const builtDir = path.join(stagedRoot, "built");
  if (!existsSync(distDir)) {
    throw new Error(
      `Staged @lapismd/mira is missing dist/; build mira before visual capture.`,
    );
  }
  if (existsSync(builtDir)) {
    rmSync(builtDir, { recursive: true, force: true });
  }
  renameSync(distDir, builtDir);

  const packageJsonPath = path.join(stagedRoot, "package.json");
  const rewritten = readFileSync(packageJsonPath, "utf8")
    .replaceAll('"./dist/', '"./built/')
    .replaceAll('"dist"', '"built"')
    .replaceAll("/dist/", "/built/");
  writeFileSync(packageJsonPath, rewritten);
}

function stageSibling(dep) {
  mkdirSync(path.dirname(dep.staged), { recursive: true });
  const excludes = [
    "node_modules",
    ".git",
    ".jj",
    "storybook-static",
    ".svelte-kit",
    ".visual-delta",
    ".ui-generator",
  ];
  // Docker visual capture resolves staged Mira packages via package exports
  // (dist → built). Skip source trees so Vite does not re-transform monorepo
  // sources or pull sibling tsconfig roots outside the capture context.
  if (dep.rewriteDistToBuilt) {
    excludes.push("src", "tests", "docs");
  }
  assertSucceeded(
    spawnInRepo("rsync", [
      "-a",
      "--delete",
      ...excludes.flatMap((entry) => ["--exclude", entry]),
      `${dep.source}/`,
      `${dep.staged}/`,
    ]),
    `Staging ${dep.name}`,
  );

  if (dep.rewriteDistToBuilt) {
    rewriteMiraDistToBuilt(dep.staged);
  }
}

/**
 * Visual Delta captures run in Docker with this repository as their build
 * context. Temporarily make sibling design-core and mira checkouts part of that
 * context, then restore the permanent local dependencies even when capture fails.
 */
export function withStagedDesignCore(capture) {
  const originalPackage = readFileSync(rootPackage, "utf8");
  let captureResult;
  let captureError;
  let restoreError;

  try {
    for (const dep of siblingDeps) {
      stageSibling(dep);
    }
    setSiblingSpecifiers((dep) => dep.stagedSpecifier);
    // Drop stale lockfile entries that still point at sibling checkouts outside
    // the Docker capture context (link:../mira-mde/..., link:../design-core).
    assertSucceeded(
      spawnInRepo("pnpm", [
        "install",
        "--ignore-scripts",
        "--no-frozen-lockfile",
        "--force",
      ]),
      "Installing staged sibling dependencies",
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
