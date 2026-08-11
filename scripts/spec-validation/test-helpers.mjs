import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { runSpecificationValidation } from "./index.mjs";

export function createFixture(overrides = {}) {
  const repoRoot = mkdtempSync(path.join(os.tmpdir(), "lapis-spec-"));
  const files = {
    ".gitignore": "spec/book\n",
    "spec/book.toml": `[book]\nsrc = "src"\n\n[build]\nbuild-dir = "book"\n`,
    "spec/src/SUMMARY.md":
      "# Summary\n\n- [System](./index.md)\n- [Verification](./verification.md)\n",
    "spec/src/index.md":
      "# System\n\n## Requirements\n\n| ID | Requirement |\n| --- | --- |\n| LN-TEST-001 | The system MUST remain specified. |\n",
    "spec/src/verification.md":
      "# Verification\n\n| ID | Chapter | Status | Evidence |\n| --- | --- | --- | --- |\n| LN-TEST-001 | system | Implemented | fixture |\n",
    ...overrides,
  };
  for (const [relativePath, source] of Object.entries(files)) {
    const absolutePath = path.join(repoRoot, relativePath);
    if (source === null) continue;
    mkdirSync(path.dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, source);
  }
  return repoRoot;
}

export function withFixture(overrides, assertion, options = {}) {
  const repoRoot = createFixture(overrides);
  try {
    return assertion(
      runSpecificationValidation({
        repoRoot,
        trackedFiles: options.trackedFiles ?? [],
      }),
      repoRoot,
    );
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
}

export function findingCodes(result) {
  return new Set(result.findings.map((finding) => finding.code));
}
