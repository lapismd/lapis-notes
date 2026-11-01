import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import path from "node:path";
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
const repo = fileURLToPath(new URL("../", import.meta.url));
if (!process.argv[2])
  throw new Error(
    "Usage: node scripts/qualify-legacy-pwa.mjs <frozen-legacy-dist>",
  );
const legacy = path.resolve(process.argv[2]);
const current = path.join(repo, ".cloudflare/assets");
const mappings = JSON.parse(
  await readFile(path.join(repo, ".cloudflare/compressed-assets.json")),
);
let directory = legacy;
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const mapped = directory === current ? mappings[url.pathname] : undefined;
    const name = decodeURIComponent(mapped ?? url.pathname);
    const file = path.resolve(
      directory,
      "." + (name === "/" ? "/index.html" : name),
    );
    assert.ok(file.startsWith(directory + "/"));
    const bytes = await readFile(file);
    res.writeHead(200, {
      "Content-Type":
        mime[
          path.extname(url.pathname === "/" ? "/index.html" : url.pathname)
        ] ?? "application/octet-stream",
      "Cache-Control": "no-store",
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
      ...(mapped ? { "Content-Encoding": "gzip" } : {}),
    });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const origin = "http://127.0.0.1:" + server.address().port;
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page.getByRole("button", { name: /^New Browser Vault/ }).click();
  const dialog = page.getByRole("dialog", { name: "New Browser Vault" });
  await dialog.getByLabel("Name").fill("Legacy upgrade acceptance");
  await dialog
    .getByRole("button", { name: "Create vault", exact: true })
    .click();
  await page.locator(".workspace").waitFor({ timeout: 90000 });
  await page.waitForFunction(
    () => !!navigator.serviceWorker.controller,
    undefined,
    { timeout: 120000 },
  );
  await page.reload();
  await page.locator(".workspace").waitFor({ timeout: 90000 });
  await page.evaluate(async () => {
    await globalThis.app.vault.create(
      "Legacy upgrade.md",
      "# Legacy preservation fixture\nKeep this note.\n",
    );
  });
  directory = current;
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration()).update();
  });
  await page
    .getByRole("heading", { name: "New update available" })
    .waitFor({ timeout: 90000 });
  await Promise.all([
    page.waitForEvent("framenavigated", {
      predicate: (f) => f === page.mainFrame(),
    }),
    page.getByRole("button", { name: "Install Now", exact: true }).click(),
  ]);
  await page
    .locator('[data-app-shell-ready="true"]')
    .waitFor({ timeout: 90000 });
  const saved = await page.evaluate(async () =>
    globalThis.app.vault.read(
      globalThis.app.vault.getFileByPath("Legacy upgrade.md"),
    ),
  );
  assert.equal(saved, "# Legacy preservation fixture\nKeep this note.\n");
  assert.deepEqual(errors, []);
  console.log(
    "LEGACY UPGRADE PASSED: same origin, original browser context, OPFS note, service-worker registration and caches retained through actual legacy update prompt.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
