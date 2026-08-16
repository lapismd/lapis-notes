import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export function expectedSpecificationTitles(summary) {
  return [...summary.matchAll(/\[([^\]]+)]\((?:\.\/)?([^\s)#]+\.md)(?:#[^)]+)?\)/g)].map(
    (match) => `Specification/${match[1].replaceAll(" / ", "/")}`,
  );
}

export function auditStorybookIndex(summary, index) {
  const expected = expectedSpecificationTitles(summary);
  const entries = Object.values(index.entries ?? index.v ?? {});
  const actual = new Set(
    entries.map((entry) => entry?.title).filter((title) => typeof title === "string"),
  );
  const missing = expected.filter((title) => !actual.has(title));
  return { expected, missing };
}

function main() {
  const summaryPath = process.argv[2] ?? "spec/src/SUMMARY.md";
  const indexPath = process.argv[3] ?? "storybook-static/index.json";
  const summary = readFileSync(summaryPath, "utf8");
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  const result = auditStorybookIndex(summary, index);
  if (result.missing.length > 0) {
    console.error(
      `Storybook specification index is missing ${result.missing.length} chapter(s):\n${result.missing.join("\n")}`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(`Storybook rendered all ${result.expected.length} specification chapters.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
