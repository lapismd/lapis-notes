import { describe, expect, it } from "vitest";
import { GraphBuildGeneration } from "./graph-build-generation";

describe("GraphBuildGeneration", () => {
  it("suppresses an older asynchronous graph result", () => {
    const generations = new GraphBuildGeneration();
    const first = generations.next();
    const second = generations.next();

    expect(generations.isCurrent(first)).toBe(false);
    expect(generations.isCurrent(second)).toBe(true);
  });

  it("invalidates pending results when the view unloads", () => {
    const generations = new GraphBuildGeneration();
    const pending = generations.next();

    generations.invalidate();

    expect(generations.isCurrent(pending)).toBe(false);
  });
});
