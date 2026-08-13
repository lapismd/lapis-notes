import { describe, expect, it } from "vitest";
import {
  expandSearchMatchContext,
  sliceSearchMatchContext,
  type SearchMatchContextWindow,
} from "./search-match-context";

const source = [
  "first line",
  "second line",
  "third line has the match",
  "fourth line",
  "fifth line",
  "sixth line",
].join("\n");

function matchWindow(): SearchMatchContextWindow {
  const start = source.indexOf("third line");
  const matchStart = source.indexOf("match");
  return {
    start,
    end: start + "third line has the match".length,
    ranges: [{ start: matchStart, end: matchStart + "match".length }],
  };
}

describe("search match context", () => {
  it("expands by complete source lines before and after a match", () => {
    const before = expandSearchMatchContext(source, matchWindow(), "before");
    const after = expandSearchMatchContext(source, before, "after");

    expect(sliceSearchMatchContext(source, before).text).toBe(
      "first line\nsecond line\nthird line has the match",
    );
    expect(sliceSearchMatchContext(source, after).text).toBe(
      [
        "first line",
        "second line",
        "third line has the match",
        "fourth line",
        "fifth line",
      ].join("\n"),
    );
  });

  it("keeps absolute highlights aligned inside an expanded slice", () => {
    const expanded = expandSearchMatchContext(source, matchWindow(), "before");
    const sliced = sliceSearchMatchContext(source, expanded);

    expect(
      sliced.text.slice(sliced.ranges[0]!.start, sliced.ranges[0]!.end),
    ).toBe("match");
  });

  it("clamps repeated expansion to source boundaries", () => {
    const before = expandSearchMatchContext(
      source,
      matchWindow(),
      "before",
      20,
    );
    const after = expandSearchMatchContext(source, before, "after", 20);

    expect(before.start).toBe(0);
    expect(after.end).toBe(source.length);
    expect(sliceSearchMatchContext(source, after).text).toBe(source);
  });
});
