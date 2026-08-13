#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { _electron as electron } from "playwright";

const packageDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseDir = path.join(packageDir, "release");

function resolveExecutable() {
  const configured = process.env.LAPIS_DESKTOP_PACKAGED_EXECUTABLE?.trim();
  if (configured) return path.resolve(configured);

  const candidates =
    process.platform === "darwin"
      ? [
          path.join(releaseDir, `mac-${process.arch}`, "lapis-notes.app", "Contents", "MacOS", "lapis-notes"),
          path.join(releaseDir, "mac", "lapis-notes.app", "Contents", "MacOS", "lapis-notes"),
        ]
      : [
          path.join(releaseDir, "linux-unpacked", "lapis-notes"),
          path.join(releaseDir, `linux-${process.arch}-unpacked`, "lapis-notes"),
        ];
  const executable = candidates.find((candidate) => fs.existsSync(candidate));
  if (!executable) {
    throw new Error(`No unpacked desktop executable found under ${releaseDir}`);
  }
  return executable;
}

const root = await mkdtemp(path.join(os.tmpdir(), "lapis-packaged-smoke-"));
const userDataDir = path.join(root, "user-data");
const vaultPath = path.join(root, "vault");
await Promise.all([mkdir(userDataDir), mkdir(vaultPath)]);

const env = Object.fromEntries(
  Object.entries(process.env).filter((entry) => entry[1] !== undefined),
);
delete env.ELECTRON_RUN_AS_NODE;
Object.assign(env, {
  LAPIS_DESKTOP_DISABLE_DEVTOOLS: "1",
  LAPIS_DESKTOP_TEST_VAULT_PATH: vaultPath,
  LAPIS_DESKTOP_TRACE_CLOSE: "1",
  LAPIS_DESKTOP_USER_DATA_DIR: userDataDir,
});

let application;
let page;
const diagnostics = [];
try {
  const executablePath = resolveExecutable();
  application = await electron.launch({ executablePath, env });
  application.process().stderr?.on("data", (chunk) => {
    diagnostics.push(`[main] ${String(chunk)}`);
  });
  page = await application.firstWindow();
  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.push(`[renderer] ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    diagnostics.push(`[renderer-error] ${error.stack ?? error.message}`);
  });
  const openVault = page.getByRole("button", { name: /^Open Vault/u });
  await openVault.waitFor({ state: "visible", timeout: 60_000 });
  await openVault.click();
  await page.locator('[data-native-runtime="electron-desktop"]').waitFor({
    state: "visible",
    timeout: 60_000,
  });
  await page.locator('[data-ui-component="lapis-workspace-shell"]').waitFor({
    state: "visible",
    timeout: 60_000,
  });
  const runtime = await page.evaluate(() => ({
    runtime: globalThis.__LAPIS_NATIVE_DESKTOP__?.runtime,
    platform: globalThis.__LAPIS_NATIVE_DESKTOP__?.platform,
    vault: globalThis.app?.vault.getName(),
    plugins: [...(globalThis.app?.plugins.plugins.keys() ?? [])].sort(),
    database: globalThis.app?.appDatabase.descriptor,
    protocol: globalThis.location.protocol,
    crossOriginIsolated: globalThis.crossOriginIsolated,
  }));
  assert.equal(runtime.runtime, "electron-desktop");
  assert.equal(runtime.vault, "vault");
  assert.deepEqual(runtime.plugins, [
    "lapis-file-explorer",
    "lapis-markdown-lint",
    "markdown",
    "search",
  ]);
  const usesWasm = runtime.platform?.os === "macos" && runtime.platform.arch === "x64";
  assert.deepEqual(runtime.database, {
    providerId: usesWasm ? "turso-wasm-local" : "electron-turso-native",
    engine: "turso",
    transport: usesWasm ? "wasm-worker" : "native",
    role: "direct",
    storageMode: "local",
    capabilities: {
      nativeFullTextSearch: !usesWasm,
      vectorSearch: true,
      approximateNearestNeighbors: false,
      localEmbeddings: true,
      crossTabCoordination: false,
      sync: false,
    },
  });
  assert.equal(runtime.protocol, "lapis-app:");
  assert.equal(runtime.crossOriginIsolated, true);
  console.log(`[electron] packaged smoke passed: ${executablePath}`);
} catch (error) {
  const body = await page?.locator("body").innerText().catch(() => "");
  if (body) console.error(`[electron] packaged body:\n${body}`);
  if (diagnostics.length) console.error(diagnostics.join("\n"));
  throw error;
} finally {
  if (application) {
    const closed = await Promise.race([
      application.close().then(
        () => true,
        () => true,
      ),
      new Promise((resolve) => setTimeout(() => resolve(false), 10_000)),
    ]);
    if (!closed) application.process().kill("SIGKILL");
  }
  await rm(root, { recursive: true, force: true });
}
