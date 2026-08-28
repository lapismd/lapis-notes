#!/usr/bin/env node
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const pluginRepositoryRoot = path.resolve(
  process.env.LAPIS_PLUGINS_REPO ?? path.join(repositoryRoot, "../lapis-plugins"),
);
const releaseManifestPath = path.join(
  pluginRepositoryRoot,
  ".release/npm/manifest.json",
);
const pnpmfilePath = path.join(repositoryRoot, ".pnpmfile.cjs");
const requiredPackages = new Set([
  "@lapis-notes/ai",
  "@lapis-notes/bases",
  "@lapis-notes/bookmarks",
  "@lapis-notes/graph",
  "@lapis-notes/history",
  "@lapis-notes/markdown",
  "@lapis-notes/markdown-lint",
  "@lapis-notes/search",
  "@lapis-notes/source-editor",
  "@lapis-notes/spellcheck",
  "@lapis-notes/wordcount",
]);

await writeFile(
  pnpmfilePath,
  'module.exports = require("./scripts/local-plugin-pnpmfile.cjs");\n',
);

const releaseEntries = JSON.parse(await readFile(releaseManifestPath, "utf8"));
const releasePackages = new Set(releaseEntries.map((entry) => entry.packageName));
for (const packageName of requiredPackages) {
  if (!releasePackages.has(packageName)) {
    throw new Error(`Local plugin release manifest is missing ${packageName}.`);
  }
}

for (const entry of releaseEntries) {
  const tarballPath = path.resolve(pluginRepositoryRoot, entry.tarball);
  await access(tarballPath);
  const checksum = createHash("sha256")
    .update(await readFile(tarballPath))
    .digest("hex");
  if (checksum !== entry.sha256) {
    throw new Error(`${entry.packageName} local tarball checksum does not match.`);
  }
}

console.log(
  `Installing ${releaseEntries.length} verified local plugin tarballs without changing pnpm-lock.yaml.`,
);
await runPnpmInstall();

function runPnpmInstall() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "pnpm.cmd" : "pnpm",
      ["install", "--lockfile=false", "--prefer-offline", "--force"],
      {
        cwd: repositoryRoot,
        env: {
          ...process.env,
          LAPIS_PLUGIN_TARBALL_MANIFEST: releaseManifestPath,
        },
        stdio: "inherit",
      },
    );
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`pnpm install failed (${signal ?? code}).`));
    });
  });
}
