import { describe, expect, it } from "vitest";
import {
  dropIndicatorClasses,
  isColumnDragSource,
  isRowDragSource,
  parseTableDragData,
  resolveTableDragTargetIndex,
  tableColDragType,
  tableRowDragType,
} from "./table-dnd-utils";

const rowType = tableRowDragType("csv");
const colType = tableColDragType("csv");

describe("dropIndicatorClasses", () => {
  it("marks column drop to the right", () => {
    expect(
      dropIndicatorClasses(
        { type: colType, index: 1 },
        3,
        0,
        3,
        rowType,
        colType,
      ),
    ).toBe("is-dragging-right");
  });

  it("marks row drop above", () => {
    expect(
      dropIndicatorClasses(
        { type: rowType, index: 3 },
        1,
        1,
        0,
        rowType,
        colType,
      ),
    ).toBe("is-dragging-top");
  });

  it("detects active row and column drag sources", () => {
    expect(isRowDragSource({ type: rowType, index: 2 }, 2, rowType)).toBe(true);
    expect(isRowDragSource({ type: rowType, index: 2 }, 1, rowType)).toBe(
      false,
    );
    expect(isColumnDragSource({ type: colType, index: 1 }, 1, colType)).toBe(
      true,
    );
    expect(isColumnDragSource({ type: colType, index: 1 }, 0, colType)).toBe(
      false,
    );
  });
});

describe("parseTableDragData", () => {
  it("reads drag data from operation payload", () => {
    expect(
      parseTableDragData(
        {
          data: { type: rowType, index: 2 },
        },
        rowType,
        colType,
      ),
    ).toEqual({ type: rowType, index: 2 });
  });

  it("parses csv-style drop ids", () => {
    expect(
      parseTableDragData({ id: "csv-row-drop:1:grip" }, rowType, colType),
    ).toEqual({ type: rowType, index: 1 });
  });
});

describe("resolveTableDragTargetIndex", () => {
  it("prefers explicit drop target over dragOverIndex", () => {
    expect(
      resolveTableDragTargetIndex(
        {
          operation: {
            source: { data: { type: rowType, index: 1 } },
            target: { data: { type: rowType, index: 3 } },
          },
        },
        2,
        rowType,
        colType,
      ),
    ).toBe(3);
  });

  it("falls back to dragOverIndex", () => {
    expect(
      resolveTableDragTargetIndex(
        {
          operation: {
            source: { data: { type: rowType, index: 1 } },
            target: null,
          },
        },
        3,
        rowType,
        colType,
      ),
    ).toBe(3);
  });
});
