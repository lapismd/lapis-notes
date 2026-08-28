import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { validateReleaseManifest } from "./release-manifest.mjs";
import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";

async function fixture() {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "lapis-release-manifest-"));
  for (const definition of PUBLIC_PACKAGE_GRAPH) {
    const packageDir = path.join(repoRoot, "packages", definition.directory);
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(
      path.join(packageDir, "package.json"),
      JSON.stringify({ name: definition.name, version: "0.1.0" }),
    );
  }
  return repoRoot;
}

test("validates release manifest shape and package identity", async () => {
  const repoRoot = await fixture();
  try {
    assert.doesNotThrow(() =>
      validateReleaseManifest(
        {
          schemaVersion: 1,
          repository: "lapismd/lapis-notes",
          commit: "abc123",
          artifactName: "lapis-notes-release-abc123",
          registry: "https://registry.npmjs.org",
          bootstrapRequired: true,
          packages: [
            {
              name: "@lapis-notes/ui",
              directory: "ui",
              version: "0.1.0",
              tag: "next",
              dependencies: [],
              registryEmpty: true,
              shouldPublish: false,
              tarball: "tarballs/lapis-notes-ui-0.1.0.tgz",
              shasum: "a".repeat(64),
              integrity: "sha512-aaaa",
              size: 1,
              files: ["package/package.json"],
            },
          ],
        },
        {
          repoRoot,
          manifestPath: path.join(repoRoot, ".release/release-manifest.json"),
          requireTarballs: false,
        },
      ),
    );
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
