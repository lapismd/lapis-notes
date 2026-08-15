import { expect } from "storybook/test";

type ColumnGeometry = {
  id: string;
  left: number;
  right: number;
  width: number;
};

function geometries(root: ParentNode, selector: string): ColumnGeometry[] {
  return [...root.querySelectorAll<HTMLElement>(selector)].map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      id: element.dataset.columnId ?? "",
      left: rect.left,
      right: rect.right,
      width: rect.width,
    };
  });
}

export function expectBasesColumnsAligned(
  table: HTMLElement,
  tolerance = 0.75,
) {
  const headers = geometries(
    table,
    ".bases-table__header-cell[data-column-id]",
  );
  const rows = [
    ...table.querySelectorAll<HTMLElement>(
      '.bases-table__row[data-ui-part="row"]',
    ),
  ];
  const summaryCells = geometries(
    table,
    ".bases-table__summary-cell[data-column-id]",
  );

  expect(headers.length).toBeGreaterThan(0);
  expect(rows.length).toBeGreaterThan(0);

  const candidates = [
    ...rows.map((row, index) => ({
      label: `row ${index}`,
      geometry: geometries(row, ".bases-table__cell[data-column-id]"),
    })),
    ...(summaryCells.length
      ? [{ label: "summary", geometry: summaryCells }]
      : []),
  ];

  for (const { label, geometry } of candidates) {
    const candidateMap = new Map(geometry.map((item) => [item.id, item]));
    for (const header of headers) {
      const candidate = candidateMap.get(header.id);
      expect(candidate, `Missing ${label} cell for ${header.id}`).toBeDefined();
      expect(Math.abs(header.left - candidate!.left)).toBeLessThanOrEqual(
        tolerance,
      );
      expect(Math.abs(header.right - candidate!.right)).toBeLessThanOrEqual(
        tolerance,
      );
      expect(Math.abs(header.width - candidate!.width)).toBeLessThanOrEqual(
        tolerance,
      );
    }
  }
}

export function expectOpaqueBackground(element: HTMLElement) {
  const background = getComputedStyle(element).backgroundColor;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  expect(context).toBeTruthy();
  context!.clearRect(0, 0, 1, 1);
  context!.fillStyle = background;
  context!.fillRect(0, 0, 1, 1);
  expect(context!.getImageData(0, 0, 1, 1).data[3]).toBe(255);
}
