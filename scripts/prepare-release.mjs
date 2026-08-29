import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createReleasePlan,
  renderReleasePlan,
} from "./release-plan.mjs";
import {
  buildReleaseManifest,
  defaultReleaseManifestPath,
  RELEASE_DIRECTORY,
  TARBALL_DIRECTORY,
  validateReleaseManifest,
} from "./release-manifest.mjs";
import {
  DEFAULT_REPO_ROOT,
  PUBLIC_PACKAGE_NAMES,
  readPublicPackages,
  REPOSITORY,
} from "./public-packages.mjs";

function parseArgs(argv) {
  const options = {
    registry: process.env.npm_config_registry ?? "https://registry.npmjs.org",
    repoRoot: DEFAULT_REPO_ROOT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") {
      continue;
    }
    if (value === "--registry") {
      options.registry = argv[++index];
      continue;
    }
    if (value === "--repo-root") {
      options.repoRoot = argv[++index];
      continue;
    }
    throw new Error(`Unknown argument: ${value}`);
  }

  return options;
}

function run(command, args, options) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout.trim();
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function integrityFile(filePath) {
  return `sha512-${createHash("sha512")
    .update(readFileSync(filePath))
    .digest("base64")}`;
}

function listTarballFiles(filePath) {
  return run("tar", ["-tzf", filePath], { cwd: path.dirname(filePath) })
    .split("\n")
    .filter(Boolean);
}

function parsePnpmPackJson(output) {
  const start = output.lastIndexOf("\n[");
  const objectStart = output.lastIndexOf("\n{");
  const jsonStart = Math.max(start, objectStart);
  const jsonText = jsonStart >= 0 ? output.slice(jsonStart + 1) : output;
  const parsed = JSON.parse(jsonText);
  if (Array.isArray(parsed) && parsed.length === 1) {
    return parsed[0];
  }
  if (parsed && typeof parsed === "object" && typeof parsed.filename === "string") {
    return parsed;
  }
  if (Array.isArray(parsed)) {
    throw new Error("pnpm pack --json output did not contain one packed artifact");
  }
  throw new Error("pnpm pack --json output did not contain a packed artifact");
}

function readPackedJson(filePath, member) {
  const output = execFileSync("tar", ["-xOf", filePath, member], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(output);
}

function assertNoLocalDependencyProtocols(manifest, packageName) {
  const dependencyFields = [
    "dependencies",
    "peerDependencies",
    "optionalDependencies",
    "devDependencies",
  ];

  for (const field of dependencyFields) {
    for (const [dependencyName, range] of Object.entries(manifest[field] ?? {})) {
      if (/^(?:file|link|workspace):/.test(range)) {
        throw new Error(
          `${packageName} packed ${field}.${dependencyName} uses local protocol ${range}`,
        );
      }
      if (dependencyName.startsWith("@lapis-notes/") && !PUBLIC_PACKAGE_NAMES.has(dependencyName)) {
        throw new Error(
          `${packageName} packed ${field}.${dependencyName} references private package ${dependencyName}`,
        );
      }
    }
  }
}

function assertTarballContents(entry, tarballPath) {
  const files = listTarballFiles(tarballPath);
  const requiredFiles = [
    "package/package.json",
    "package/README.md",
    "package/CHANGELOG.md",
    "package/LICENSE.md",
  ];

  for (const requiredFile of requiredFiles) {
    if (!files.includes(requiredFile)) {
      throw new Error(`${entry.name} tarball is missing ${requiredFile}`);
    }
  }

  const manifest = readPackedJson(tarballPath, "package/package.json");
  if (manifest.name !== entry.name || manifest.version !== entry.version) {
    throw new Error(`${entry.name} tarball package.json identity is stale`);
  }
  if (manifest.private) {
    throw new Error(`${entry.name} tarball must not be private`);
  }
  if (manifest.publishConfig?.access !== "public") {
    throw new Error(`${entry.name} tarball must publish with public access`);
  }
  if (manifest.repository?.url !== "git+https://github.com/lapismd/lapis-notes.git") {
    throw new Error(`${entry.name} tarball repository URL must point at ${REPOSITORY}`);
  }
  if (manifest.repository?.directory !== `packages/${entry.directory}`) {
    throw new Error(`${entry.name} tarball repository directory is incorrect`);
  }
  if (!manifest.homepage?.includes(`github.com/lapismd/lapis-notes/tree/main/packages/${entry.directory}`)) {
    throw new Error(`${entry.name} tarball homepage is incorrect`);
  }
  if (manifest.bugs?.url !== "https://github.com/lapismd/lapis-notes/issues") {
    throw new Error(`${entry.name} tarball bugs URL is incorrect`);
  }
  assertNoLocalDependencyProtocols(manifest, entry.name);

  const forbiddenFilePatterns = [
    /^package\/\.svelte-kit\//,
    /^package\/\.turbo\//,
    /^package\/storybook-static\//,
    /^package\/coverage\//,
    /^package\/test-results\//,
    /^package\/playwright-report\//,
  ];
  for (const file of files) {
    if (forbiddenFilePatterns.some((pattern) => pattern.test(file))) {
      throw new Error(`${entry.name} tarball contains generated file ${file}`);
    }
  }

  return files;
}

export function cleanConsumerDependencyEntries(repoRoot, manifest) {
  const selectedTarballs = new Map(
    manifest.packages.map((entry) => [
      entry.name,
      `file:${path.resolve(path.dirname(defaultReleaseManifestPath(repoRoot)), entry.tarball)}`,
    ]),
  );
  return Object.fromEntries(
    readPublicPackages(repoRoot).map((record) => [
      record.name,
      selectedTarballs.get(record.name) ?? record.version,
    ]),
  );
}

function createCleanConsumer(repoRoot, manifest) {
  const consumerDir = mkdtempSync(path.join(tmpdir(), "lapis-notes-release-consumer-"));
  const selectedTarballEntries = Object.fromEntries(
    manifest.packages.map((entry) => [
      entry.name,
      `file:${path.resolve(path.dirname(defaultReleaseManifestPath(repoRoot)), entry.tarball)}`,
    ]),
  );
  const dependencyEntries = cleanConsumerDependencyEntries(repoRoot, manifest);
  const peerDependencies = {};
  for (const entry of manifest.packages) {
    const packageManifest = JSON.parse(
      readFileSync(
        path.join(repoRoot, "packages", entry.directory, "package.json"),
        "utf8",
      ),
    );
    for (const [dependencyName, range] of Object.entries(
      packageManifest.peerDependencies ?? {},
    )) {
      if (!dependencyEntries[dependencyName]) {
        peerDependencies[dependencyName] = range;
      }
    }
  }

  writeFileSync(
    path.join(consumerDir, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        scripts: {
          check: "vite build && node ./resolve.mjs",
        },
        dependencies: dependencyEntries,
        devDependencies: {
          ...peerDependencies,
          "@sveltejs/vite-plugin-svelte": "^6.2.4",
          svelte: peerDependencies.svelte ?? "^5.38.2",
          typescript: "~5.9.3",
          vite: "^7.3.2",
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    path.join(consumerDir, "pnpm-workspace.yaml"),
    [
      "packages: []",
      "overrides:",
      ...Object.entries(selectedTarballEntries).map(
        ([dependencyName, range]) => `  "${dependencyName}": "${range}"`,
      ),
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(consumerDir, "vite.config.ts"),
    [
      'import { svelte } from "@sveltejs/vite-plugin-svelte";',
      'import { defineConfig } from "vite";',
      "",
      "export default defineConfig({",
      "  plugins: [svelte()],",
      "});",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(consumerDir, "index.html"),
    '<script type="module" src="/src/main.ts"></script><div id="app"></div>\n',
  );
  mkdirSync(path.join(consumerDir, "src"), { recursive: true });
  writeFileSync(
    path.join(consumerDir, "src", "main.ts"),
    [
      'import "@lapis-notes/ui/theme.css";',
      'import "@lapis-notes/ui/styles.css";',
      'import "@lapis-notes/ui/codemirror-autocomplete.css";',
      'import { mount } from "svelte";',
      'import App from "./App.svelte";',
      "",
      'const target = document.getElementById("app");',
      "if (target) {",
      "  mount(App, { target });",
      "}",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(consumerDir, "src", "App.svelte"),
    [
      '<script lang="ts">',
      '  import { cn } from "@lapis-notes/ui";',
      '  import Search from "@lapis-notes/ui/search";',
      '  import Modal from "@lapis-notes/ui/modal";',
      '  import ConfirmDialog from "@lapis-notes/ui/confirm-dialog";',
      '  import { TableDragGrip } from "@lapis-notes/ui/table-dnd";',
      '  import { WorkspaceShell } from "@lapis-notes/workspace";',
      "",
      "  void Search;",
      "  void Modal;",
      "  void ConfirmDialog;",
      "  void TableDragGrip;",
      "  void WorkspaceShell;",
      "</script>",
      "",
      '<main class={cn("lapis-smoke")}>Lapis package smoke</main>',
      "",
    ].join("\n"),
  );
  const packageByName = new Map(
    readPublicPackages(repoRoot).map((record) => [record.name, record]),
  );
  const fullResolveSpecifiers = [
    ...new Set(
      manifest.packages.flatMap((entry) => {
        const packageRecord = packageByName.get(entry.name);
        return [
          ...(packageRecord?.importSpecifiers ?? []),
          ...(packageRecord?.resolveSpecifiers ?? []),
        ];
      }),
    ),
  ];
  writeFileSync(
    path.join(consumerDir, "resolve.mjs"),
    [
      `const specifiers = ${JSON.stringify(fullResolveSpecifiers, null, 2)};`,
      "for (const specifier of specifiers) {",
      "  console.log(`${specifier} -> ${import.meta.resolve(specifier)}`);",
      "}",
      "",
    ].join("\n"),
  );

  run("pnpm", ["install", "--ignore-scripts", "--strict-peer-dependencies=false"], {
    cwd: consumerDir,
  });
  run("pnpm", ["check"], { cwd: consumerDir });

  rmSync(consumerDir, { recursive: true, force: true });
}

export async function prepareRelease(options = {}) {
  const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
  const releaseDir = path.join(repoRoot, RELEASE_DIRECTORY);
  const tarballDir = path.join(repoRoot, TARBALL_DIRECTORY);
  mkdirSync(tarballDir, { recursive: true });

  const plan = await createReleasePlan(options);
  process.stdout.write(`${renderReleasePlan(plan)}\n`);

  const packageRecords = readPublicPackages(repoRoot);
  const selectedByName = new Map(plan.selected.map((entry) => [entry.name, entry]));
  const tarballs = [];

  for (const record of packageRecords) {
    const selected = selectedByName.get(record.name);
    if (!selected) {
      continue;
    }
    const packOutput = run(
      "pnpm",
      ["pack", "--json", "--pack-destination", tarballDir],
      { cwd: record.packageDir },
    );
    const packed = parsePnpmPackJson(packOutput);
    const tarballPath = path.resolve(record.packageDir, packed.filename);
    const tarballSize = Number.isInteger(packed.size)
      ? packed.size
      : statSync(tarballPath).size;
    const relativePath = path.relative(releaseDir, tarballPath);
    const files = assertTarballContents(record, tarballPath);
    tarballs.push({
      name: record.name,
      version: record.version,
      relativePath,
      shasum: sha256File(tarballPath),
      integrity: integrityFile(tarballPath),
      size: tarballSize,
      files,
    });
  }

  const manifest = buildReleaseManifest({
    plan,
    packageRecords,
    tarballs,
  });
  const manifestPath = defaultReleaseManifestPath(repoRoot);
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  validateReleaseManifest(manifest, { repoRoot, manifestPath });

  if (manifest.packages.length > 0) {
    createCleanConsumer(repoRoot, manifest);
  }

  process.stdout.write(`Release manifest written to ${manifestPath}\n`);
  if (manifest.bootstrapRequired) {
    process.stdout.write(
      "Initial packages require manual npm publication from the verified release artifact.\n",
    );
  }
  return manifest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await prepareRelease(parseArgs(process.argv.slice(2)));
}
