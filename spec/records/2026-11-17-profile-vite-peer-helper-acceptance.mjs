import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const cohort = JSON.parse(readFileSync("/input/cohort/archives.json", "utf8"));
const overrides = {};
for (const entry of cohort) {
  const path = join("/input/cohort", entry.path);
  assert.equal(
    createHash("sha256").update(readFileSync(path)).digest("hex"),
    entry.sha256,
  );
  overrides[entry.name] = "file:" + path;
  if (entry.name === "@lapis-notes/app-profile") {
    const pkg = JSON.parse(
      execFileSync("tar", ["-xOf", path, "package/package.json"], {
        encoding: "utf8",
      }),
    );
    assert.ok(pkg.devDependencies.vite);
    assert.equal(pkg.peerDependencies.vite, undefined);
    assert.equal(pkg.peerDependenciesMeta?.vite, undefined);
    assert.equal(pkg.dependencies.vite, undefined);
    assert.equal(
      pkg.exports["./plugin-host-build"].import,
      "./dist/plugin-host-build.js",
    );
  }
}
const results = [];
for (const vite of ["6.4.5", "7.3.7"]) {
  const cwd = mkdtempSync(join(tmpdir(), "lapis-profile-vite-"));
  const run = (args) =>
    execFileSync("pnpm", args, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, npm_config_store_dir: "/cache/pnpm" },
    });
  writeFileSync(
    join(cwd, "package.json"),
    JSON.stringify({
      private: true,
      type: "module",
      packageManager: "pnpm@10.34.5",
      dependencies: { ...overrides },
      devDependencies: {
        vite,
        typescript: "5.9.3",
        "@types/node": "^24",
        svelte: "5.56.10",
      },
    }),
  );
  writeFileSync(
    join(cwd, "pnpm-workspace.yaml"),
    "packages: []\noverrides:\n" +
      Object.entries(overrides)
        .map(([n, v]) => "  " + JSON.stringify(n) + ": " + JSON.stringify(v))
        .join("\n") +
      "\n",
  );
  writeFileSync(
    join(cwd, "vite.config.ts"),
    `import {defineConfig, type Plugin} from 'vite';\nimport {pluginHostImportMapPlugin,rendererPluginImportMap,rendererPluginHostInputs,resolvePluginHostModule,loadPluginHostModule} from '@lapis-notes/app-profile/plugin-host-build';\nconst plugin:Plugin=pluginHostImportMapPlugin();\nif(!Object.keys(rendererPluginHostInputs).length)throw Error('Missing host inputs');\nconst entry=rendererPluginImportMap.imports['@lapis-notes/api'];\nconst id=resolvePluginHostModule(entry);\nif(!id||!loadPluginHostModule(id))throw Error('Missing host module');\nexport default defineConfig({plugins:[plugin]});\n`,
  );
  writeFileSync(
    join(cwd, "index.html"),
    '<script type="module" src="/main.ts"></script>',
  );
  writeFileSync(
    join(cwd, "main.ts"),
    'document.body.textContent="Profile helper build acceptance";',
  );
  run(["install", "--ignore-scripts"]);
  run([
    "exec",
    "tsc",
    "--noEmit",
    "--strict",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "--target",
    "ES2022",
    "vite.config.ts",
  ]);
  run(["exec", "vite", "build"]);
  assert.match(
    readFileSync(join(cwd, "dist/index.html"), "utf8"),
    /type="importmap"/,
  );
  const audit = execFileSync(
    "pnpm",
    ["list", "--prod", "--depth", "Infinity", "--json"],
    { cwd, encoding: "utf8" },
  );
  assert.doesNotMatch(audit, /"vite"\s*:/);
  results.push({
    vite,
    types: "passed",
    build: "passed",
    importMap: "passed",
    productionVite: "absent",
  });
}
mkdirSync("/results", { recursive: true });
writeFileSync(
  "/results/profile-helper-smoke.json",
  JSON.stringify({ cohort, results }, null, 2) + "\n",
);
console.log(JSON.stringify(results));
