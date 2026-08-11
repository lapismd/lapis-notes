import assert from "node:assert/strict";
import test from "node:test";

import { findingCodes, withFixture } from "./test-helpers.mjs";

test("reports missing, unindexed, stale, and broken summary content", () => {
  withFixture({ "spec/src/SUMMARY.md": null }, (result) => {
    assert(findingCodes(result).has("SPEC-SUMMARY-MISSING"));
  });
  withFixture({ "spec/src/orphan.md": "# Orphan\n" }, (result) => {
    assert(findingCodes(result).has("SPEC-SUMMARY-ENTRY"));
  });
  withFixture(
    {
      "spec/src/SUMMARY.md":
        "# Summary\n\n- [System](./index.md)\n- [Missing](./missing.md)\n- [Verification](./verification.md)\n",
    },
    (result) => {
      const codes = findingCodes(result);
      assert(codes.has("SPEC-SUMMARY-STALE"));
      assert(codes.has("SPEC-LINK-BROKEN"));
    },
  );
});

test("reports duplicate summary entries", () => {
  withFixture(
    {
      "spec/src/SUMMARY.md":
        "# Summary\n\n- [System](./index.md)\n- [System again](./index.md)\n- [Verification](./verification.md)\n",
    },
    (result) => {
      assert(findingCodes(result).has("SPEC-SUMMARY-ENTRY"));
    },
  );
});
