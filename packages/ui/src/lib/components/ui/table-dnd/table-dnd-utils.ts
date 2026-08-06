export type TableReorderNamespace = "csv" | "markdown" | "settings";

export type TableDragSource = {
  type: string;
  index: number;
};

export type TableDragData = {
  type: string;
  index: number;
};

export function tableRowDragType(namespace: TableReorderNamespace): string {
  return `${namespace}-table-row`;
}

export function tableColDragType(namespace: TableReorderNamespace): string {
  return `${namespace}-table-col`;
}

export function dropIndicatorClasses(
  dragSource: TableDragSource | null,
  dragOverIndex: number | null,
  rowIndex: number,
  colIndex: number,
  rowType: string,
  colType: string,
): string {
  if (!dragSource || dragOverIndex === null) {
    return "";
  }

  const classes: string[] = [];

  if (dragSource.type === colType && colIndex === dragOverIndex) {
    if (dragOverIndex > dragSource.index) {
      classes.push("is-dragging-right");
    } else if (dragOverIndex < dragSource.index) {
      classes.push("is-dragging-left");
    }
  }

  if (dragSource.type === rowType && rowIndex === dragOverIndex) {
    if (dragOverIndex > dragSource.index) {
      classes.push("is-dragging-bottom");
    } else if (dragOverIndex < dragSource.index) {
      classes.push("is-dragging-top");
    }
  }

  return classes.join(" ");
}

export function isRowDragSource(
  dragSource: TableDragSource | null,
  rowIndex: number,
  rowType: string,
): boolean {
  return dragSource?.type === rowType && dragSource.index === rowIndex;
}

export function isColumnDragSource(
  dragSource: TableDragSource | null,
  colIndex: number,
  colType: string,
): boolean {
  return dragSource?.type === colType && dragSource.index === colIndex;
}

export function parseTableDragData(
  operation: { id?: string | number; data?: unknown } | null | undefined,
  rowType: string,
  colType: string,
): TableDragData | undefined {
  const data = operation?.data as TableDragData | undefined;
  if (
    data &&
    (data.type === rowType || data.type === colType) &&
    typeof data.index === "number"
  ) {
    return data;
  }

  if (typeof operation?.id !== "string") {
    return undefined;
  }

  const id = operation.id;
  const indexMatches = [...id.matchAll(/:(\d+)(?=$|:)/g)];
  const index = Number(indexMatches.at(-1)?.[1]);
  if (Number.isNaN(index)) {
    return undefined;
  }

  if (id.includes("row")) {
    return { type: rowType, index };
  }

  if (id.includes("col")) {
    return { type: colType, index };
  }

  return undefined;
}

export function resolveTableDragTargetIndex(
  event: {
    canceled?: boolean;
    operation: {
      source?: { data?: unknown } | null;
      target?: { data?: unknown } | null;
    };
  },
  dragOverIndex: number | null,
  rowType: string,
  colType: string,
): number | null {
  const source = parseTableDragData(event.operation.source, rowType, colType);
  const target = parseTableDragData(event.operation.target, rowType, colType);

  if (
    !event.canceled &&
    source &&
    target &&
    target.type === source.type &&
    target.index !== source.index
  ) {
    return target.index;
  }

  if (
    !event.canceled &&
    source &&
    dragOverIndex !== null &&
    dragOverIndex !== source.index
  ) {
    return dragOverIndex;
  }

  return null;
}
