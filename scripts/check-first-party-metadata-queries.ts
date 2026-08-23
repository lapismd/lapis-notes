/**
 * Reject first-party runtime code that enumerates MetadataCache compatibility
 * snapshots. The controller itself owns those deprecated fields so explicit
 * snapshot leases can serve legacy plugins; every other first-party consumer
 * must use bounded async metadata queries.
 */
import { readdirSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";

const ROOTS = ["packages", "stories", ".storybook"].map((path) =>
  resolve(path),
);
const METADATA_CACHE_CONTROLLER = resolve(
  "packages/api/src/lib/cache.svelte.ts",
);
const findings: Array<{ file: string; line: number; member: string }> = [];

function excluded(path: string): boolean {
  return (
    path.includes("/dist/") ||
    path.includes("/.svelte-kit/") ||
    path.includes("/node_modules/") ||
    path.includes("/e2e/") ||
    /\.(?:test|spec)\.(?:svelte\.)?(?:js|ts|tsx)$/u.test(path) ||
    path.endsWith(".d.ts")
  );
}

function inspect(path: string): void {
  if (path === METADATA_CACHE_CONTROLLER) return;
  const source = readFileSync(path, "utf8");
  const patterns = [
    { member: "getAllItems", pattern: /\.\s*getAllItems\s*\(/gu },
    { member: "fileCache", pattern: /\.\s*fileCache\b/gu },
    { member: "resolvedLinks", pattern: /\.\s*resolvedLinks\b/gu },
    { member: "unresolvedLinks", pattern: /\.\s*unresolvedLinks\b/gu },
    {
      member: "metadataCache",
      pattern:
        /\.\s*metadataCache\s*(?:\.\s*metadataCache\b|\[\s*["']metadataCache["']\s*\])/gu,
    },
  ];
  for (const { member, pattern } of patterns) {
    for (const match of source.matchAll(pattern)) {
      findings.push({
        file: path,
        line: source.slice(0, match.index).split("\n").length,
        member,
      });
    }
  }
}

function collect(directory: string): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (!excluded(`${path}/`)) collect(path);
      continue;
    }
    if (
      !entry.isFile() ||
      excluded(path) ||
      ![".ts", ".tsx", ".svelte"].includes(extname(path))
    ) {
      continue;
    }
    inspect(path);
  }
}

for (const root of ROOTS) collect(root);

if (findings.length) {
  console.error("First-party MetadataCache snapshot enumeration violations:");
  for (const finding of findings) {
    console.error(
      `- ${finding.file.slice(process.cwd().length + 1)}:${finding.line} ${finding.member}`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(
    "Metadata query audit passed; first-party consumers do not enumerate compatibility snapshots.",
  );
}
