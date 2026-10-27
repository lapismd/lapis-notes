import assert from "node:assert/strict";
import { copyFile, lstat, mkdir, writeFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import { MODEL_REFERENCES, MODEL_RUNTIME_ASSET } from "./model.mjs";
import {
  digest,
  oracleDocuments,
  packetAssets,
  physicalBytes,
  verifyAsset,
} from "./seed-model.mjs";
import { sendDirectory } from "../validation/docker.mjs";

export async function prepareImageModel(
  root,
  input,
  environment = process.env,
) {
  if (environment.LAPIS_SERVER_TEST_ONNX !== "1") return undefined;
  const runtime = environment.LAPIS_SERVER_TEST_ONNX_RUNTIME;
  assert.ok(
    typeof runtime === "string" && isAbsolute(runtime),
    "Actual image ONNX requires an absolute LAPIS_SERVER_TEST_ONNX_RUNTIME",
  );
  const documents = await oracleDocuments({
    "model-legacy.json": join(
      root,
      "packages/api/src/lib/__tests__/fixtures/search-semantic-model.json",
    ),
    "model-linux.json": join(
      root,
      "crates/lapis-app-core/tests/fixtures/search-model/linux-x64-ort-1.30.0-amd-7800x3d.json.txt",
    ),
  });
  const legacy = documents["model-legacy.json"].value;
  let cache = root;
  for (const part of [
    ".local",
    "search-models",
    ...legacy.modelId.split("/"),
  ]) {
    cache = join(cache, part);
    const info = await lstat(cache);
    assert.ok(
      info.isDirectory() && !info.isSymbolicLink(),
      "Model cache must be physical",
    );
  }
  const sources = [
    ...legacy.assets.map((asset) => ({ asset, path: join(cache, asset.file) })),
    { asset: MODEL_RUNTIME_ASSET, path: runtime },
  ];
  const payloads = [];
  for (const { asset, path } of sources) {
    const bytes = await physicalBytes(path);
    verifyAsset(bytes, asset);
    payloads.push(bytes);
  }
  const manifest = {
    schema: 1,
    references: MODEL_REFERENCES,
    assets: packetAssets(legacy),
  };
  const bytes = Buffer.from(JSON.stringify(manifest, null, 2) + "\n");
  await mkdir(join(input, "model-assets"), { recursive: true });
  for (const [name, document] of Object.entries(documents))
    await writeFile(join(input, name), document.bytes);
  for (const [index, asset] of manifest.assets.entries())
    await writeFile(join(input, asset.file), payloads[index]);
  await writeFile(join(input, "model-assets.json"), bytes);
  for (const name of ["model.mjs", "seed-model.mjs"])
    await copyFile(
      join(root, "scripts/server-container", name),
      join(input, name),
    );
  return { manifestSha256: digest(bytes), assets: manifest.assets.length };
}

export async function seedImageModel(prepared, context) {
  const {
    config,
    run,
    input,
    volume,
    name,
    tool,
    label,
    resources,
    containers,
  } = context;
  const container = `${name}-models`;
  containers.push(container);
  await run([
    "create",
    `--name=${container}`,
    "--user=1993:1993",
    "--cap-drop=ALL",
    ...label,
    ...resources(1),
    `--mount=type=volume,source=${volume},target=/data`,
    tool,
    "node",
    "/input/seed-model.mjs",
  ]);
  await sendDirectory(config, ["cp", "-", `${container}:/input`], input);
  const output = await run(["start", "--attach", container]);
  const match = /^MODEL_ASSETS (.+)$/mu.exec(output);
  assert.ok(match, "Model seed must return a verified packet receipt");
  const receipt = JSON.parse(match[1]);
  assert.equal(receipt.schema, 1);
  assert.equal(receipt.assets, prepared.assets);
  assert.equal(receipt.manifestSha256, prepared.manifestSha256);
  return receipt;
}

/** Prepare only this run's private config/data volumes before starting the app. */
export async function prepareImageStorage(prepared, context) {
  const {
    run,
    volumes,
    name,
    imageId,
    label,
    resources,
    containers,
    password,
  } = context;
  for (const volume of volumes)
    await run(["volume", "create", ...label, volume]);
  const container = `${name}-prepare`;
  containers.push(container);
  await run(
    [
      "run",
      `--name=${container}`,
      "--interactive",
      "--user=0:0",
      "--read-only",
      "--cap-drop=ALL",
      "--cap-add=CHOWN",
      ...label,
      ...resources(0.25),
      `--mount=type=volume,source=${volumes[0]},target=/data`,
      `--mount=type=volume,source=${volumes[1]},target=/run/lapis`,
      "--entrypoint=/bin/sh",
      imageId,
      "-ceu",
      "umask 077; cat > /run/lapis/bootstrap-password; printf '{\"vaults\":[]}\\n' > /run/lapis/config.json; chown 1993:1993 /data /run/lapis /run/lapis/config.json /run/lapis/bootstrap-password",
    ],
    password + "\n",
  );
  return prepared
    ? seedImageModel(prepared, { ...context, volume: volumes[0] })
    : undefined;
}
