import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { writeDocsManifest } from "./docs-artifact.mjs";

test("API export records sorted raw Markdown hashes and source identity", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "api-export-test-"));
  try {
    await mkdir(path.join(root, "classes"));
    await writeFile(path.join(root, "index.md"), "# API\n");
    await writeFile(path.join(root, "classes/App.md"), "# App\n");
    const manifest = await writeDocsManifest(root, {
      version: "0.2.4",
      revision: "a".repeat(40),
    });
    assert.deepEqual(
      manifest.files.map((file) => file.path),
      ["classes/App.md", "index.md"],
    );
    assert.match(manifest.files[0].sha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(
      JSON.parse(await readFile(path.join(root, "manifest.json"))),
      manifest,
    );
    await symlink(path.join(root, "index.md"), path.join(root, "external.md"));
    await assert.rejects(writeDocsManifest(root, {}), /symlinks/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("an incomplete API export cannot publish a manifest", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "api-export-empty-"));
  try {
    await assert.rejects(writeDocsManifest(root, {}), /index/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("API artifacts reject malformed code fences that hide member anchors", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "api-export-fence-"));
  try {
    await writeFile(
      path.join(root, "index.md"),
      "# API\n```ts\nexample();\n```;\n## member\n",
    );
    await assert.rejects(
      writeDocsManifest(root, {}),
      /Malformed Markdown code fence/,
    );
    await writeFile(
      path.join(root, "index.md"),
      "# API\n```ts\nexample();\n```\n## member\n",
    );
    await writeDocsManifest(root, {});
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
