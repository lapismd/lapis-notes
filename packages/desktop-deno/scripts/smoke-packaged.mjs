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
  "lapis-file-explorer",
  "lapis-source-editor",
  "markdown",
  "search",
];
const coreAcceptance = process.argv.includes("--core");
const launchServicesIndex = process.argv.indexOf("--launch-services");
const launchServicesBundle =
  launchServicesIndex === -1
    ? undefined
    : process.argv[launchServicesIndex + 1];
if (
  launchServicesIndex !== -1 &&
  (!launchServicesBundle || process.platform !== "darwin")
) {
  throw new Error("--launch-services requires a macOS application bundle path");
}

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
const pluginDirectory = path.join(vaultPath, ".lapis", "plugins", pluginId);
await mkdir(pluginDirectory, { recursive: true });
await writeFile(path.join(pluginDirectory, "main.mjs"), pluginSource);
await writeFile(
  path.join(vaultPath, ".lapis", "installed-plugins.json"),
  `${JSON.stringify({
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    plugins: {
      [pluginId]: {
        pluginId,
        installedVersion: "1.0.0",
        installedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        provenance: "development",
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
  const appUrl = "lapis://plugins?id=spellcheck&version=0.1.1";
  const environment = {
    ...process.env,
    LAPIS_DENO_ACCEPTANCE: "1",
    LAPIS_DENO_ACCEPTANCE_REPORT: reportPath,
    LAPIS_DENO_USER_DATA: userDataDir,
    LAPIS_DENO_VAULT: vaultPath,
    LAPIS_DENO_VAULT_AUTO: "1",
    LAPIS_DENO_ACCEPTANCE_MODE: coreAcceptance ? "core" : "full",
    ...(coreAcceptance
      ? {
          PATH: "/usr/bin:/bin:/usr/sbin:/sbin",
          LAPIS_AI_CONTROLLER_BIN: "/nonexistent/lapis-ai-controller",
        }
      : {}),
  };
  const nativeLog = path.join(root, "native.log");
  const launchArguments = launchServicesBundle
    ? [
        "-W",
        "-n",
        "-a",
        path.resolve(launchServicesBundle),
        "--stdout",
        nativeLog,
        "--stderr",
        nativeLog,
        ...Object.entries(environment)
          .filter(([key]) => key.startsWith("LAPIS_") || key === "PATH")
          .flatMap(([key, value]) => ["--env", `${key}=${value}`]),
      ]
    : [];
  child = spawn(
    launchServicesBundle ? "/usr/bin/open" : executable,
    launchArguments,
    {
      cwd: root,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout.on("data", (chunk) => diagnostics.push(String(chunk)));
  child.stderr.on("data", (chunk) => diagnostics.push(String(chunk)));

  await waitForInstanceEndpoint(
    path.join(userDataDir, "desktop-instance.json"),
    child,
    diagnostics,
  );
  const secondaryDiagnostics = [];
  // Preserve the source-owned argv handoff. Deno 2.9.7 does not yet emit
  // macOS open-URL Apple Events into JavaScript (denoland/deno#35465).
  secondary = spawn(executable, [appUrl], {
    cwd: root,
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
  assert.equal(report.ok, true, JSON.stringify(report, null, 2));
  assert.equal(report.runtime, "deno-desktop");
  assert.equal(report.appVersion, packageMetadata.version);
  assert.equal(report.vault, "vault");
  assert.deepEqual(report.plugins, expectedPlugins);
  assert.equal(report.database?.providerId, "turso-native-desktop");
  assert.equal(report.database?.engine, "turso");
  assert.equal(report.database?.transport, "native");
  assert.equal(report.capabilities?.resource?.status, "available");
  assert.equal(report.capabilities?.["language-service"]?.status, "available");
  assert.equal(report.capabilities?.["file-watch"]?.status, "available");
  assert.equal(report.capabilities?.["plugin-assets"]?.status, "available");
  assert.equal(report.capabilities?.["agent-runtime"]?.status, "available");
  assert.ok(report.languageDiagnosticCount > 0);
  assert.ok(["create", "modify"].includes(report.fileWatchEventType));
  assert.equal(report.pluginAssetText, pluginSource);
  assert.match(report.pluginAssetContentType, /^text\/javascript/u);
  assert.equal(report.acceptanceMode, coreAcceptance ? "core" : "full");
  assert.equal(
    report.controllerProtocol,
    coreAcceptance ? "" : "lapis-ai-controller/1",
  );
  assert.equal(report.appToolRegistered, !coreAcceptance);
  assert.equal(report.terminalOutputSeen, true);
  assert.equal(report.appUrl, appUrl);
  assert.deepEqual(report.pluginNavigation, [
    { page: "plugin", pluginId: "spellcheck", version: "0.1.1" },
  ]);
  assert.equal(report.laterLaunchFocusCount, 1);
  assert.equal(report.crossOriginIsolated, true);
  assert.equal(report.protocol, "http:");
  await waitForCleanExit(child, diagnostics);
  if (launchServicesBundle) diagnostics.push(await readFile(nativeLog, "utf8"));
  assert.match(
    diagnostics.join(""),
    /\[desktop-close\] renderer-ready/u,
    "Packaged close exited without renderer teardown acknowledgement",
  );
  assertApplicationSignature(executable);
  if (process.env.LAPIS_DENO_SMOKE_REPORT) {
    await writeFile(
      process.env.LAPIS_DENO_SMOKE_REPORT,
      `${JSON.stringify({ ...report, shutdown: "clean", executable })}\n`,
    );
  }
  console.log(`[deno] packaged smoke passed: ${executable}`);
} catch (error) {
  if (launchServicesBundle) {
    diagnostics.push(
      await readFile(path.join(root, "native.log"), "utf8").catch(() => ""),
    );
  }
  if (diagnostics.length) console.error(diagnostics.join(""));
  throw error;
} finally {
  if (launchServicesBundle) {
    const endpoint = await readFile(
      path.join(userDataDir, "desktop-instance.json"),
      "utf8",
    )
      .then(JSON.parse)
      .catch(() => undefined);
    if (Number.isSafeInteger(endpoint?.pid) && endpoint.pid > 1) {
      const expectedExecutable = path.join(
        path.resolve(launchServicesBundle),
        "Contents/MacOS/laufey_webview",
      );
      const actualExecutable = execFileSync(
        "/bin/ps",
        ["-p", String(endpoint.pid), "-o", "comm="],
        { encoding: "utf8" },
      ).trim();
      if (actualExecutable === expectedExecutable)
        process.kill(endpoint.pid, "SIGTERM");
    }
  }
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
