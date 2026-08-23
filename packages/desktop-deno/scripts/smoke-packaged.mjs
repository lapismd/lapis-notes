#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const packageMetadata = JSON.parse(
  await readFile(path.join(packageDir, "package.json"), "utf8"),
);
const expectedPlugins = [
  "ai",
  "bases",
  "bookmarks",
  "history",
  "lapis-file-explorer",
  "lapis-markdown-lint",
  "markdown",
  "roles",
  "search",
  "spellcheck",
  "terminal",
  "wordcount",
];

function resolveExecutable() {
  const configured = process.env.LAPIS_DENO_PACKAGED_EXECUTABLE?.trim();
  if (configured) return path.resolve(configured);
  const architecture = process.arch === "arm64" ? "arm64" : "x64";
  const baseName = `Lapis-Notes-${packageMetadata.version}`;
  const candidates =
    process.platform === "darwin"
      ? [
          path.join(
            packageDir,
            "release",
            `${baseName}-macos-${architecture}.app`,
            "Contents",
            "MacOS",
            "laufey_webview",
          ),
          path.join(
            packageDir,
            "LapisNotes.app",
            "Contents",
            "MacOS",
            "laufey_webview",
          ),
        ]
      : [
          path.join(
            packageDir,
            "release",
            `${baseName}-linux-${architecture}.AppImage`,
          ),
          path.join(packageDir, "LapisNotes"),
        ];
  const executable = candidates.find((candidate) => fs.existsSync(candidate));
  if (!executable) {
    throw new Error(
      "No packaged Deno desktop executable found; run pnpm package:app first",
    );
  }
  return executable;
}

function assertApplicationUrlMetadata(executable) {
  if (process.platform !== "darwin") return;
  const plist = path.resolve(path.dirname(executable), "..", "Info.plist");
  const urlTypes = JSON.parse(
    execFileSync(
      "plutil",
      ["-extract", "CFBundleURLTypes", "json", "-o", "-", plist],
      { encoding: "utf8" },
    ),
  );
  assert.deepEqual(urlTypes, [
    {
      CFBundleURLName: "Lapis Notes",
      CFBundleURLSchemes: ["lapis", "lapis-notes"],
    },
  ]);
}

function assertApplicationSignature(executable) {
  if (process.platform !== "darwin") return;
  const appBundle = path.resolve(path.dirname(executable), "..", "..");
  execFileSync("codesign", ["--verify", "--deep", "--strict", appBundle], {
    stdio: "pipe",
  });
}

async function waitForReport(reportPath, child, diagnostics) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    if (fs.existsSync(reportPath)) {
      return JSON.parse(await readFile(reportPath, "utf8"));
    }
    if (child.exitCode !== null) {
      throw new Error(
        `Deno desktop exited before readiness (${child.exitCode})\n${diagnostics.join("")}`,
      );
    }
    const diagnosticText = diagnostics.join("");
    if (diagnosticText.includes("[desktop] Deno runtime error:")) {
      throw new Error(`Deno desktop runtime failed\n${diagnosticText}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(
    `Timed out waiting for packaged Deno workspace readiness\n${diagnostics.join("")}`,
  );
}

async function waitForCleanExit(child, diagnostics) {
  if (child.exitCode === null) {
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(
                `Timed out waiting for renderer-coordinated close\n${diagnostics.join("")}`,
              ),
            ),
          30_000,
        ),
      ),
    ]);
  }
  assert.equal(
    child.signalCode,
    null,
    `Deno desktop was terminated by ${child.signalCode}\n${diagnostics.join("")}`,
  );
  assert.equal(
    child.exitCode,
    0,
    `Deno desktop close failed\n${diagnostics.join("")}`,
  );
}

async function waitForInstanceEndpoint(endpointPath, child, diagnostics) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (fs.existsSync(endpointPath)) return;
    if (child.exitCode !== null) {
      throw new Error(
        `Deno desktop exited before publishing its instance endpoint\n${diagnostics.join("")}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(
    `Timed out waiting for Deno instance endpoint\n${diagnostics.join("")}`,
  );
}

const root = await mkdtemp(path.join(os.tmpdir(), "lapis-deno-smoke-"));
const userDataDir = path.join(root, "user-data");
const vaultPath = path.join(root, "vault");
const reportPath = path.join(root, "acceptance.json");
await Promise.all([mkdir(userDataDir), mkdir(vaultPath)]);
await writeFile(path.join(vaultPath, "Welcome.md"), "# Packaged Deno smoke\n");
const pluginId = "deno-smoke-extension";
const pluginSource = 'export default "deno plugin asset";\n';
const pluginSha256 = createHash("sha256").update(pluginSource).digest("hex");
const pluginDirectory = path.join(vaultPath, ".obsidian", "plugins", pluginId);
await mkdir(pluginDirectory, { recursive: true });
await writeFile(path.join(pluginDirectory, "main.mjs"), pluginSource);
await writeFile(
  path.join(vaultPath, ".obsidian", "installed-plugins.json"),
  `${JSON.stringify({
    plugins: {
      [pluginId]: {
        pluginId,
        installedVersion: "1.0.0",
        files: [
          {
            path: "main.mjs",
            size: Buffer.byteLength(pluginSource),
            sha256: pluginSha256,
          },
        ],
      },
    },
  })}\n`,
);

const profileId = `desktop-folder:${vaultPath}`;
await writeFile(
  path.join(userDataDir, "vault-bootstrap.json"),
  `${JSON.stringify({
    "profile:current": profileId,
    [`profile:${profileId}`]: {
      id: profileId,
      name: "vault",
      kind: "desktop-folder",
      handle: { rootPath: vaultPath },
      createdAt: 1,
      updatedAt: 1,
    },
  })}\n`,
);

const diagnostics = [];
let child;
let secondary;
try {
  const executable = resolveExecutable();
  assertApplicationUrlMetadata(executable);
  const appUrl = "lapis://open?vault=packaged-smoke";
  const environment = {
    ...process.env,
    LAPIS_DENO_ACCEPTANCE: "1",
    LAPIS_DENO_ACCEPTANCE_REPORT: reportPath,
    LAPIS_DENO_USER_DATA: userDataDir,
    LAPIS_DENO_VAULT: vaultPath,
    LAPIS_DENO_VAULT_AUTO: "1",
  };
  child = spawn(executable, [], {
    cwd: packageDir,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => diagnostics.push(String(chunk)));
  child.stderr.on("data", (chunk) => diagnostics.push(String(chunk)));

  await waitForInstanceEndpoint(
    path.join(userDataDir, "desktop-instance.json"),
    child,
    diagnostics,
  );
  const secondaryDiagnostics = [];
  secondary = spawn(executable, [appUrl], {
    cwd: packageDir,
    env: environment,
    stdio: ["ignore", "pipe", "pipe"],
  });
  secondary.stdout.on("data", (chunk) =>
    secondaryDiagnostics.push(String(chunk)),
  );
  secondary.stderr.on("data", (chunk) =>
    secondaryDiagnostics.push(String(chunk)),
  );
  await waitForCleanExit(secondary, secondaryDiagnostics);

  const report = await waitForReport(reportPath, child, diagnostics);
  assert.equal(report.ok, true, report.detail);
  assert.equal(report.runtime, "deno-desktop");
  assert.equal(report.vault, "vault");
  assert.deepEqual(report.plugins, expectedPlugins);
  assert.equal(report.database?.providerId, "turso-wasm-local");
  assert.equal(report.database?.engine, "turso");
  assert.equal(report.database?.transport, "wasm-worker");
  assert.equal(report.capabilities?.resource?.status, "available");
  assert.equal(report.capabilities?.["language-service"]?.status, "available");
  assert.equal(report.capabilities?.["file-watch"]?.status, "available");
  assert.equal(report.capabilities?.["plugin-assets"]?.status, "available");
  assert.equal(report.capabilities?.["agent-runtime"]?.status, "available");
  assert.ok(report.languageDiagnosticCount > 0);
  assert.ok(["create", "modify"].includes(report.fileWatchEventType));
  assert.equal(report.pluginAssetText, pluginSource);
  assert.match(report.pluginAssetContentType, /^text\/javascript/u);
  assert.equal(report.agentProcessOutput, "deno-agent-process");
  assert.equal(report.appToolBridgeOpened, true);
  assert.equal(report.appUrl, appUrl);
  assert.equal(report.laterLaunchFocusCount, 1);
  assert.equal(report.crossOriginIsolated, true);
  assert.equal(report.protocol, "http:");
  await waitForCleanExit(child, diagnostics);
  assert.match(
    diagnostics.join(""),
    /\[desktop\] invoke desktop_renderer_close_ready/u,
    "Packaged close exited without renderer teardown acknowledgement",
  );
  assertApplicationSignature(executable);
  console.log(`[deno] packaged smoke passed: ${executable}`);
} catch (error) {
  if (diagnostics.length) console.error(diagnostics.join(""));
  throw error;
} finally {
  if (secondary && secondary.exitCode === null) secondary.kill("SIGTERM");
  if (child && child.exitCode === null) {
    child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolve) => child.once("exit", resolve)),
      new Promise((resolve) => setTimeout(resolve, 10_000)),
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
  await rm(root, { recursive: true, force: true });
}
