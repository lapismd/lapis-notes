export type GroupableEntry<TPropertyId extends string, TValue> = {
  getValue(propertyId: TPropertyId): TValue | null;
};

export type GroupedEntries<TEntry, TValue> = {
  entries: TEntry[];
  key: TValue | null;
};

export function groupEntries<
  TPropertyId extends string,
  TValue,
  TEntry extends GroupableEntry<TPropertyId, TValue>,
>(
  entries: TEntry[],
  groupBy?: TPropertyId | null,
  equals: (a: TValue | null, b: TValue | null) => boolean = Object.is,
): GroupedEntries<TEntry, TValue>[] {
  if (!groupBy) {
    return [{ entries, key: null }];
  }

  const groups: GroupedEntries<TEntry, TValue>[] = [];
  for (const entry of entries) {
    const key = entry.getValue(groupBy) ?? null;
    let group = groups.find((candidate) => equals(candidate.key, key));
    if (!group) {
      group = { entries: [], key };
      groups.push(group);
    }
    group.entries.push(entry);
  }

  return groups;
}
