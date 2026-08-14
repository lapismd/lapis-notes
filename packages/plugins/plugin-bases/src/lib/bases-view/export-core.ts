export type ExportableEntry<TPropertyId extends string> = {
  getValue(propertyId: TPropertyId): unknown;
};

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (
    typeof value === "object" &&
    value &&
    "value" in (value as Record<string, unknown>)
  ) {
    const inner = (value as { value: unknown }).value;
    return inner === null || inner === undefined ? "" : String(inner);
  }
  return String(value);
}

function escapeCsv(value: string): string {
  if (!/[",\n]/.test(value)) {
    return value;
  }
  return `"${value.replaceAll('"', '""')}"`;
}

export function serializeResultsToCsv<TPropertyId extends string>(
  entries: Array<ExportableEntry<TPropertyId>>,
  properties: TPropertyId[],
  displayName: (propertyId: TPropertyId) => string,
): string {
  const lines = [
    properties
      .map((propertyId) => escapeCsv(displayName(propertyId)))
      .join(","),
  ];

  for (const entry of entries) {
    lines.push(
      properties
        .map((propertyId) =>
          escapeCsv(stringifyValue(entry.getValue(propertyId))),
        )
        .join(","),
    );
  }

  return lines.join("\n");
}
