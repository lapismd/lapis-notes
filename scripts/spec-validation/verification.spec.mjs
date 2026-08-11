import assert from "node:assert/strict";
import test from "node:test";

import { findingCodes, withFixture } from "./test-helpers.mjs";

const HEADER =
  "# Verification\n\n| ID | Chapter | Status | Evidence |\n| --- | --- | --- | --- |\n";

test("reports missing and malformed verification matrices", () => {
  withFixture({ "spec/src/verification.md": null }, (result) => {
    assert(findingCodes(result).has("SPEC-VERIFY-MISSING"));
  });
  withFixture(
    { "spec/src/verification.md": `${HEADER}| LN-TEST-001 | system | Implemented |\n` },
    (result) => assert(findingCodes(result).has("SPEC-VERIFY-TABLE")),
  );
});

test("reports missing, duplicate, and orphan verification rows", () => {
  withFixture({ "spec/src/verification.md": HEADER }, (result) => {
    assert(findingCodes(result).has("SPEC-VERIFY-UNMAPPED"));
  });
  withFixture(
    {
      "spec/src/verification.md": `${HEADER}| LN-TEST-001 | system | Implemented | first |\n| LN-TEST-001 | system | Implemented | second |\n| LN-TEST-999 | system | Implemented | orphan |\n`,
    },
    (result) => {
      const codes = findingCodes(result);
      assert(codes.has("SPEC-VERIFY-DUPLICATE"));
      assert(codes.has("SPEC-VERIFY-ORPHAN"));
    },
  );
});

test("reports invalid status and missing evidence", () => {
  withFixture(
    {
      "spec/src/verification.md": `${HEADER}| LN-TEST-001 |  | Planned |  |\n`,
    },
    (result) => {
      const codes = findingCodes(result);
      assert(codes.has("SPEC-VERIFY-STATUS"));
      assert(codes.has("SPEC-VERIFY-EVIDENCE"));
    },
  );
});
