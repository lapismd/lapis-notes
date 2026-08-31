#!/usr/bin/env node

import { spawn } from "node:child_process";

import { resolveTurboConcurrency } from "./lib/concurrency.mjs";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
if (args.length === 0) {
  throw new Error("Usage: run-turbo.mjs <task> [task ...] [Turbo options]");
}

const concurrency = resolveTurboConcurrency();
console.log(`Turbo concurrency: ${concurrency}`);
console.log(
  process.env.TURBO_TOKEN?.trim()
    ? `Turbo remote cache: ${process.env.TURBO_API || "configured"}`
    : "Turbo remote cache: unavailable; using normal local execution",
);

process.exitCode = await new Promise((resolve, reject) => {
  const child = spawn(
    "pnpm",
    ["exec", "turbo", "run", ...args, `--concurrency=${concurrency}`],
    { env: process.env, stdio: "inherit" },
  );
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
