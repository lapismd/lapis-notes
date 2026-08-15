import { describe, expect, it } from "vitest";
import { resolveTableColumnTracks } from "./table-column-tracks";

describe("Bases table column tracks", () => {
  it("keeps dotted property IDs and emits pixel-valued ordered tracks", () => {
    const widths = {
      "file.name": 158,
      "note.owner": 152.5,
      "note.due": 120,
    };
    const model = resolveTableColumnTracks(
      Object.keys(widths),
      (id) => widths[id as keyof typeof widths],
    );

    expect(model.tracks).toEqual([
      {
        id: "file.name",
        index: 0,
        start: 0,
        startCss: "0px",
        width: 158,
        widthCss: "158px",
      },
      {
        id: "note.owner",
        index: 1,
        start: 158,
        startCss: "158px",
        width: 152.5,
        widthCss: "152.5px",
      },
      {
        id: "note.due",
        index: 2,
        start: 310.5,
        startCss: "310.5px",
        width: 120,
        widthCss: "120px",
      },
    ]);
    expect(model.totalWidth).toBe(430.5);
    expect(model.totalWidthCss).toBe("430.5px");
  });

  it("normalizes invalid widths without disturbing later starts", () => {
    const model = resolveTableColumnTracks(
      ["note.owner", "note.score", "note.due"],
      (_id, index) => [120, Number.NaN, -20][index]!,
    );

    expect(model.tracks.map(({ start, width }) => ({ start, width }))).toEqual([
      { start: 0, width: 120 },
      { start: 120, width: 0 },
      { start: 120, width: 0 },
    ]);
    expect(model.totalWidthCss).toBe("120px");
  });

  it("returns an empty zero-width model for no columns", () => {
    expect(resolveTableColumnTracks([], () => 300)).toEqual({
      tracks: [],
      totalWidth: 0,
      totalWidthCss: "0px",
    });
  });
});
