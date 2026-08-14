import { describe, expect, it } from "vitest";
import { formatSummaryLabel, resolveConfiguredSummaries } from "./summary-core";

describe("Bases summaries", () => {
  it("merges base summaries with per-view overrides in display order", () => {
    expect(
      resolveConfiguredSummaries(
        ["note.title", "note.count", "file.name"],
        {
          "note.count": "sum",
          "file.name": "count",
        },
        {
          "note.count": "avg",
        },
      ),
    ).toEqual([
      { propertyId: "note.count", summaryKey: "avg" },
      { propertyId: "file.name", summaryKey: "count" },
    ]);
  });

  it("formats summary labels for footer display", () => {
    expect(formatSummaryLabel("count-empty")).toBe("Count Empty");
    expect(formatSummaryLabel("avg")).toBe("Avg");
  });
});
