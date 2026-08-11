import assert from "node:assert/strict";
import test from "node:test";

import {
  main,
  runSpecificationValidation,
} from "./index.mjs";
import { formatDiagnostic } from "./lib/spec-model.mjs";
import { createFixture, withFixture } from "./test-helpers.mjs";
import { rmSync } from "node:fs";

test("accepts a complete specification and reports counts", () => {
  withFixture({}, (result) => {
    assert.equal(result.ok, true);
    assert.deepEqual(result.stats, {
      validators: 5,
      chapters: 2,
      requirements: 1,
    });
  });
});

test("sorts diagnostics by path, line, and code", () => {
  const repoRoot = createFixture({
    ".gitignore": "dist\n",
    "spec/src/index.md":
      "# System\n\n## Requirements\n\n| ID | Requirement |\n| --- | --- |\n| LN-TEST-001 | It exists. |\n",
  });
  try {
    const result = runSpecificationValidation({ repoRoot, trackedFiles: [] });
    const sorted = [...result.findings].sort((left, right) =>
      left.file.localeCompare(right.file) ||
      left.line - right.line ||
      left.code.localeCompare(right.code),
    );
    assert.deepEqual(result.findings, sorted);
  } finally {
    rmSync(repoRoot, { recursive: true, force: true });
  }
});

test("main returns one for findings and two for internal failures", () => {
  const messages = [];
  const log = {
    log: (message) => messages.push(message),
    error: (message) => messages.push(message),
  };
  assert.equal(
    main({
      log,
      run: () => ({
        ok: false,
        findings: [
          {
            code: "SPEC-TEST",
            rule: "LN-GOV-018",
            file: "spec/src/index.md",
            line: 1,
            message: "finding",
          },
        ],
      }),
    }),
    1,
  );
  assert.equal(
    main({
      log,
      run: () => {
        throw new Error("broken parser");
      },
    }),
    2,
  );
  assert(messages.some((message) => message.includes("[SPEC-INTERNAL]")));
});

test("formats the stable diagnostic contract", () => {
  assert.equal(
    formatDiagnostic({
      code: "SPEC-REQ-WORDS",
      rule: "LN-GOV-015",
      file: "spec/src/editor-demo.md",
      line: 22,
      subject: "LN-ED-020",
      message: "165 words; maximum 80",
    }),
    "[SPEC-REQ-WORDS] [LN-GOV-015] spec/src/editor-demo.md:22 LN-ED-020: 165 words; maximum 80",
  );
});
