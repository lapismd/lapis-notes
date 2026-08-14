type SearchValue = {
  toString(): string;
};

type SearchEntry<TPropertyId extends string = string> = {
  getValue(propertyId: TPropertyId): SearchValue | null;
};

function normalizeQuery(query: string): string {
  return query.trim().toLocaleLowerCase();
}

export function matchesSearch<
  TPropertyId extends string,
  TEntry extends SearchEntry<TPropertyId>,
>(entry: TEntry, properties: TPropertyId[], query: string): boolean {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return true;

  return properties.some((propertyId) => {
    const value = entry.getValue(propertyId);
    return value
      ? value.toString().toLocaleLowerCase().includes(normalizedQuery)
      : false;
  });
}

export function filterEntriesBySearch<
  TPropertyId extends string,
  TEntry extends SearchEntry<TPropertyId>,
>(entries: TEntry[], properties: TPropertyId[], query: string): TEntry[] {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) return entries;

  return entries.filter((entry) =>
    matchesSearch(entry, properties, normalizedQuery),
  );
}
