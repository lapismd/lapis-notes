import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { MODEL_REFERENCES, MODEL_RUNTIME_ASSET } from "./model.mjs";

export const digest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
export async function physicalBytes(path) {
  const info = await lstat(path);
  assert.ok(
    info.isFile() && !info.isSymbolicLink(),
    "Model input must be a regular file",
  );
  return readFile(path);
}
export function verifyAsset(bytes, asset) {
  assert.equal(bytes.length, asset.bytes, asset.file);
  assert.equal(digest(bytes), asset.sha256, asset.file);
}
export async function oracleDocuments(paths) {
  const documents = {};
  for (const [name, expected] of Object.entries(MODEL_REFERENCES)) {
    const bytes = await physicalBytes(paths[name]);
    assert.equal(digest(bytes), expected, name);
    documents[name] = { bytes, value: JSON.parse(bytes.toString("utf8")) };
  }
  return documents;
}
export function packetAssets(legacy) {
  return [...legacy.assets, MODEL_RUNTIME_ASSET].map((asset) => {
    const name = `${asset.sha256}-${basename(asset.file)}`;
    return {
      file: `model-assets/${name}`,
      name,
      bytes: asset.bytes,
      sha256: asset.sha256,
    };
  });
}
export async function readModelPacket(directory) {
  const documents = await oracleDocuments(
    Object.fromEntries(
      Object.keys(MODEL_REFERENCES).map((name) => [
        name,
        join(directory, name),
      ]),
    ),
  );
  const manifestBytes = await physicalBytes(
    join(directory, "model-assets.json"),
  );
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const assets = packetAssets(documents["model-legacy.json"].value);
  assert.deepEqual(manifest, {
    schema: 1,
    references: MODEL_REFERENCES,
    assets,
  });
  const payloads = [];
  for (const asset of assets) {
    const bytes = await physicalBytes(join(directory, asset.file));
    verifyAsset(bytes, asset);
    payloads.push({ asset, bytes });
  }
  return { manifestSha256: digest(manifestBytes), payloads };
}

export async function seedImageModels(directory = "/input") {
  assert.equal(
    process.getuid(),
    1993,
    "Model seed must run as the service identity",
  );
  const packet = await readModelPacket(directory);
  const root = await lstat("/data");
  assert.ok(root.isDirectory() && !root.isSymbolicLink());
  await mkdir("/data/models", { recursive: true, mode: 0o700 });
  const models = await lstat("/data/models");
  assert.ok(models.isDirectory() && !models.isSymbolicLink());
  for (const { asset, bytes } of packet.payloads)
    await writeFile(join("/data/models", asset.name), bytes, {
      flag: "wx",
      mode: 0o600,
    });
  return {
    schema: 1,
    assets: packet.payloads.length,
    bytes: packet.payloads.reduce(
      (total, { bytes }) => total + bytes.length,
      0,
    ),
    manifestSha256: packet.manifestSha256,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  assert.equal(process.argv.length, 2, "Model seeding takes no runtime paths");
  console.log("MODEL_ASSETS " + JSON.stringify(await seedImageModels()));
}
