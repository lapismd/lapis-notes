import { describe, expect, it } from "vitest";
import { markdownViewReturnTarget } from "./index";

describe("markdownViewReturnTarget", () => {
  it("normalizes a persisted return target", () => {
    expect(
      markdownViewReturnTarget({
        returnTarget: {
          type: " role ",
          label: " role preview ",
          icon: "book-open",
          state: { mode: "preview" },
        },
      }),
    ).toEqual({
      type: "role",
      label: "role preview",
      icon: "book-open",
      state: { mode: "preview" },
    });
  });

  it("rejects incomplete or scalar targets", () => {
    expect(markdownViewReturnTarget({ returnTarget: "role" })).toBeNull();
    expect(
      markdownViewReturnTarget({ returnTarget: { type: "role" } }),
    ).toBeNull();
  });
});
