import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { gunzipSync } from "node:zlib";
import {
  ASSET_LIMIT,
  prepareCloudflareWeb,
} from "./prepare-cloudflare-web.mjs";

const directory = await mkdtemp(path.join(os.tmpdir(), "lapis-pwa-package-"));
after(() => rm(directory, { recursive: true, force: true }));
export async function seedPwa(source) {
  await mkdir(path.join(source, "assets"), { recursive: true });
  await writeFile(
    path.join(source, "index.html"),
    "<!doctype html><title>Lapis</title>",
  );
  await writeFile(
    path.join(source, "manifest.webmanifest"),
    JSON.stringify({ id: "/", display: "standalone" }),
  );
  await writeFile(path.join(source, "sw.js"), "// original precache URLs");
  await writeFile(
    path.join(source, "_headers"),
    "/*\n  Cross-Origin-Embedder-Policy: require-corp\n  Cross-Origin-Opener-Policy: same-origin\n",
  );
}

test("preparation retains PWA URLs, deterministically compresses WASM and identifies the source", async () => {
  const source = path.join(directory, "source");
  await seedPwa(source);
  const wasm = Buffer.alloc(ASSET_LIMIT + 1, 7);
  await writeFile(path.join(source, "assets/runtime-AbCd1234.wasm"), wasm);
  const first = path.join(directory, "first");
  const second = path.join(directory, "second");
  const commit = "a".repeat(40);
  assert.equal(
    (await prepareCloudflareWeb({ source, output: first, commit })).compressed,
    1,
  );
  await prepareCloudflareWeb({ source, output: second, commit });
  const gzip = await readFile(
    path.join(first, "assets/assets/runtime-AbCd1234.wasm.gz"),
  );
  assert.deepEqual(gunzipSync(gzip), wasm);
  assert.deepEqual(
    gzip,
    await readFile(path.join(second, "assets/assets/runtime-AbCd1234.wasm.gz")),
  );
  assert.deepEqual(
    JSON.parse(await readFile(path.join(first, "compressed-assets.json"))),
    { "/assets/runtime-AbCd1234.wasm": "/assets/runtime-AbCd1234.wasm.gz" },
  );
  assert.equal(
    await readFile(path.join(first, "assets/sw.js"), "utf8"),
    "// original precache URLs",
  );
  assert.deepEqual(
    JSON.parse(await readFile(path.join(first, "assets/version.json"))),
    { commit },
  );
  assert.equal(
    (await readFile(path.join(source, "assets/runtime-AbCd1234.wasm"))).length,
    wasm.length,
  );
});

test("preparation rejects unidentified and non-PWA builds before touching staging", async () => {
  await assert.rejects(
    prepareCloudflareWeb({ commit: "local" }),
    /full source commit/,
  );
  const source = path.join(directory, "invalid");
  await seedPwa(source);
  await writeFile(
    path.join(source, "manifest.webmanifest"),
    JSON.stringify({ display: "browser" }),
  );
  await assert.rejects(
    prepareCloudflareWeb({
      source,
      output: path.join(directory, "invalid-output"),
      commit: "b".repeat(40),
    }),
    /ordinary root-scoped PWA/,
  );
});
