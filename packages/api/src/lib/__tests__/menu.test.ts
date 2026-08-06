import { describe, expect, it } from "vitest";
import { trimMenuEdgeSeparators } from "../menu-utils";

describe("Menu rendering", () => {
  it("trims separators that become the first rendered item after filtering", () => {
    expect(
      trimMenuEdgeSeparators({
        first: ["separator"],
        second: ["Banana"],
      }),
    ).toEqual({
      second: ["Banana"],
    });
  });

  it("keeps middle separators but trims separators at the end of the rendered menu", () => {
    expect(
      trimMenuEdgeSeparators({
        first: ["Alpha", "separator"],
        second: ["Beta", "separator"],
      }),
    ).toEqual({
      first: ["Alpha", "separator"],
      second: ["Beta"],
    });
  });
});
