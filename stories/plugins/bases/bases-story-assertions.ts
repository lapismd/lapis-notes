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

export function expectBasesTableFillsSurface(
  table: HTMLElement,
  tolerance = 0.75,
) {
  const surface = table.closest<HTMLElement>(
    '[data-ui-component="bases-view"][data-ui-part="root"]',
  );
  const root = table.querySelector<HTMLElement>(
    '[data-ui-component="scroll-area"][data-ui-part="scroll-area"]',
  );
  const viewport = root?.querySelector<HTMLElement>(
    '[data-ui-part="scroll-area-viewport"]',
  );

  expect(surface).toBeVisible();
  expect(root).toBeVisible();
  expect(viewport).toBeVisible();

  const surfaceRect = surface!.getBoundingClientRect();
  const rootRect = root!.getBoundingClientRect();
  expect(Math.abs(rootRect.bottom - surfaceRect.bottom)).toBeLessThanOrEqual(
    tolerance,
  );
  expect(getComputedStyle(viewport!).scrollbarWidth).toBe("none");

  return { root: root!, viewport: viewport! };
}

export function expectBasesRowCellsAligned(
  table: HTMLElement,
  tolerance = 0.75,
) {
  const rows = table.querySelectorAll<HTMLElement>(
    '.bases-table__row[data-ui-part="row"]',
  );
  expect(rows.length).toBeGreaterThan(0);

  for (const [rowIndex, row] of [...rows].entries()) {
    const cells = row.querySelectorAll<HTMLElement>(
      ".bases-table__cell[data-column-id]",
    );
    expect(cells.length, `Missing cells in row ${rowIndex}`).toBeGreaterThan(0);
    const expected = cells[0]!.getBoundingClientRect();

    for (const cell of [...cells].slice(1)) {
      const actual = cell.getBoundingClientRect();
      expect(Math.abs(expected.top - actual.top)).toBeLessThanOrEqual(
        tolerance,
      );
      expect(Math.abs(expected.bottom - actual.bottom)).toBeLessThanOrEqual(
        tolerance,
      );
      expect(Math.abs(expected.height - actual.height)).toBeLessThanOrEqual(
        tolerance,
      );
    }
  }

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const previous = rows[rowIndex - 1]!.getBoundingClientRect();
    const current = rows[rowIndex]!.getBoundingClientRect();
    expect(
      Math.abs(previous.bottom - current.top),
      `Rows ${rowIndex - 1} and ${rowIndex} overlap or leave a gap`,
    ).toBeLessThanOrEqual(tolerance);
  }
}

export function expectBasesCellContentTopAligned(
  table: HTMLElement,
  tolerance = 2,
) {
  const row = table.querySelector<HTMLElement>(
    '.bases-table__row[data-ui-part="row"]',
  );
  expect(row).toBeTruthy();

  const cells = row!.querySelectorAll<HTMLElement>(
    ".bases-table__cell[data-column-id]",
  );
  expect(cells.length).toBeGreaterThan(0);

  for (const cell of cells) {
    const root = cell.querySelector<HTMLElement>(
      '[data-ui-component="bases-cell"]',
    );
    const content =
      cell.querySelector<HTMLElement>(
        '.bases-cell-editor__checkbox-wrap, [data-ui-component="chip-autocomplete"] .chip-autocomplete-box, .bases-cell-editor__control, .bases-autocomplete input',
      ) ??
      root?.querySelector<HTMLElement>(
        ':scope > a, :scope > div:not([data-ui-component="bases-cell-editor"])',
      );
    if (!root || !content) continue;

    const rootRect = root.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    expect(
      Math.abs(rootRect.top - contentRect.top),
      `Cell ${cell.dataset.columnId} content is not top aligned`,
    ).toBeLessThanOrEqual(tolerance);
  }

  const singleLineControls = row.querySelectorAll<HTMLElement>(
    ".bases-cell-editor__checkbox-wrap, .bases-cell-editor__control, .bases-autocomplete input",
  );
  for (const control of singleLineControls) {
    expect(control.getBoundingClientRect().height).toBeLessThanOrEqual(24);
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

export function expectBasesQueryEditorChrome(
  queryEditor: HTMLElement,
  completionTooltip: HTMLElement,
) {
  const editor = queryEditor.querySelector<HTMLElement>(".cm-editor");
  const selectedCompletion = completionTooltip.querySelector<HTMLElement>(
    '[aria-selected="true"]',
  );

  expect(editor).toHaveClass("cm-focused");
  expect(getComputedStyle(editor!).outlineStyle).toBe("none");
  expectOpaqueBackground(completionTooltip);

  const tooltipStyle = getComputedStyle(completionTooltip);
  expect(Number.parseFloat(tooltipStyle.borderRadius)).toBeGreaterThan(0);
  expect(tooltipStyle.boxShadow).not.toBe("none");
  expect(tooltipStyle.padding).toBe("4px");
  expect(selectedCompletion).toBeVisible();
  expect(getComputedStyle(selectedCompletion!).backgroundColor).not.toBe(
    tooltipStyle.backgroundColor,
  );
}
