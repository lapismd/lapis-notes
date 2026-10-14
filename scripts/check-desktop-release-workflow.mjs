import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { parse } from "yaml";
import { DESKTOP_TARGETS } from "./desktop-release.mjs";

export function validateDesktopReleaseWorkflow(workflow) {
  const matrix = workflow.jobs.native.strategy.matrix.include;
  if (
    matrix.length !== 4 ||
    new Set(matrix.map((item) => item.target)).size !== 4 ||
    !DESKTOP_TARGETS.every((target) =>
      matrix.some((item) => item.target === target),
    )
  )
    throw new Error("Desktop CI must qualify all four native targets");
  const platforms = {
    "aarch64-apple-darwin": "macos-15",
    "x86_64-apple-darwin": "macos-15-intel",
    "aarch64-unknown-linux-gnu": "ubuntu-24.04-arm",
    "x86_64-unknown-linux-gnu": "ubuntu-24.04",
  };
  if (matrix.some((item) => item.os !== platforms[item.target]))
    throw new Error("Desktop acceptance must use native target runners");
  if (
    !/^[a-f0-9]{40}$/.test(workflow.env.LAPIS_HOMEBREW_TAP_COMMIT) ||
    /^0+$/.test(workflow.env.LAPIS_HOMEBREW_TAP_COMMIT)
  )
    throw new Error(
      "Homebrew acceptance source must be pinned to an exact commit",
    );
  const steps = workflow.jobs.native.steps;
  const candidateBuild = steps.findIndex((step) =>
    step.run?.includes("desktop-deno package:app"),
  );
  const hostCheck = steps.findIndex((step) =>
    step.run?.includes("desktop-deno check"),
  );
  if (candidateBuild < 0 || hostCheck < 0 || candidateBuild >= hostCheck)
    throw new Error("Build workspace exports before checking the desktop host");
  for (const platform of ["macOS", "Linux"]) {
    if (
      !steps.some(
        (step) =>
          step.if === `runner.os == '${platform}'` &&
          step.run?.includes("test:desktop:packaged"),
      )
    )
      throw new Error("Full packaged acceptance must remain mandatory");
    if (
      !steps.some(
        (step) =>
          step.if === `runner.os == '${platform}'` &&
          step.run?.includes("test-install.mjs --audit") &&
          step.run.includes("--archive-directory .release/candidate"),
      )
    )
      throw new Error(
        "Audited Homebrew core installation must remain mandatory",
      );
  }
  if (
    workflow.jobs.publish.if !==
      "startsWith(github.ref, 'refs/tags/desktop-v')" ||
    !workflow.jobs.publish.needs.includes("native")
  )
    throw new Error(
      "Desktop publication must follow native validation on desktop tags only",
    );
  if (
    workflow.jobs.native.env.LAPIS_DENO_MAC_SIGN_IDENTITY !== "-" ||
    workflow.jobs.native.env.LAPIS_DENO_NOTARY_PROFILE !== ""
  )
    throw new Error(
      "Desktop macOS candidates must remain ad-hoc signed and unnotarized",
    );
  if (steps.some((step) => step.env?.GH_TOKEN || step.with?.["private-key"]))
    throw new Error(
      "Validation jobs must not receive production publication credentials",
    );
  const publishSteps = workflow.jobs.publish.steps;
  const homebrewSetup = publishSteps.findIndex((step) =>
    step.uses?.startsWith("Homebrew/actions/setup-homebrew@"),
  );
  const tapCheck = publishSteps.findIndex((step) =>
    step.run?.includes("LAPIS_TAP_BREW_CHECK=1 npm run check"),
  );
  if (homebrewSetup < 0 || tapCheck < 0 || homebrewSetup >= tapCheck)
    throw new Error("Homebrew tooling must be provisioned before tap checks");
  return workflow;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  validateDesktopReleaseWorkflow(
    parse(
      readFileSync(
        new URL("../.github/workflows/desktop-release.yml", import.meta.url),
        "utf8",
      ),
    ),
  );
  console.log("Desktop release workflow contract passed.");
}
