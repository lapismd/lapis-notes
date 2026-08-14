import { prepareFuzzySearch } from "@lapis-notes/api";

export function fuzzySearch<T extends Record<string, unknown>>(
  items: readonly T[],
  query: string,
  options: { keys: ReadonlyArray<keyof T> },
): Array<{ item: T; score: number }> {
  const normalized = query.trim();
  if (!normalized) {
    return items.map((item) => ({ item, score: 1 }));
  }

  const search = prepareFuzzySearch(normalized);
  return items
    .map((item) => {
      const result = search(
        options.keys.map((key) => String(item[key] ?? "")).join(" "),
      );
      return result ? { item, score: result.score } : null;
    })
    .filter((result): result is { item: T; score: number } => result !== null)
    .sort((left, right) => right.score - left.score);
}
