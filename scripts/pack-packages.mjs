#!/usr/bin/env node

import { spawn } from "node:child_process";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const alreadyBuilt = args.includes("--already-built");
for (const arg of args) {
  if (arg !== "--already-built") throw new Error(`Unexpected argument: ${arg}`);
}

if (!alreadyBuilt) {
  await run("node", ["scripts/run-turbo.mjs", "build"]);
}
await run("node", ["scripts/check-package-tarballs.mjs"]);

function run(command, commandArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      env: process.env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal || code !== 0) reject(new Error(`${command} failed`));
      else resolve();
    });
  });
}
