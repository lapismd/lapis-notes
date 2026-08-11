import assert from "node:assert/strict";
import test from "node:test";

import { findingCodes, withFixture } from "./test-helpers.mjs";

test("reports missing and invalid mdBook configuration", () => {
  withFixture({ "spec/book.toml": null }, (result) => {
    assert(findingCodes(result).has("SPEC-BOOK-MISSING"));
  });
  withFixture({ "spec/book.toml": "[book]\nsrc = \"wrong\"\n" }, (result) => {
    assert(findingCodes(result).has("SPEC-BOOK-CONFIG"));
  });
});

test("reports missing ignore rule and tracked generated output", () => {
  withFixture({ ".gitignore": "dist\n" }, (result) => {
    assert(findingCodes(result).has("SPEC-BOOK-IGNORE"));
  });
  withFixture(
    {},
    (result) => assert(findingCodes(result).has("SPEC-BOOK-TRACKED")),
    { trackedFiles: ["spec/book/index.html"] },
  );
});
