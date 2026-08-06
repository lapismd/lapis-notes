import type { StringType, EnumType } from "./configuration.svelte";

export function normalizeMetadataFieldOptionValues(
  values: readonly unknown[],
): string[] {
  const normalized = new Set<string>();

  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        normalized.add(trimmed);
      }
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === "string") {
          const trimmed = entry.trim();
          if (trimmed) {
            normalized.add(trimmed);
          }
        }
      }
      continue;
    }

    if (value != null) {
      const trimmed = String(value).trim();
      if (trimmed) {
        normalized.add(trimmed);
      }
    }
  }

  return [...normalized].sort((a, b) => a.localeCompare(b));
}

export function filterOptionsByQuery(
  options: readonly { value: string; label?: string }[],
  query: string,
  limit = 50,
): Array<{ value: string; label: string }> {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? options.filter((option) => {
        const haystack =
          `${option.label ?? option.value} ${option.value}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : options;

  return filtered.slice(0, limit).map((option) => ({
    value: option.value,
    label: option.label ?? option.value,
  }));
}

export function resolveMetadataFieldValues(
  getValues: (field: string) => readonly unknown[],
  schema: StringType | EnumType,
  query = "",
  limit = 50,
): Array<{ value: string; label: string }> {
  const field = schema.optionsSourceParams?.field;
  if (typeof field !== "string" || !field.trim()) {
    return [];
  }

  const values = normalizeMetadataFieldOptionValues(getValues(field.trim()));
  const options = values.map((value) => ({ value, label: value }));
  return filterOptionsByQuery(options, query, limit);
}
