#!/usr/bin/env node

import { appendFile, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function summarizeTurboCache(run) {
  const summary = { attempted: 0, executed: 0, localHits: 0, remoteHits: 0 };
  for (const task of run.tasks ?? []) {
    summary.attempted += 1;
    if (task.cache?.status !== "HIT") summary.executed += 1;
    if (task.cache?.source === "LOCAL") summary.localHits += 1;
    if (task.cache?.source === "REMOTE") summary.remoteHits += 1;
  }
  return summary;
}

export async function readLatestTurboRun(repositoryRoot = root) {
  const runsDirectory = path.join(repositoryRoot, ".turbo/runs");
  const candidates = await Promise.all(
    (await readdir(runsDirectory))
      .filter((name) => name.endsWith(".json"))
      .map(async (name) => {
        const filePath = path.join(runsDirectory, name);
        return { filePath, modified: (await stat(filePath)).mtimeMs };
      }),
  );
  const latest = candidates.sort(
    (left, right) => right.modified - left.modified,
  )[0];
  if (!latest) throw new Error("Turbo did not write a run summary.");
  return JSON.parse(await readFile(latest.filePath, "utf8"));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const run = await readLatestTurboRun();
  const summary = summarizeTurboCache(run);
  const line = [
    `Turbo tasks: ${summary.attempted}`,
    `remote hits: ${summary.remoteHits}`,
    `local hits: ${summary.localHits}`,
    `executed: ${summary.executed}`,
  ].join(", ");
  console.log(line);
  if (process.env.TURBO_TOKEN?.trim() && summary.remoteHits === 0) {
    console.warn(
      "Remote cache was configured but this run had no remote hits; validation still executed normally.",
    );
  }
  if (
    process.argv.includes("--github-summary") &&
    process.env.GITHUB_STEP_SUMMARY
  ) {
    await appendFile(
      process.env.GITHUB_STEP_SUMMARY,
      `### Turbo cache\n\n${line}\n`,
    );
  }
}
