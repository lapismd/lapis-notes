import { describe, expect, it } from "vitest";
import { createHarperLinter } from "./harper";

describe("harper.js LocalLinter", () => {
  it("loads WASM and flags a known misspelling", async () => {
    const linter = await createHarperLinter();
    try {
      const lints = await linter.lint("This sentense has a mispelled word.", {
        language: "markdown",
      });
      expect(lints.length).toBeGreaterThan(0);
      expect(
        lints.some((lint) => /sentense|mispelled/i.test(lint.message())),
      ).toBe(true);
      const descriptions = await (
        linter as { getLintDescriptions?: () => Promise<Record<string, string>> }
      ).getLintDescriptions?.();
      expect(descriptions && Object.keys(descriptions).length).toBeGreaterThan(
        3,
      );
    } finally {
      await linter.dispose?.();
    }
  }, 30_000);
});
