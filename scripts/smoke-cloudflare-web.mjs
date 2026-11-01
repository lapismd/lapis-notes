import assert from "node:assert/strict";
import { appendFile, readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";
import { qualifyPwaAppearance } from "./lib/qualify-pwa-appearance.mjs";

const base = process.argv[2];
if (!base) throw new Error("Usage: pnpm web:cloudflare:smoke <origin>");
const origin = new URL(base).origin;
const deadline = Date.now() + 90_000;
let response;
let version;
for (;;) {
  try {
    response = await fetch(`${origin}/version.json`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    assert.equal(response.status, 200);
    version = await response.json();
    if (process.env.LAPIS_BUILD_COMMIT)
      assert.equal(version.commit, process.env.LAPIS_BUILD_COMMIT);
    break;
  } catch (error) {
    if (Date.now() >= deadline) throw error;
    // A new custom domain and its certificate can propagate after deployment.
    await delay(1000);
  }
}
for (const [header, value] of Object.entries({
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-embedder-policy": "require-corp",
  "cross-origin-resource-policy": "same-origin",
}))
  assert.equal(response.headers.get(header), value);
const manifest = await (await fetch(`${origin}/manifest.webmanifest`)).json();
assert.equal(manifest.id, "/");
assert.deepEqual(manifest.display_override, [
  "window-controls-overlay",
  "standalone",
]);
for (const path of ["/assets/not-a-real-file.wasm", "/missing.js"])
  assert.equal((await fetch(`${origin}${path}`)).status, 404);

const wasmPaths = Object.keys(
  JSON.parse(
    await readFile(
      new URL("../.cloudflare/compressed-assets.json", import.meta.url),
      "utf8",
    ),
  ),
);
assert.match(response.headers.get("cache-control"), /no-store/);
const browser = await chromium.launch();
try {
  // A fresh browser context owns only disposable acceptance storage.
  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page
    .getByRole("heading", { name: "Create a vault" })
    .waitFor({ timeout: 90_000 });
  assert.equal(await page.evaluate(() => crossOriginIsolated), true);
  await page.getByRole("button", { name: /Create New Vault/ }).click();
  const dialog = page.getByRole("dialog", { name: "New Browser Vault" });
  await dialog.getByLabel("Name").fill("Cloudflare acceptance");
  await dialog
    .getByRole("button", { name: "Create vault", exact: true })
    .click();
  await page
    .locator('[data-app-shell-ready="true"]')
    .waitFor({ timeout: 120_000 });
  await page.waitForFunction(
    async () => !!(await navigator.serviceWorker.getRegistration())?.active,
    undefined,
    { timeout: 120_000 },
  );
  await page.waitForFunction(
    () => navigator.serviceWorker.controller !== null,
    undefined,
    { timeout: 120_000 },
  );
  await page.reload();
  await page
    .locator('[data-app-shell-ready="true"]')
    .waitFor({ timeout: 90_000 });
  await qualifyPwaAppearance(page);
  const plugin = await page.evaluate(async () => {
    const app = globalThis.app;
    await app.pluginDistribution.refreshCatalog({ force: true });
    const record = await app.pluginDistribution.install("wordcount", {
      enable: true,
    });
    await app.vault.create(
      "Cloudflare search.md",
      "# Cloudflare search\nArtifact acceptance searchable phrase.\n",
    );
    return {
      checksum: record.releaseManifestSha256,
      provenance: record.provenance,
      enabled: app.plugins.isPluginEnabled("wordcount"),
    };
  });
  assert.match(plugin.checksum, /^[a-f0-9]{64}$/);
  assert.ok(plugin.provenance);
  assert.equal(plugin.enabled, true);
  await page.getByRole("tab", { name: "Search", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search vault" })
    .fill("Artifact acceptance searchable phrase");
  await page
    .getByRole("treeitem", { name: /Cloudflare search\.md, 1 matches/ })
    .waitFor({ timeout: 90_000 });
  await context.setOffline(true);
  await page.reload();
  await page
    .locator('[data-app-shell-ready="true"]')
    .waitFor({ timeout: 90_000 });
  assert.equal(
    await page.evaluate(() =>
      globalThis.app.plugins.isPluginEnabled("wordcount"),
    ),
    true,
  );
  assert.ok(
    await page.evaluate(async () =>
      (await (await caches.open("lapis-plugin-assets-v1")).keys()).some(
        (request) => request.url.includes("/wordcount/"),
      ),
    ),
  );
  for (const wasm of wasmPaths) {
    await page.evaluate(async (url) => {
      await WebAssembly.compileStreaming(fetch(url));
    }, wasm);
  }
  if (process.env.LAPIS_PWA_UPDATE_TEST_SW) {
    await context.setOffline(false);
    const marker = await page.evaluate(() => {
      globalThis.__lapisSmokeMarker = crypto.randomUUID();
      return globalThis.__lapisSmokeMarker;
    });
    await appendFile(
      process.env.LAPIS_PWA_UPDATE_TEST_SW,
      "\n// Acceptance: second deployment.\n",
    );
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration()).update();
    });
    const update = page.getByRole("heading", { name: "New update available" });
    await update.waitFor({ timeout: 90_000 });
    await page.getByRole("button", { name: "Later", exact: true }).click();
    assert.equal(
      await page.evaluate(() => globalThis.__lapisSmokeMarker),
      marker,
    );
    await page.evaluate(async () => {
      const app = globalThis.app;
      globalThis.__lapisSmokeSettle = app.fileEditingSessions.settleOperations;
      app.fileEditingSessions.settleOperations = async () => {
        globalThis.__lapisSmokeRefused = true;
        throw new Error("Acceptance save refusal");
      };
      await app.commands.executeCommand("app:web-show-update");
    });
    await page
      .getByRole("button", { name: "Install Now", exact: true })
      .click();
    await page.waitForFunction(() => globalThis.__lapisSmokeRefused === true);
    await update.waitFor();
    assert.equal(
      await page.evaluate(() => globalThis.__lapisSmokeMarker),
      marker,
    );
    await page.evaluate(async () => {
      const app = globalThis.app;
      app.fileEditingSessions.settleOperations = globalThis.__lapisSmokeSettle;
      const file = await app.vault.create(
        "Cloudflare update.md",
        "# Cloudflare update\n",
      );
      await app.openFile(file);
    });
    const editor = page.locator(".cm-content[contenteditable='true']").first();
    await editor.waitFor();
    await editor.click();
    await page.keyboard.press("ControlOrMeta+End");
    await page.keyboard.type("Persisted across the update.");
    await Promise.all([
      page.waitForEvent("framenavigated", {
        predicate: (frame) => frame === page.mainFrame(),
      }),
      page.getByRole("button", { name: "Install Now", exact: true }).click(),
    ]);
    await page
      .locator('[data-app-shell-ready="true"]')
      .waitFor({ timeout: 90_000 });
    const saved = await page.evaluate(async () => {
      const file = globalThis.app.vault.getFileByPath("Cloudflare update.md");
      return globalThis.app.vault.read(file);
    });
    assert.match(saved, /Persisted across the update\./);
  }
  assert.deepEqual(
    errors,
    [],
    `Renderer startup failures: ${errors.join("; ")}`,
  );
  await context.close();
} finally {
  await browser.close();
}
console.log(
  JSON.stringify({
    origin,
    commit: version.commit,
    isolation: true,
    browserVault: true,
    search: true,
    verifiedPluginOffline: true,
    offlineReopen: true,
    appearance: true,
    oversizedWasm: wasmPaths.length,
    promptUpdate: !!process.env.LAPIS_PWA_UPDATE_TEST_SW,
  }),
);
