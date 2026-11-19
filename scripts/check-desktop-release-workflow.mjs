import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const workflow = new URL(
  "../.github/workflows/desktop-release.yml",
  import.meta.url,
);
const repositoryRoot = new URL("../", import.meta.url);
const retiredDesktopSources = [
  "packages/desktop-deno",
  "scripts/desktop-release.mjs",
  "scripts/desktop-release.test.mjs",
];

export function assertDesktopReleaseJobsRemoved(workflowUrl = workflow) {
  if (existsSync(fileURLToPath(workflowUrl)))
    throw new Error(
      "Desktop release jobs must not remain in this Notes repository",
    );
}

export function assertRetiredDesktopSourcesRemoved(rootUrl = repositoryRoot) {
  const root = fileURLToPath(rootUrl);
  const restored = retiredDesktopSources.filter((source) =>
    existsSync(path.join(root, source)),
  );
  if (restored.length > 0)
    throw new Error(
      `Retired Notes desktop sources must not remain: ${restored.join(", ")}`,
    );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assertDesktopReleaseJobsRemoved();
  assertRetiredDesktopSourcesRemoved(
    pathToFileURL(
      path.dirname(fileURLToPath(import.meta.url)) + path.sep + "..",
    ),
  );
  console.log("Desktop release jobs and retired sources are absent.");
}
