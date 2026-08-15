export function metadataPropertyKey(propertyId: string): string {
  return propertyId.startsWith("note.")
    ? propertyId.slice("note.".length)
    : propertyId;
}

export function collectMetadataSuggestions(
  values: readonly unknown[],
  splitDelimited = false,
): string[] {
  const suggestions = new Set<string>();

  function add(value: unknown) {
    if (Array.isArray(value)) {
      value.forEach(add);
      return;
    }
    if (value === null || value === undefined || value === "") return;

    const candidates =
      splitDelimited && typeof value === "string"
        ? value.split(/[,;]+/u)
        : [String(value)];

    for (const candidate of candidates) {
      const normalized = candidate.trim();
      if (normalized) suggestions.add(normalized);
    }
  }

  values.forEach(add);
  return [...suggestions];
}
