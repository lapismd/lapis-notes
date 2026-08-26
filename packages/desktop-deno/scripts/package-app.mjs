#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import {
  createDistributionPlan,
  createLinuxDesktopEntry,
  createLinuxLauncher,
  createLinuxSigningArguments,
  createMacSigningArguments,
  readRequestedTarget,
} from "./distribution.mjs";

const execFileAsync = promisify(execFile);
const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const releaseDir = path.join(packageDir, "release");
const packageMetadata = JSON.parse(
  await readFile(path.join(packageDir, "package.json"), "utf8"),
);
const terminalHostDir = path.resolve(packageDir, "../../../terminal-host");
const terminalArtifacts = JSON.parse(
  await readFile(path.join(terminalHostDir, "native-artifacts.json"), "utf8"),
);

function resolveDenoExecutable() {
  const configured = process.env.DENO_BIN?.trim();
  if (configured) return configured;
  const userInstall = path.join(os.homedir(), ".deno", "bin", "deno");
  return fs.existsSync(userInstall) ? userInstall : "deno";
}

async function run(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: packageDir,
      env: process.env,
      stdio: "inherit",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed (${signal ?? code})`));
    });
  });
}

async function buildDesktopOutput(plan, output) {
  await rm(output, { force: true, recursive: true });
  await run(resolveDenoExecutable(), [
    "desktop",
    "--output",
    output,
    "--target",
    plan.target,
    "--icon",
    plan.icon,
    "--no-check",
    "--sloppy-imports",
    "--include",
    "native",
    "--include",
    "build/icon-light.png",
    "--include",
    "build/icon-dark.png",
    "--exclude",
    "node_modules",
    "--exclude",
    "dist",
    "--exclude",
    "src",
    "-A",
    "src-deno/main.ts",
  ]);
}

async function prepareNativeLibrary(plan) {
  const artifact = terminalArtifacts.targets[plan.target];
  if (!artifact) {
    throw new Error(`Missing terminal native artifact for ${plan.target}`);
  }
  const nativeDir = path.join(packageDir, "native");
  await rm(nativeDir, { force: true, recursive: true });
  await mkdir(nativeDir, { recursive: true });
  const response = await fetch(`${terminalArtifacts.baseUrl}/${artifact.file}`);
  if (!response.ok) {
    throw new Error(`Unable to download terminal native library: HTTP ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== artifact.sha256) {
    throw new Error(
      `Terminal native library checksum mismatch: expected ${artifact.sha256}, received ${actual}`,
    );
  }
  await writeFile(path.join(nativeDir, artifact.file), bytes, { mode: 0o755 });
}

async function declareMacApplicationMetadata(appBundle) {
  const plist = path.join(appBundle, "Contents", "Info.plist");
  const urlTypes = JSON.stringify([
    {
      CFBundleURLName: "Lapis Notes",
      CFBundleURLSchemes: ["lapis", "lapis-notes"],
    },
  ]);
  for (const [key, value] of [
    ["CFBundleIdentifier", "notes.lapis.desktop"],
    ["CFBundleName", "Lapis Notes"],
  ]) {
    try {
      await execFileAsync("plutil", ["-replace", key, "-string", value, plist]);
    } catch {
      await execFileAsync("plutil", ["-insert", key, "-string", value, plist]);
    }
  }
  try {
    await execFileAsync("plutil", [
      "-replace",
      "CFBundleURLTypes",
      "-json",
      urlTypes,
      plist,
    ]);
  } catch {
    await execFileAsync("plutil", [
      "-insert",
      "CFBundleURLTypes",
      "-json",
      urlTypes,
      plist,
    ]);
  }
}

async function signMacApplication(appBundle) {
  const identity = process.env.LAPIS_DENO_MAC_SIGN_IDENTITY?.trim() || "-";
  const entitlements = path.resolve(packageDir, "build/entitlements.mac.plist");
  await run(
    "codesign",
    createMacSigningArguments({ appBundle, identity, entitlements }),
  );
  if (identity === "-") {
    console.log("Created an ad-hoc-signed macOS application.");
  } else {
    console.log("Created a Developer ID-signed macOS application.");
  }
}

async function notarizeMacApplication(appBundle) {
  const profile = process.env.LAPIS_DENO_NOTARY_PROFILE?.trim();
  if (!profile) {
    console.log(
      "Skipping notarization because LAPIS_DENO_NOTARY_PROFILE is not configured.",
    );
    return;
  }
  if (!process.env.LAPIS_DENO_MAC_SIGN_IDENTITY?.trim()) {
    throw new Error(
      "LAPIS_DENO_NOTARY_PROFILE requires LAPIS_DENO_MAC_SIGN_IDENTITY",
    );
  }
  const temporaryDir = await mkdtemp(
    path.join(os.tmpdir(), "lapis-deno-notarize-"),
  );
  const upload = path.join(temporaryDir, "Lapis-Notes.zip");
  try {
    await run("ditto", [
      "-c",
      "-k",
      "--sequesterRsrc",
      "--keepParent",
      appBundle,
      upload,
    ]);
    const arguments_ = [
      "notarytool",
      "submit",
      upload,
      "--keychain-profile",
      profile,
      "--wait",
    ];
    const keychain = process.env.LAPIS_DENO_NOTARY_KEYCHAIN?.trim();
    if (keychain) arguments_.push("--keychain", keychain);
    await run("xcrun", arguments_);
    await run("xcrun", ["stapler", "staple", appBundle]);
  } finally {
    await rm(temporaryDir, { force: true, recursive: true });
  }
}

async function packageMac(plan) {
  await buildDesktopOutput(plan, plan.appBundle);
  await declareMacApplicationMetadata(plan.appBundle);
  await writeFile(
    path.join(
      plan.appBundle,
      "Contents",
      "MacOS",
      "libruntime.dylib.update-ok",
    ),
    "ok",
    { mode: 0o644 },
  );
  await signMacApplication(plan.appBundle);
  await notarizeMacApplication(plan.appBundle);
  await rm(plan.archive, { force: true });
  await run("ditto", [
    "-c",
    "-k",
    "--sequesterRsrc",
    "--keepParent",
    plan.appBundle,
    plan.archive,
  ]);
}

async function signLinuxArtifacts(artifacts) {
  await Promise.all(
    artifacts.map((artifact) => rm(`${artifact}.asc`, { force: true })),
  );
  const keyId = process.env.LAPIS_DENO_GPG_KEY_ID?.trim();
  if (!keyId) {
    console.log(
      "Skipping Linux signatures because LAPIS_DENO_GPG_KEY_ID is not configured.",
    );
    return;
  }
  for (const artifact of artifacts) {
    await run("gpg", createLinuxSigningArguments({ artifact, keyId }));
  }
}

async function packageLinux(plan) {
  await buildDesktopOutput(plan, plan.appImage);
  const stagingDir = await mkdtemp(path.join(releaseDir, ".lapis-linux-"));
  try {
    const artifactRoot = path.join(stagingDir, plan.baseName);
    await mkdir(artifactRoot, { mode: 0o755, recursive: true });
    const bundle = path.join(artifactRoot, "lib", "lapis-notes");
    await mkdir(path.dirname(bundle), { recursive: true });
    await buildDesktopOutput(plan, bundle);
    await writeFile(
      path.join(artifactRoot, plan.executable),
      createLinuxLauncher(),
      { mode: 0o755 },
    );
    await writeFile(
      path.join(artifactRoot, plan.desktopEntry),
      createLinuxDesktopEntry(),
      { mode: 0o644 },
    );
    await copyFile(plan.icon, path.join(artifactRoot, plan.installedIcon));
    await rm(plan.archive, { force: true });
    await run("tar", ["-czf", plan.archive, "-C", stagingDir, plan.baseName]);
  } finally {
    await rm(stagingDir, { force: true, recursive: true });
  }
  await signLinuxArtifacts([plan.appImage, plan.archive]);
}

await mkdir(releaseDir, { recursive: true });
const target = readRequestedTarget(
  process.argv.slice(2),
  process.platform,
  process.arch,
);
const plan = createDistributionPlan({
  packageDir,
  releaseDir,
  version: packageMetadata.version,
  target,
});

if (!fs.existsSync(plan.icon)) {
  throw new Error(`Lapis application icon is missing: ${plan.icon}`);
}

await prepareNativeLibrary(plan);

if (plan.platform === "macos") {
  await packageMac(plan);
} else {
  await packageLinux(plan);
}
