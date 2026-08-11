import { existsSync } from "node:fs";
import path from "node:path";

import {
  diagnostic,
  localMarkdownTargets,
  toPosix,
} from "./lib/spec-model.mjs";

export const name = "SUMMARY";

function withoutFragment(target) {
  return target.split("#", 1)[0];
}

export function validate(context) {
  const findings = [];
  const summary = context.model.files.find(
    (file) => file.chapterPath === "SUMMARY.md",
  );
  if (!summary) {
    findings.push(
      diagnostic({
        code: "SPEC-SUMMARY-MISSING",
        rule: "LN-GOV-001",
        file: "spec/src/SUMMARY.md",
        message: "canonical chapter index is missing",
      }),
    );
    return findings;
  }

  const targets = localMarkdownTargets(summary.source)
    .map(withoutFragment)
    .filter((target) => target.endsWith(".md"))
    .map((target) =>
      toPosix(path.normalize(path.join(path.dirname("SUMMARY.md"), target))),
    );
  const targetCounts = Map.groupBy(targets, (target) => target);
  const chapters = context.model.files
    .map((file) => file.chapterPath)
    .filter((chapter) => chapter !== "SUMMARY.md");

  for (const chapter of chapters) {
    const count = targetCounts.get(chapter)?.length ?? 0;
    if (count === 1) continue;
    findings.push(
      diagnostic({
        code: "SPEC-SUMMARY-ENTRY",
        rule: "LN-GOV-001",
        file: `spec/src/${chapter}`,
        message: `expected one SUMMARY.md entry, found ${count}`,
      }),
    );
  }
  for (const target of targetCounts.keys()) {
    if (chapters.includes(target)) continue;
    findings.push(
      diagnostic({
        code: "SPEC-SUMMARY-STALE",
        rule: "LN-GOV-001",
        file: "spec/src/SUMMARY.md",
        message: `indexed chapter does not exist: ${target}`,
      }),
    );
  }

  for (const file of context.model.files) {
    const lines = file.source.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      for (const target of localMarkdownTargets(lines[index])) {
        const fileTarget = withoutFragment(target);
        if (!fileTarget) continue;
        const resolved = path.resolve(path.dirname(file.absolutePath), fileTarget);
        if (existsSync(resolved)) continue;
        findings.push(
          diagnostic({
            code: "SPEC-LINK-BROKEN",
            rule: "LN-GOV-017",
            file: file.relativePath,
            line: index + 1,
            message: `local Markdown target does not exist: ${target}`,
          }),
        );
      }
    }
  }
  return findings;
}
