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
  LAPIS_DESKTOP_USER_DATA_DIR: userDataDir,
});

let application;
try {
  const executablePath = resolveExecutable();
  application = await electron.launch({ executablePath, env });
  const page = await application.firstWindow();
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
    vault: globalThis.app?.vault.getName(),
    pluginCount: globalThis.app?.plugins.plugins.size,
  }));
  assert.deepEqual(runtime, {
    runtime: "electron-desktop",
    vault: "vault",
    pluginCount: 0,
  });
  console.log(`[electron] packaged smoke passed: ${executablePath}`);
} finally {
  await application?.close().catch(() => {});
  await rm(root, { recursive: true, force: true });
}
