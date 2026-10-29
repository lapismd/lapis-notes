import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { cpus } from "node:os";
import {
  mkdir,
  readFile,
  lstat,
  rename,
  writeFile,
  rm,
} from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = JSON.parse(
  await readFile(
    join(
      root,
      "packages/api/src/lib/__tests__/fixtures/search-semantic-model.json",
    ),
    "utf8",
  ),
);
const fetchAssets = process.argv.slice(2).includes("--download");
if (process.argv.slice(2).some((value) => value !== "--download"))
  throw new Error("Use pnpm test:search:onnx [--download]");
const referenceContext =
  process.env.LAPIS_TEST_ONNX_REFERENCE_CONTEXT ??
  (process.platform === "darwin" && process.arch === "arm64"
    ? "darwin-arm64-ort-1.30.0"
    : process.platform === "linux" &&
        process.arch === "x64" &&
        cpus()[0]?.model === "AMD Ryzen 7 7800X3D 8-Core Processor"
      ? "linux-x64-ort-1.30.0-amd-7800x3d"
      : undefined);
if (!referenceContext)
  throw new Error(
    "Native model parity requires a qualified CPU/runtime reference context",
  );
let folder = root;
for (const part of [".local", "search-models", ...fixture.modelId.split("/")]) {
  folder = join(folder, part);
  await mkdir(folder, { recursive: false }).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });
  const info = await lstat(folder);
  if (!info.isDirectory() || info.isSymbolicLink())
    throw new Error("Search test assets require a checkout-owned cache");
}
for (const asset of fixture.assets) {
  if (
    !/^(?:config\.json|tokenizer(?:_config)?\.json|special_tokens_map\.json|onnx\/model_quantized\.onnx)$/u.test(
      asset.file,
    )
  )
    throw new Error("Unknown qualified model asset");
  const path = join(folder, asset.file);
  if (asset.file.includes("/")) {
    await mkdir(dirname(path), { recursive: false }).catch((error) => {
      if (error.code !== "EEXIST") throw error;
    });
    if ((await lstat(dirname(path))).isSymbolicLink())
      throw new Error("Search test cache cannot use symlinks");
  }
  let bytes;
  try {
    if ((await lstat(path)).isSymbolicLink())
      throw new Error("Search test assets cannot use symlinks");
    bytes = await readFile(path);
  } catch (error) {
    if (error.code !== "ENOENT" || !fetchAssets)
      throw new Error(
        `Missing qualified ${asset.file}; run pnpm test:search:onnx --download`,
        { cause: error },
      );
    const response = await fetch(
      `https://huggingface.co/${fixture.modelId}/resolve/${fixture.revision}/${asset.file}`,
    );
    if (!response.ok)
      throw new Error(`Qualified model download failed: ${response.status}`);
    bytes = new Uint8Array(await response.arrayBuffer());
    if (
      bytes.byteLength !== asset.bytes ||
      createHash("sha256").update(bytes).digest("hex") !== asset.sha256
    )
      throw new Error("Qualified model asset digest differs");
    const pending = `${path}.${process.pid}.download`;
    try {
      await writeFile(pending, bytes, { flag: "wx" });
      await rename(pending, path);
    } finally {
      await rm(pending, { force: true });
    }
  }
  if (
    bytes.byteLength !== asset.bytes ||
    createHash("sha256").update(bytes).digest("hex") !== asset.sha256
  )
    throw new Error(`Qualified model asset differs: ${asset.file}`);
}
let runtime = process.env.LAPIS_TEST_ONNX_RUNTIME;
if (!runtime) {
  const api = createRequire(join(root, "packages/api/package.json"));
  const transformers = createRequire(api.resolve("@huggingface/transformers"));
  const location = resolve(
    dirname(transformers.resolve("onnxruntime-node")),
    "..",
  );
  const info = JSON.parse(
    await readFile(join(location, "package.json"), "utf8"),
  );
  if (info.version !== "1.30.0")
    throw new Error(
      "Qualify the changed ONNX runtime before updating this receipt",
    );
  const file =
    process.platform === "darwin"
      ? "libonnxruntime.1.30.0.dylib"
      : process.platform === "linux"
        ? "libonnxruntime.so.1"
        : "onnxruntime.dll";
  runtime = join(location, "bin/napi-v6", process.platform, process.arch, file);
}
const runtimeBytes = await readFile(runtime);
console.log(
  JSON.stringify({
    runtimeVersion: "API 30",
    runtimeSha256: createHash("sha256").update(runtimeBytes).digest("hex"),
    model: fixture.modelId,
    revision: fixture.revision,
    modelFiles: fixture.assets.length,
  }),
);
const result = spawnSync(
  process.execPath,
  [
    join(root, "scripts/rust-core.mjs"),
    "test",
    "-p",
    "lapis-app-core",
    "--test",
    "embedding_model",
    "--test",
    "database_search_provider_model",
    "--test",
    "database_search_semantic_model",
    "--test",
    "embedding_cache_model",
    "--locked",
    "--",
    "--ignored",
  ],
  {
    cwd: root,
    stdio: "inherit",
    env: {
      ...process.env,
      CARGO_BUILD_JOBS: process.env.CARGO_BUILD_JOBS ?? "2",
      LAPIS_TEST_ONNX_REFERENCE_CONTEXT: referenceContext,
      LAPIS_TEST_ONNX_RUNTIME: runtime,
      LAPIS_TEST_ONNX_MODEL: folder,
      LAPIS_TEST_ONNX_CACHE_DOWNLOAD: fetchAssets ? "1" : "0",
    },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
