import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const workflow = new URL(
  "../.github/workflows/desktop-release.yml",
  import.meta.url,
);

export function assertDesktopReleaseJobsRemoved(
  workflowUrl = workflow,
) {
  if (existsSync(fileURLToPath(workflowUrl)))
    throw new Error(
      "Desktop release jobs must not remain in this Notes repository",
    );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  assertDesktopReleaseJobsRemoved();
  console.log("Desktop release jobs are absent.");
}
