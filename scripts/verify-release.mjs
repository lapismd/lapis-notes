import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { DEFAULT_REPO_ROOT, readPublicPackages } from "./public-packages.mjs";
import {
  defaultReleaseManifestPath,
  loadReleaseManifest,
  validateReleaseManifest,
} from "./release-manifest.mjs";

function parseArgs(argv) {
  const options = {
    repoRoot: DEFAULT_REPO_ROOT,
    manifestPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--") {
      continue;
    }
    if (value === "--manifest") {
      options.manifestPath = argv[++index];
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

export function verifyPublishedPackages({
  repoRoot = DEFAULT_REPO_ROOT,
  manifest,
  manifestPath,
} = {}) {
  validateReleaseManifest(manifest, {
    repoRoot,
    manifestPath,
    requireTarballs: false,
  });

  const packageRecords = readPublicPackages(repoRoot);
  const packageByName = new Map(
    packageRecords.map((record) => [record.name, record]),
  );
  const dependencyEntries = publishedConsumerDependencyEntries(
    repoRoot,
    manifest,
  );
  const peerDependencies = {};
  for (const entry of manifest.packages) {
    const record = packageByName.get(entry.name);
    for (const [dependencyName, range] of Object.entries(
      record?.manifest.peerDependencies ?? {},
    )) {
      if (!dependencyEntries[dependencyName]) {
        peerDependencies[dependencyName] = range;
      }
    }
  }
  const consumerDir = mkdtempSync(
    path.join(tmpdir(), "lapis-notes-registry-consumer-"),
  );

  try {
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
    writeFileSync(
      path.join(consumerDir, "resolve.mjs"),
      [
        `const specifiers = ${JSON.stringify(
          [
            ...new Set(
              manifest.packages.flatMap((entry) => [
                ...(packageByName.get(entry.name)?.importSpecifiers ?? []),
                ...(packageByName.get(entry.name)?.resolveSpecifiers ?? []),
              ]),
            ),
          ],
          null,
          2,
        )};`,
        "for (const specifier of specifiers) {",
        "  console.log(`${specifier} -> ${import.meta.resolve(specifier)}`);",
        "}",
        "",
      ].join("\n"),
    );

    run("pnpm", ["install", "--strict-peer-dependencies=false"], {
      cwd: consumerDir,
    });
    run("pnpm", ["check"], { cwd: consumerDir });
  } finally {
    rmSync(consumerDir, { recursive: true, force: true });
  }
}

export function publishedConsumerDependencyEntries(repoRoot, manifest) {
  const publishedVersions = new Map(
    manifest.packages.map((entry) => [entry.name, entry.version]),
  );
  return Object.fromEntries(
    readPublicPackages(repoRoot).map((record) => [
      record.name,
      publishedVersions.get(record.name) ?? record.version,
    ]),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs(process.argv.slice(2));
  const manifestPath =
    options.manifestPath ?? defaultReleaseManifestPath(options.repoRoot);
  const manifest = loadReleaseManifest(manifestPath);
  verifyPublishedPackages({
    repoRoot: options.repoRoot,
    manifest,
    manifestPath,
  });
  process.stdout.write("Published package verification passed.\n");
}
