/**
 * Fail if Tailwind utility class strings appear in Lapis native-CSS surfaces.
 *
 * Scans kept UI compounds and API chrome. Storybook stories / demos may still
 * use host Tailwind for layout and are excluded.
 *
 * Usage:
 *   pnpm check:no-tailwind
 *   pnpm check:no-tailwind packages/ui/src/lib/components
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";
import { findTailwindUtilitiesInSource } from "./lib/no-tailwind-utilities.js";

const DEFAULT_ROOTS = [
  "packages/ui/src/lib/components",
  "packages/api/src/lib/components",
] as const;

const requested = process.argv.slice(2);
const roots = (requested.length ? requested : [...DEFAULT_ROOTS]).map((r) =>
  resolve(r),
);

function isExcludedSvelte(fileName: string): boolean {
  return (
    fileName.endsWith(".stories.svelte") ||
    fileName.endsWith(".variations.stories.svelte")
  );
}

function svelteFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "examples" || entry.name === "stories") return [];
      return svelteFiles(path);
    }
    if (!entry.isFile() || !entry.name.endsWith(".svelte")) return [];
    if (isExcludedSvelte(entry.name)) return [];
    return [path];
  });
}

const findings = [];
for (const root of roots) {
  if (!statSync(root).isDirectory()) {
    throw new Error(`Expected directory: ${root}`);
  }
  for (const file of svelteFiles(root)) {
    const source = readFileSync(file, "utf8");
    findings.push(
      ...findTailwindUtilitiesInSource(source, relative(process.cwd(), file)),
    );
  }
}

if (findings.length) {
  console.error("Tailwind utilities remain in native-CSS surfaces:");
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.token}`);
  }
  console.error(
    `\n${findings.length} finding(s). Prefer --ui-* tokens / scoped CSS.`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `No Tailwind utilities found in ${roots
      .map((r) => relative(process.cwd(), r) || ".")
      .join(", ")} (stories/examples excluded).`,
  );
}
