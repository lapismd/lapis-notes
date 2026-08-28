import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  INITIAL_PUBLIC_VERSION,
  PUBLIC_PACKAGE_GRAPH,
} from "./public-packages.mjs";
import { validatePublicPackageBoundaries } from "./check-package-boundaries.mjs";

function manifest(definition, overrides = {}) {
  return {
    name: definition.name,
    version: INITIAL_PUBLIC_VERSION,
    description: definition.name,
    license: "AGPL-3.0-or-later",
    repository: {
      type: "git",
      url: "git+https://github.com/lapismd/lapis-notes.git",
      directory: `packages/${definition.directory}`,
    },
    homepage: `https://github.com/lapismd/lapis-notes/tree/main/packages/${definition.directory}#readme`,
    bugs: {
      url: "https://github.com/lapismd/lapis-notes/issues",
    },
    publishConfig: {
      access: "public",
    },
    files: ["README.md", "CHANGELOG.md", "LICENSE.md", "dist"],
    dependencies: {},
    peerDependencies: {},
    ...overrides,
  };
}

async function fixture(records = PUBLIC_PACKAGE_GRAPH) {
  const repoRoot = await mkdtemp(path.join(tmpdir(), "lapis-package-boundary-"));
  for (const definition of records) {
    const packageDir = path.join(repoRoot, "packages", definition.directory);
    mkdirSync(packageDir, { recursive: true });
    for (const file of ["README.md", "CHANGELOG.md", "LICENSE.md"]) {
      writeFileSync(path.join(packageDir, file), file);
    }
  }
  return repoRoot;
}

test("validates the public package graph", async () => {
  const repoRoot = await fixture();
  try {
    const records = PUBLIC_PACKAGE_GRAPH.map((definition) => {
      const deps = {};
      const peers = {};
      for (const dependencyName of definition.internalDependencies) {
        if (definition.name === "@lapis-notes/api") {
          peers[dependencyName] = `^${INITIAL_PUBLIC_VERSION}`;
        } else {
          deps[dependencyName] = `^${INITIAL_PUBLIC_VERSION}`;
        }
      }
      return {
        ...definition,
        version: INITIAL_PUBLIC_VERSION,
        manifest: manifest(definition, {
          dependencies: deps,
          peerDependencies: peers,
        }),
      };
    });
    assert.doesNotThrow(() => validatePublicPackageBoundaries({ repoRoot, records }));
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});

test("rejects local dependency protocols in packed public manifests", async () => {
  const repoRoot = await fixture();
  try {
    const records = PUBLIC_PACKAGE_GRAPH.map((definition) => ({
      ...definition,
      version: INITIAL_PUBLIC_VERSION,
      manifest: manifest(definition),
    }));
    records[0].manifest.dependencies["@lapismd/design-core"] = "link:../design-core";

    assert.throws(
      () => validatePublicPackageBoundaries({ repoRoot, records }),
      /local protocol/,
    );
  } finally {
    await rm(repoRoot, { recursive: true, force: true });
  }
});
