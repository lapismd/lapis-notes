import assert from "node:assert/strict";
import test from "node:test";

import {
  proseMetrics,
  splitMarkdownTableRow,
} from "./lib/spec-model.mjs";
import { findingCodes, withFixture } from "./test-helpers.mjs";

const REQUIREMENT_TABLE = (row) =>
  `# System\n\n## Requirements\n\n| ID | Requirement |\n| --- | --- |\n${row}\n`;

test("parses escaped pipes and ignores Markdown syntax in prose metrics", () => {
  assert.deepEqual(
    splitMarkdownTableRow("| LN-TEST-001 | `left|right` MUST keep \\| safe. |"),
    ["LN-TEST-001", "`left|right` MUST keep \\| safe."],
  );
  assert.deepEqual(proseMetrics("[`linked value`](target.md) MUST work."), {
    prose: "linked value MUST work.",
    words: 4,
    sentences: 1,
  });
});

test("reports malformed IDs, table rows, and missing normative language", () => {
  withFixture(
    { "spec/src/index.md": REQUIREMENT_TABLE("| BAD-001 | It exists. |") },
    (result) => {
      const codes = findingCodes(result);
      assert(codes.has("SPEC-REQ-ID"));
      assert(codes.has("SPEC-REQ-NORMATIVE"));
    },
  );
  withFixture(
    {
      "spec/src/index.md": REQUIREMENT_TABLE(
        "| LN-TEST-001 | It MUST work. | unexpected |",
      ),
    },
    (result) => assert(findingCodes(result).has("SPEC-REQ-TABLE")),
  );
});

test("reports requirement word and sentence limits", () => {
  const words = Array.from({ length: 81 }, (_, index) => `word${index}`).join(
    " ",
  );
  withFixture(
    {
      "spec/src/index.md": REQUIREMENT_TABLE(
        `| LN-TEST-001 | The system MUST retain ${words}. |`,
      ),
    },
    (result) => assert(findingCodes(result).has("SPEC-REQ-WORDS")),
  );
  withFixture(
    {
      "spec/src/index.md": REQUIREMENT_TABLE(
        "| LN-TEST-001 | The system MUST work. One. Two. Three. Four. |",
      ),
    },
    (result) => assert(findingCodes(result).has("SPEC-REQ-SENTENCES")),
  );
});

test("reports duplicate definitions and unknown references", () => {
  withFixture(
    {
      "spec/src/SUMMARY.md":
        "# Summary\n\n- [System](./index.md)\n- [Extra](./extra.md)\n- [Verification](./verification.md)\n",
      "spec/src/extra.md": REQUIREMENT_TABLE(
        "| LN-TEST-001 | The duplicate MUST remain visible. |",
      ),
      "spec/src/index.md": `${REQUIREMENT_TABLE("| LN-TEST-001 | The system MUST remain specified. |")}\nLN-TEST-999\n`,
    },
    (result) => {
      const codes = findingCodes(result);
      assert(codes.has("SPEC-REQ-DUPLICATE"));
      assert(codes.has("SPEC-REQ-UNKNOWN"));
    },
  );
});

test("reports invalid acceptance-detail sections and oversized bullets", () => {
  const oversized = Array.from({ length: 81 }, (_, index) => `detail${index}`).join(
    " ",
  );
  withFixture(
    {
      "spec/src/index.md": `${REQUIREMENT_TABLE("| LN-TEST-001 | The system MUST remain specified. |")}\n### LN-TEST-999 acceptance details\n\nThe scenario verifies:\n\n- First\n- Second\n`,
    },
    (result) => {
      const codes = findingCodes(result);
      assert(codes.has("SPEC-REQ-DETAILS-ID"));
      assert(codes.has("SPEC-REQ-DETAILS-LIST"));
    },
  );
  withFixture(
    {
      "spec/src/index.md": `${REQUIREMENT_TABLE("| LN-TEST-001 | The system MUST remain specified. |")}\n### LN-TEST-001 acceptance details\n\nThe scenario verifies:\n\n- ${oversized}\n- Second\n- Third\n`,
    },
    (result) => assert(findingCodes(result).has("SPEC-REQ-WORDS")),
  );
});

test("reports duplicate change-map areas", () => {
  withFixture(
    {
      "spec/src/SUMMARY.md":
        "# Summary\n\n- [System](./index.md)\n- [Governance](./spec-governance.md)\n- [Verification](./verification.md)\n",
      "spec/src/spec-governance.md":
        "# Governance\n\n## Change map\n\n| Protected area | Required chapter |\n| --- | --- |\n| API | architecture.md |\n| API | packages.md |\n",
    },
    (result) => {
      assert(findingCodes(result).has("SPEC-GOV-MAP-DUPLICATE"));
    },
  );
});
