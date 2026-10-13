import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { specificationChapters } from "./specification-navigation.mjs";

export function expectedSpecificationTitles(summary) {
  return specificationChapters(summary).map(({ title }) => title);
}

export function auditStorybookIndex(summary, index) {
  const expected = expectedSpecificationTitles(summary);
  const entries = Object.values(index.entries ?? index.v ?? {});
  const actual = new Set(
    entries
      .map((entry) => entry?.title)
      .filter((title) => typeof title === "string"),
  );
  const missing = expected.filter((title) => !actual.has(title));
  const chapters = specificationChapters(summary);
  const stale = entries
    .filter(
      (entry) =>
        entry?.title?.startsWith("Specification/") &&
        !expected.includes(entry.title),
    )
    .map(({ title }) => title);
  const duplicate = expected.filter(
    (title) => entries.filter((entry) => entry?.title === title).length > 1,
  );
  const routes = chapters
    .filter(({ title, id }) => {
      const entry = entries.find((entry) => entry?.title === title);
      return entry && (entry.id !== id || entry.type !== "docs");
    })
    .map(({ title }) => title);
  return { expected, missing, stale, duplicate, routes };
}

function main() {
  const summaryPath = process.argv[2] ?? "spec/src/SUMMARY.md";
  const indexPath = process.argv[3] ?? "storybook-static/index.json";
  const summary = readFileSync(summaryPath, "utf8");
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  const result = auditStorybookIndex(summary, index);
  const failures = [
    ...result.missing,
    ...result.stale,
    ...result.duplicate,
    ...result.routes,
  ];
  if (failures.length > 0) {
    console.error(
      `Storybook specification index has ${failures.length} coverage, duplicate, stale, or route finding(s):\n${failures.join("\n")}`,
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    `Storybook rendered all ${result.expected.length} specification chapters.`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}
