import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  ASSET_LIMIT,
  prepareCloudflareWeb,
} from "./prepare-cloudflare-web.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const leb = (value) => {
  const bytes = [];
  do {
    const next = value & 127;
    value >>>= 7;
    bytes.push(next | (value ? 128 : 0));
  } while (value);
  return Buffer.from(bytes);
};

test(
  "Wrangler serves oversized WASM, conditional/HEAD requests, SPA navigation and asset errors",
  { timeout: 90_000 },
  async () => {
    const directory = await mkdtemp(
      path.join(os.tmpdir(), "lapis-pwa-worker-"),
    );
    let child;
    let log = "";
    try {
      const source = path.join(directory, "source");
      await mkdir(path.join(source, "assets"), { recursive: true });
      await writeFile(
        path.join(source, "index.html"),
        "<!doctype html><title>Lapis</title>",
      );
      await writeFile(
        path.join(source, "manifest.webmanifest"),
        JSON.stringify({ id: "/", display: "standalone" }),
      );
      await writeFile(path.join(source, "sw.js"), "// PWA");
      await writeFile(path.join(source, "workbox-a1b2c3d4.js"), "export {};");
      await writeFile(
        path.join(source, "_headers"),
        await readFile(path.join(root, "packages/web/public/_headers")),
      );
      await mkdir(path.join(source, "assets/lapis-plugin-host"));
      await writeFile(
        path.join(source, "assets/lapis-plugin-host/api.js"),
        "export {};",
      );
      const wasm = Buffer.concat([
        Buffer.from([0, 97, 115, 109, 1, 0, 0, 0, 0]),
        leb(ASSET_LIMIT),
        Buffer.alloc(ASSET_LIMIT),
      ]);
      await writeFile(path.join(source, "assets/runtime-AbCd1234.wasm"), wasm);
      const output = path.join(directory, "output");
      await prepareCloudflareWeb({ source, output, commit: "c".repeat(40) });
      const mappings = JSON.parse(
        await readFile(path.join(output, "compressed-assets.json"), "utf8"),
      );
      const worker = `import { createAssetWorker } from ${JSON.stringify(path.join(root, "packages/web/cloudflare/asset-worker.ts"))};\nexport default createAssetWorker(${JSON.stringify(mappings)});`;
      await writeFile(path.join(output, "fixture.ts"), worker);
      const config = JSON.parse(
        await readFile(path.join(output, "wrangler.json"), "utf8"),
      );
      Object.assign(config, {
        main: "fixture.ts",
        routes: [],
        workers_dev: false,
        compatibility_date: "2026-10-23",
      });
      await writeFile(
        path.join(output, "wrangler.json"),
        JSON.stringify(config),
      );
      const reservation = createServer();
      reservation.listen(0, "127.0.0.1");
      await once(reservation, "listening");
      const port = reservation.address().port;
      await new Promise((resolve) => reservation.close(resolve));
      child = spawn(
        process.execPath,
        [
          path.join(root, "node_modules/wrangler/bin/wrangler.js"),
          "dev",
          "--config",
          path.join(output, "wrangler.json"),
          "--port",
          String(port),
          "--ip",
          "127.0.0.1",
          "--local",
        ],
        {
          env: { ...process.env, CI: "true", WRANGLER_SEND_METRICS: "false" },
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      child.stdout.on("data", (bytes) => {
        log += bytes;
      });
      child.stderr.on("data", (bytes) => {
        log += bytes;
      });
      const base = `http://127.0.0.1:${port}`;
      let ready = false;
      for (let i = 0; i < 200; i++) {
        if (child.exitCode !== null) throw new Error(log);
        try {
          ready = (await fetch(`${base}/version.json`)).ok;
        } catch {
          /* Start-up. */
        }
        if (ready) break;
        await delay(100);
      }
      assert.ok(ready, log);
      const url = `${base}/assets/runtime-AbCd1234.wasm`;
      const response = await fetch(url);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "application/wasm");
      assert.equal(
        response.headers.get("cross-origin-embedder-policy"),
        "require-corp",
      );
      await WebAssembly.compileStreaming(response.clone());
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), wasm);
      const etag = response.headers.get("etag");
      assert.ok(etag);
      assert.equal(
        (await fetch(url, { headers: { "If-None-Match": etag } })).status,
        304,
      );
      const head = await fetch(url, { method: "HEAD" });
      assert.equal(head.status, 200);
      assert.equal((await head.arrayBuffer()).byteLength, 0);
      const range = await fetch(url, { headers: { Range: "bytes=0-7" } });
      assert.equal(range.status, 200);
      assert.equal((await range.arrayBuffer()).byteLength, wasm.length);
      assert.equal((await fetch(url, { method: "POST" })).status, 405);
      for (const stable of [
        "/",
        "/sw.js",
        "/manifest.webmanifest",
        "/assets/lapis-plugin-host/api.js",
      ]) {
        const result = await fetch(`${base}${stable}`);
        assert.equal(result.status, 200, stable);
        assert.match(
          result.headers.get("cache-control"),
          /must-revalidate/,
          stable,
        );
      }
      assert.match(
        (await fetch(`${base}/version.json`)).headers.get("cache-control"),
        /no-store/,
      );
      assert.match(
        (await fetch(`${base}/workbox-a1b2c3d4.js`)).headers.get(
          "cache-control",
        ),
        /max-age=31536000.*immutable/,
      );
      for (const missing of ["/assets/missing.wasm", "/missing.js"]) {
        const result = await fetch(`${base}${missing}`, {
          headers: { "Sec-Fetch-Mode": "navigate", Accept: "text/html" },
        });
        assert.equal(result.status, 404, missing);
      }
      const deep = await fetch(`${base}/open?url=web%2Blapis%3A%2F%2Ftest`, {
        headers: { "Sec-Fetch-Mode": "navigate", Accept: "text/html" },
      });
      assert.equal(deep.status, 200);
      assert.match(await deep.text(), /<title>Lapis/);
    } finally {
      if (child && child.exitCode === null) {
        child.kill("SIGTERM");
        await once(child, "exit");
      }
      await rm(directory, { recursive: true, force: true });
    }
  },
);
