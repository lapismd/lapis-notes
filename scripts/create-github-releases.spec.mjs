import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  createGithubReleases,
  extractChangelogNotes,
  githubReleaseExists,
  releaseBody,
} from "./create-github-releases.mjs";
import { packageReleaseTag, PUBLIC_PACKAGE_GRAPH } from "./public-packages.mjs";

test("uses package-scoped Lapis release tags", () => {
  assert.equal(packageReleaseTag("@lapis-notes/ui", "0.1.0"), "ui@0.1.0");
  assert.equal(packageReleaseTag("@lapis-notes/api", "0.1.0"), "api@0.1.0");
});

test("documents npm and checksum evidence in release notes", () => {
  const body = releaseBody(
    {
      name: "@lapis-notes/ui",
      directory: "ui",
      version: "0.1.0",
      tag: "next",
      shasum: "a".repeat(64),
      integrity: "sha512-example",
    },
    {
      commit: "abc123",
    },
    "### Minor Changes\n\n- First public release.",
  );
  assert.match(body, /@lapis-notes\/ui@0\.1\.0/);
  assert.match(body, /npm package/);
  assert.match(body, /tarball SHA-256/);
  assert.match(body, /First public release/);
});

test("looks up a package release tag and fails closed on unexpected HTTP status", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, authorization: init.headers.Authorization });
    return {
      status: url.endsWith("/ui%400.1.4") ? 404 : 200,
      json: async () => ({}),
    };
  };
  assert.equal(
    await githubReleaseExists("@lapis-notes/ui", "0.1.4", {
      fetchImpl,
      token: "token",
    }),
    false,
  );
  assert.equal(
    await githubReleaseExists("@lapis-notes/api", "0.2.0", {
      fetchImpl,
      token: "token",
    }),
    true,
  );
  assert.match(
    calls[0].url,
    /\/repos\/lapismd\/lapis-notes\/releases\/tags\/ui%400\.1\.4$/,
  );
  assert.equal(calls[0].authorization, "Bearer token");
  await assert.rejects(
    () =>
      githubReleaseExists("@lapis-notes/ui", "0.1.0", {
        fetchImpl: async () => ({ status: 500 }),
        token: "",
      }),
    /HTTP 500/,
  );
});

async function releaseFixture() {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "lapis-github-release-"));
  for (const definition of PUBLIC_PACKAGE_GRAPH) {
    const packageDir = path.join(repoRoot, "packages", definition.directory);
    mkdirSync(packageDir, { recursive: true });
    writeFileSync(
      path.join(packageDir, "package.json"),
      JSON.stringify({ name: definition.name, version: "0.1.0" }),
    );
  }
  writeFileSync(
    path.join(repoRoot, "packages/ui/CHANGELOG.md"),
    "# @lapis-notes/ui\n\n## 0.1.0\n\n- First\n",
  );
  return {
    repoRoot,
    manifestPath: path.join(repoRoot, "release-manifest.json"),
    manifest: {
      schemaVersion: 1,
      repository: "lapismd/lapis-notes",
      commit: "abc123",
      artifactName: "lapis-notes-release-abc123",
      registry: "https://registry.npmjs.org",
      bootstrapRequired: false,
      packages: [
        {
          name: "@lapis-notes/ui",
          directory: "ui",
          version: "0.1.0",
          tag: "next",
          dependencies: [],
          registryEmpty: false,
          shouldPublish: true,
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

test("skips a GitHub release that already exists", async () => {
  const fixture = await releaseFixture();
  try {
    await createGithubReleases({
      ...fixture,
      token: "",
      fetchImpl: async () => ({ status: 200 }),
      runCommand() {
        throw new Error("gh should not create an existing release");
      },
    });
  } finally {
    await rm(fixture.repoRoot, { recursive: true, force: true });
  }
});

test("creates a missing GitHub release and ignores a duplicate tag", async () => {
  const fixture = await releaseFixture();
  const calls = [];
  try {
    await createGithubReleases({
      ...fixture,
      token: "",
      fetchImpl: async () => ({ status: 404 }),
      runCommand(command, args) {
        calls.push([command, ...args]);
        throw new Error("gh release create failed\nrelease already exists");
      },
    });
    assert.equal(calls[0][0], "gh");
    assert.equal(calls[0][1], "release");
    assert.equal(calls[0][2], "create");
    assert.equal(calls[0][3], "ui@0.1.0");
    assert.equal(calls.length, 1);
  } finally {
    await rm(fixture.repoRoot, { recursive: true, force: true });
  }
});

test("extracts changelog notes for one version", () => {
  assert.equal(
    extractChangelogNotes(
      "# @lapis-notes/ui\n\n## 0.2.0\n\n- Later\n\n## 0.1.0\n\n- First\n",
      "0.1.0",
    ),
    "- First",
  );
});
