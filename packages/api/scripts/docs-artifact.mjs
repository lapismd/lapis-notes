import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function markdownFiles(root, directory = root) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    assert.ok(
      !entry.isSymbolicLink(),
      "Documentation artifacts cannot contain symlinks",
    );
    if (entry.isDirectory())
      files.push(...(await markdownFiles(root, filename)));
    else if (entry.name.endsWith(".md"))
      files.push(path.relative(root, filename).split(path.sep).join("/"));
  }
  return files.sort();
}

export async function writeDocsManifest(root, metadata) {
  const files = [];
  for (const filename of await markdownFiles(root)) {
    const bytes = await readFile(path.join(root, filename));
    let fence;
    for (const line of bytes.toString("utf8").split("\n")) {
      const match = line.match(/^\s*(`{3,}|~{3,})(.*)$/);
      if (!match) continue;
      assert.notEqual(
        match[2].trim(),
        ";",
        `Malformed Markdown code fence: ${filename}`,
      );
      if (!fence) fence = match[1];
      else if (
        match[1][0] === fence[0] &&
        match[1].length >= fence.length &&
        !match[2].trim()
      )
        fence = undefined;
    }
    assert.ok(!fence, `Unclosed Markdown code fence: ${filename}`);
    files.push({
      path: filename,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  assert.ok(
    files.some((file) => file.path === "index.md"),
    "TypeDoc must export an index",
  );
  const manifest = {
    schemaVersion: 1,
    kind: "lapis-api-docs",
    ...metadata,
    files,
  };
  await writeFile(
    path.join(root, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  return manifest;
}
