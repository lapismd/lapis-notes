#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildContainerArgs,
  hasCompleteRemoteCache,
  nativeLinuxPlatform,
} from "./lib/ci-container.mjs";
import { validateCiImageManifest } from "./lib/ci-images.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const parsed = parseArgs(process.argv.slice(2));
const manifest = await validateCiImageManifest(root, {
  requireDependencyDigest: true,
});
const packageDirectories = (
  await readdir(path.join(root, "packages"), { withFileTypes: true })
)
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const remoteCache = !parsed.noRemoteCache && hasCompleteRemoteCache();
if (parsed.remoteCache && !remoteCache) {
  throw new Error(
    "--remote-cache requires all four TURBO_* values in the ignored root .env.",
  );
}

const image = `${manifest.dependencies.image}@${manifest.dependencies.digest}`;
const args = buildContainerArgs({
  root,
  image,
  lockfileSha256: manifest.dependencies.lockfileSha256,
  packageDirectories,
  platform: parsed.platform,
  pull: parsed.pull,
  shell: parsed.shell,
  command: parsed.command,
  remoteCache,
});
console.log(`CI image: ${image}`);
console.log(`Platform: ${parsed.platform}`);
console.log(`Turbo remote cache: ${remoteCache ? "enabled" : "disabled"}`);

process.exitCode = await new Promise((resolve, reject) => {
  const child = spawn("docker", args, { env: process.env, stdio: "inherit" });
  child.on("error", reject);
  child.on("exit", (code, signal) => resolve(signal ? 1 : (code ?? 1)));
});

function parseArgs(args) {
  const parsed = {
    platform: nativeLinuxPlatform(),
    pull: false,
    shell: false,
    remoteCache: false,
    noRemoteCache: false,
    command: ["pnpm", "ci:release"],
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--") {
      parsed.command = args.slice(index + 1);
      break;
    }
    if (arg === "--platform") parsed.platform = args[++index];
    else if (arg === "--pull") parsed.pull = true;
    else if (arg === "--shell") parsed.shell = true;
    else if (arg === "--remote-cache") parsed.remoteCache = true;
    else if (arg === "--no-remote-cache") parsed.noRemoteCache = true;
    else throw new Error(`Unexpected argument: ${arg}`);
  }
  if (parsed.remoteCache && parsed.noRemoteCache) {
    throw new Error("Choose either --remote-cache or --no-remote-cache.");
  }
  if (parsed.command.length === 0)
    throw new Error("Container command cannot be empty.");
  return parsed;
}
