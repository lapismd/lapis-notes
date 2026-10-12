import { describe, expect, it } from "vitest";

import { normalizeManagedPath } from "./managed-vaults.ts";

describe("managed vault paths", () => {
  it.each([
    "/absolute.md",
    "../escape.md",
    "folder/../../escape.md",
    "a\0b.md",
    "C:\\escape.md",
  ])("rejects unsafe path %s", (path) =>
    expect(() => normalizeManagedPath(path)).toThrow(/Invalid vault path/u),
  );

  it("normalizes separators without allowing arbitrary roots", () => {
    expect(normalizeManagedPath("Notes\\today.md")).toBe("Notes/today.md");
  });
});
