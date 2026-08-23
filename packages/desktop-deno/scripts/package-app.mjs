#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { mkdir, writeFile } from "node:fs/promises";

const execFileAsync = promisify(execFile);
const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const releaseDir = path.join(packageDir, "release");

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

async function declareMacApplicationUrls(appBundle) {
  const plist = path.join(appBundle, "Contents", "Info.plist");
  const urlTypes = JSON.stringify([
    {
      CFBundleURLName: "Lapis Notes",
      CFBundleURLSchemes: ["lapis", "lapis-notes"],
    },
  ]);
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
  await run("codesign", ["--force", "--deep", "--sign", "-", appBundle]);
}

async function writeLinuxDesktopEntry() {
  await writeFile(
    path.join(releaseDir, "lapis-notes.desktop"),
    [
      "[Desktop Entry]",
      "Type=Application",
      "Name=Lapis Notes",
      "Comment=Open a Lapis Notes vault",
      "Exec=LapisNotes %u",
      "Terminal=false",
      "Categories=Office;Utility;",
      "MimeType=x-scheme-handler/lapis;x-scheme-handler/lapis-notes;",
      "",
    ].join("\n"),
    { mode: 0o644 },
  );
}

await mkdir(releaseDir, { recursive: true });
const output =
  process.platform === "darwin"
    ? path.join(releaseDir, "LapisNotes.app")
    : path.join(releaseDir, "LapisNotes");
await run(resolveDenoExecutable(), [
  "desktop",
  "--output",
  output,
  "--no-check",
  "--sloppy-imports",
  "--exclude",
  "node_modules",
  "--exclude",
  "dist",
  "--exclude",
  "src",
  "-A",
  "src-deno/main.ts",
]);

if (process.platform === "darwin") {
  await declareMacApplicationUrls(output);
} else if (process.platform === "linux") {
  await writeLinuxDesktopEntry();
}
