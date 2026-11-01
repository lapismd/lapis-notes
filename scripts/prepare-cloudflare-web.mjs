import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { parse as parseJsonc } from "jsonc-parser";

export const ASSET_LIMIT = 25 * 1024 * 1024;
const root = fileURLToPath(new URL("../", import.meta.url));

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Deployment asset must not be a symlink: ${target}`);
    if (entry.isDirectory()) result.push(...(await files(target)));
    else result.push(target);
  }
  return result;
}

export async function prepareCloudflareWeb({
  source = path.join(root, "packages/web/dist"),
  output = path.join(root, ".cloudflare"),
  commit = process.env.LAPIS_BUILD_COMMIT,
} = {}) {
  if (!/^[a-f0-9]{40}$/.test(commit ?? ""))
    throw new Error("LAPIS_BUILD_COMMIT must be a full source commit SHA");
  for (const name of [
    "index.html",
    "sw.js",
    "manifest.webmanifest",
    "_headers",
  ])
    await stat(path.join(source, name));
  const manifest = JSON.parse(
    await readFile(path.join(source, "manifest.webmanifest"), "utf8"),
  );
  if (manifest.id !== "/" || manifest.display !== "standalone")
    throw new Error("Expected the ordinary root-scoped PWA build");
  await rm(output, { recursive: true, force: true });
  const assets = path.join(output, "assets");
  await mkdir(output, { recursive: true });
  await cp(source, assets, { recursive: true });
  const mappings = {};
  const inventory = await files(assets);
  for (const file of inventory) {
    if ((await stat(file)).size <= ASSET_LIMIT) continue;
    if (!file.endsWith(".wasm"))
      throw new Error(`Oversized non-WASM deployment asset: ${file}`);
    const compressed = gzipSync(await readFile(file), { level: 9 });
    if (compressed.length > ASSET_LIMIT)
      throw new Error(`Compressed WASM exceeds the asset limit: ${file}`);
    await writeFile(`${file}.gz`, compressed);
    await rm(file);
    const url = `/${path.relative(assets, file).split(path.sep).join("/")}`;
    mappings[url] = `${url}.gz`;
  }
  const version = { commit };
  await writeFile(
    path.join(assets, "version.json"),
    `${JSON.stringify(version)}\n`,
  );
  await writeFile(
    path.join(output, "compressed-assets.json"),
    `${JSON.stringify(mappings, null, 2)}\n`,
  );
  const configuration = parseJsonc(
    await readFile(path.join(root, "wrangler.jsonc"), "utf8"),
  );
  const deployment = {
    ...configuration,
    main: "bundle/worker.js",
    assets: { ...configuration.assets, directory: "assets" },
  };
  delete deployment.$schema;
  await writeFile(
    path.join(output, "wrangler.json"),
    `${JSON.stringify(deployment, null, 2)}\n`,
  );
  if ((await files(assets)).length > 20_000)
    throw new Error("Deployment exceeds the free-plan asset count");
  return {
    commit,
    compressed: Object.keys(mappings).length,
    files: inventory.length,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  console.log(JSON.stringify(await prepareCloudflareWeb()));
}
