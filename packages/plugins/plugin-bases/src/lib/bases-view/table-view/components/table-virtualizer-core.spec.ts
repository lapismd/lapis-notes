import { describe, expect, it } from "vitest";
import {
  resolveVirtualTotalSize,
  resolveVisibleVirtualRows,
} from "./table-virtualizer-core";

describe("table virtualization guards", () => {
  it("drops stale virtual rows when the filtered result set is empty", () => {
    expect(
      resolveVisibleVirtualRows([{ index: 0 }, { index: 1 }, { index: 2 }], []),
    ).toEqual([]);
  });

  it("keeps only rows that still point at a current display item", () => {
    expect(
      resolveVisibleVirtualRows(
        [{ index: 0 }, { index: 1 }, { index: 3 }],
        [{ key: "group_0" }, { key: "row_1" }],
      ),
    ).toEqual([
      {
        virtualRow: { index: 0 },
        item: { key: "group_0" },
      },
      {
        virtualRow: { index: 1 },
        item: { key: "row_1" },
      },
    ]);
  });

  it("collapses the virtual height when there are no display items", () => {
    expect(resolveVirtualTotalSize(0, 1200)).toBe(0);
    expect(resolveVirtualTotalSize(3, 1200)).toBe(1200);
  });
});
