#!/usr/bin/env node
import { spawn } from "node:child_process";
import { loadStorybookLocalEnv } from "./storybook-local-env.mjs";

loadStorybookLocalEnv();
// Keep every host command on the same default lane as storybook-run.mjs.
// The portable addon defaults to 6006/6007, but this catalog's main lane is
// 7010/7011; leaving STORYBOOK_PORT unset can reuse another checkout's static
// server and produce misleading comparisons.
process.env.STORYBOOK_PORT ??= "7010";

const [command, ...args] = process.argv.slice(2);
if (!command) {
  console.error(
    "Usage: node scripts/with-storybook-env.mjs <command> [...args]",
  );
  process.exit(2);
}

const child = spawn(command, args, {
  env: process.env,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(`[with-storybook-env] ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
