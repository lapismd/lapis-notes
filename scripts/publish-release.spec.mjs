import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { publishVerifiedPackages } from "./publish-release.mjs";
import { PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";

async function manifestFixture(bootstrapRequired = false) {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "lapis-publish-release-"));
  const tarballDir = path.join(repoRoot, ".release", "tarballs");
  mkdirSync(tarballDir, { recursive: true });
  writeFileSync(path.join(tarballDir, "lapis-notes-ui-0.1.0.tgz"), "x");
  for (const definition of PUBLIC_PACKAGE_GRAPH) {
    const packageDir = path.join(repoRoot, "packages", definition.directory);
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(
      path.join(packageDir, "package.json"),
      JSON.stringify({ name: definition.name, version: "0.1.0" }),
    );
  }
  return {
    repoRoot,
    manifestPath: path.join(repoRoot, ".release/release-manifest.json"),
    manifest: {
      schemaVersion: 1,
      repository: "lapismd/lapis-notes",
      commit: "abc123",
      artifactName: "lapis-notes-release-abc123",
      registry: "https://registry.npmjs.org",
      bootstrapRequired,
      packages: [
        {
          name: "@lapis-notes/ui",
          directory: "ui",
          version: "0.1.0",
          tag: "next",
          dependencies: [],
          registryEmpty: bootstrapRequired,
          shouldPublish: !bootstrapRequired,
          tarball: "tarballs/lapis-notes-ui-0.1.0.tgz",
          shasum: "a".repeat(64),
          integrity: "sha512-aaaa",
          size: 1,
          files: ["package/package.json"],
        },
      ],
    },
  };
}

test("refuses to publish manual bootstrap packages in CI", async () => {
  const fixture = await manifestFixture(true);
  try {
    assert.throws(
      () =>
        publishVerifiedPackages({
          ...fixture,
          env: { LAPIS_RELEASE_APPROVED: "1" },
        }),
      /manual npm publication/,
    );
  } finally {
    await rm(fixture.repoRoot, { recursive: true, force: true });
  }
});

test("requires an explicit CI approval environment variable", async () => {
  const fixture = await manifestFixture(false);
  try {
    assert.throws(
      () => publishVerifiedPackages({ ...fixture, env: {} }),
      /LAPIS_RELEASE_APPROVED/,
    );
  } finally {
    await rm(fixture.repoRoot, { recursive: true, force: true });
  }
});
