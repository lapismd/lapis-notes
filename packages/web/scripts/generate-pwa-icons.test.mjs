import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const webDir = fileURLToPath(new URL("../", import.meta.url));
const expectedHashes = JSON.parse(
  await readFile(path.join(webDir, "assets/pwa-icon-sha256.json"), "utf8"),
);
const outputs = Object.keys(expectedHashes);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("PWA icons regenerate unchanged without the frozen desktop host", async () => {
  // Inside Web so the copied script resolves this package's installed sharp.
  const root = await mkdtemp(path.join(webDir, ".pwa-icons-test-"));
  const isolatedWeb = path.join(root, "packages/web");
  try {
    for (const directory of [
      "packages/web/scripts",
      "packages/web/assets",
      "packages/api/src/lib/assets",
    ])
      await mkdir(path.join(root, directory), { recursive: true });
    await copyFile(
      path.join(webDir, "scripts/generate-pwa-icons.mjs"),
      path.join(isolatedWeb, "scripts/generate-pwa-icons.mjs"),
    );
    await copyFile(
      path.join(webDir, "assets/app-icon.png"),
      path.join(isolatedWeb, "assets/app-icon.png"),
    );
    await copyFile(
      path.resolve(webDir, "../api/src/lib/assets/lapis-logo.svg"),
      path.join(root, "packages/api/src/lib/assets/lapis-logo.svg"),
    );
    execFileSync(
      process.execPath,
      [path.join(isolatedWeb, "scripts/generate-pwa-icons.mjs")],
      { cwd: isolatedWeb, stdio: "pipe" },
    );
    const publicDir = path.join(isolatedWeb, "public");
    assert.deepEqual((await readdir(publicDir)).sort(), [...outputs].sort());
    for (const output of outputs) {
      const committed = await readFile(path.join(webDir, "public", output));
      assert.equal(
        hash(committed),
        expectedHashes[output],
        `${output} public bytes changed`,
      );
      const actual = await readFile(path.join(publicDir, output));
      assert.equal(
        hash(actual),
        expectedHashes[output],
        `${output} bytes changed`,
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
