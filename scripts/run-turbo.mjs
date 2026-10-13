#!/usr/bin/env node

import { spawn } from "node:child_process";

import { resolveTurboConcurrency } from "./lib/concurrency.mjs";
import {
  isStorybookTask,
  resolveTurboArguments,
} from "./lib/turbo-invocation.mjs";
import { loadStorybookLocalEnv } from "./storybook-local-env.mjs";

const requested = process.argv.slice(2);
if (isStorybookTask(requested)) loadStorybookLocalEnv();
const { args, live } = resolveTurboArguments(requested);
if (args.length === 0) {
  throw new Error("Usage: run-turbo.mjs <task> [task ...] [Turbo options]");
}

// Browser/static results must never cross Node ABI, OS, or CPU boundaries.
process.env.LAPIS_TURBO_TOOLCHAIN = `node-${process.versions.node}:${process.platform}:${process.arch}`;
const concurrency = resolveTurboConcurrency();
console.log(`Turbo concurrency: ${concurrency}`);
console.log(
  process.env.TURBO_TOKEN?.trim()
    ? `Turbo remote cache: ${process.env.TURBO_API || "configured"}`
    : "Turbo remote cache: unavailable; using local disk cache",
);

if (live) console.log("Turbo cache disabled for live Storybook acceptance.");

// Turbo options belong before its command-argument separator.
const boundary = args.indexOf("--");
args.splice(
  boundary < 0 ? args.length : boundary,
  0,
  `--concurrency=${concurrency}`,
);

process.exitCode = await new Promise((resolve, reject) => {
  const child = spawn("pnpm", ["exec", "turbo", "run", ...args], {
    env: process.env,
    stdio: "inherit",
  });
  child.on("error", reject);
  child.on("exit", (code, signal) => {
    if (signal) {
      console.error(`Turbo terminated by ${signal}.`);
      resolve(1);
    } else {
      resolve(code ?? 1);
    }
  });
});
