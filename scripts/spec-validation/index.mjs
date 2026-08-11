#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as book from "./book.mjs";
import {
  compareDiagnostics,
  createSpecModel,
  diagnostic,
  formatDiagnostic,
  toPosix,
} from "./lib/spec-model.mjs";
import * as specificationGovernance from "./spec-governance.mjs";
import * as summary from "./SUMMARY.mjs";
import * as verification from "./verification.mjs";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_REPO_ROOT = path.resolve(SCRIPT_DIRECTORY, "../..");
export const VALIDATORS = [summary, specificationGovernance, verification, book];

function runTrackedFileCommand(command, args, repoRoot) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) return { ok: false, error: result.error.message };
  if (result.status !== 0) {
    return {
      ok: false,
      error: result.stderr.trim() || `${command} exited ${result.status}`,
    };
  }
  return {
    ok: true,
    files: result.stdout
      .split(/\r?\n/)
      .map((file) => toPosix(file.trim()))
      .filter(Boolean),
  };
}

export function discoverTrackedFiles(repoRoot) {
  const jj = runTrackedFileCommand(
    "jj",
    ["--no-pager", "file", "list", "-r", "@"],
    repoRoot,
  );
  if (jj.ok) return jj.files;
  const git = runTrackedFileCommand("git", ["ls-files"], repoRoot);
  if (git.ok) return git.files;
  throw new Error(
    `cannot determine tracked files with jj (${jj.error}) or git (${git.error})`,
  );
}

export function createValidationContext({ repoRoot, trackedFiles }) {
  const model = createSpecModel(repoRoot);
  return {
    model,
    trackedFiles: trackedFiles ?? discoverTrackedFiles(repoRoot),
    readOptional(filePath) {
      try {
        return readFileSync(filePath, "utf8");
      } catch (error) {
        if (error?.code === "ENOENT") return null;
        throw error;
      }
    },
  };
}

export function runSpecificationValidation({
  repoRoot = DEFAULT_REPO_ROOT,
  trackedFiles,
  validators = VALIDATORS,
} = {}) {
  const context = createValidationContext({ repoRoot, trackedFiles });
  const findings = validators
    .flatMap((validator) => validator.validate(context))
    .sort(compareDiagnostics);
  return {
    ok: findings.length === 0,
    findings,
    stats: {
      validators: validators.length,
      chapters: context.model.files.filter(
        (file) => file.chapterPath !== "SUMMARY.md",
      ).length,
      requirements: context.model.definitions.length,
    },
  };
}

export function internalFailure(error) {
  return diagnostic({
    code: "SPEC-INTERNAL",
    rule: "LN-GOV-018",
    file: "scripts/spec-validation/index.mjs",
    message: error instanceof Error ? error.message : String(error),
  });
}

export function main({ log = console, run = runSpecificationValidation } = {}) {
  try {
    const result = run();
    if (!result.ok) {
      log.error("Specification validation failed:");
      for (const finding of result.findings) {
        log.error(formatDiagnostic(finding));
      }
      return 1;
    }
    log.log(
      `Specification validated: ${result.stats.validators} validators, ${result.stats.chapters} chapters, ${result.stats.requirements} requirements.`,
    );
    return 0;
  } catch (error) {
    log.error(formatDiagnostic(internalFailure(error)));
    return 2;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  process.exitCode = main();
}
