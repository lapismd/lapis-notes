import { describe, expect, it } from "vitest";
import {
  consumeSuppressedHash,
  historyIdentityStoreInput,
  shouldReplaceLatestModify,
} from "./history-capture";

describe("history capture policy", () => {
  it("replaces the latest same-path modify inside the merge window", () => {
    expect(
      shouldReplaceLatestModify("modify", "modify", 1_000, 10_000, 4_000),
    ).toBe(true);
    expect(
      shouldReplaceLatestModify("modify", "modify", 1_000, 10_000, 12_000),
    ).toBe(false);
    expect(
      shouldReplaceLatestModify("modify", "create", 1_000, 10_000, 4_000),
    ).toBe(false);
    expect(shouldReplaceLatestModify("create", "modify", 1_000, 10_000, 4_000)).toBe(
      false,
    );
  });

  it("consumes a matching restore hash once", () => {
    const suppressed = new Map([["Notes/Welcome.md", "abc"]]);
    expect(consumeSuppressedHash(suppressed, "Notes/Welcome.md", "abc")).toBe(
      true,
    );
    expect(suppressed.size).toBe(0);
    expect(consumeSuppressedHash(suppressed, "Notes/Welcome.md", "abc")).toBe(
      false,
    );
  });

  it("keeps rename identity on the previous path", () => {
    expect(
      historyIdentityStoreInput("rename", "Notes/Next.md", "Notes/Welcome.md"),
    ).toEqual({
      path: "Notes/Next.md",
      previousPath: "Notes/Welcome.md",
      eventType: "rename",
    });
    expect(historyIdentityStoreInput("delete", "Notes/Welcome.md")).toEqual({
      path: "Notes/Welcome.md",
      eventType: "delete",
    });
  });
});
