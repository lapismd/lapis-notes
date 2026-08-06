import { describe, expect, it } from "vitest";
import {
  commandFuzzyFilter,
  createCommandFuzzyFilter,
  createFuzzyMatchScore,
  fuzzyMatchScore,
} from "./command-fuzzy-filter.js";

describe("commandFuzzyFilter", () => {
  it("returns 1 for an empty query", () => {
    expect(commandFuzzyFilter("Open file", "   ")).toBe(1);
  });

  it("matches the primary value", () => {
    expect(commandFuzzyFilter("Open file", "open")).toBeGreaterThan(0);
  });

  it("matches keywords", () => {
    expect(
      commandFuzzyFilter("Save", "persist", ["persist", "write"]),
    ).toBeGreaterThan(0);
  });

  it("returns 0 when nothing matches", () => {
    expect(commandFuzzyFilter("Open file", "zzzz")).toBe(0);
  });

  it("ranks closer matches higher than weaker ones", () => {
    const filter = createCommandFuzzyFilter();
    const exact = filter("settings", "settings");
    const partial = filter("settings-panel", "settings");
    expect(exact).toBeGreaterThan(partial);
  });

  it("exposes fuzzyMatchScore as the shared per-item scorer", () => {
    expect(fuzzyMatchScore).toBe(commandFuzzyFilter);
    expect(createFuzzyMatchScore).toBe(createCommandFuzzyFilter);
  });
});
