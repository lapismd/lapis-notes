import Fuse, { type FuseOptionKey } from "fuse.js";

export interface FuzzySearchResult<T> {
  item: T;
  score: number;
}

export interface FuzzySearchOptions<T> {
  keys: ReadonlyArray<FuseOptionKey<T>>;
  threshold?: number;
  distance?: number;
  minMatchCharLength?: number;
}

const DEFAULT_THRESHOLD = 0.4;
const DEFAULT_DISTANCE = 100;
const DEFAULT_MIN_MATCH_CHAR_LENGTH = 2;

export function fuzzySearch<T>(
  items: readonly T[],
  query: string,
  options: FuzzySearchOptions<T>,
): FuzzySearchResult<T>[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return items.map((item) => ({ item, score: 1 }));
  }

  const fuse = new Fuse(items, {
    keys: [...options.keys],
    includeScore: true,
    threshold: options.threshold ?? DEFAULT_THRESHOLD,
    distance: options.distance ?? DEFAULT_DISTANCE,
    ignoreLocation: true,
    minMatchCharLength:
      options.minMatchCharLength ?? DEFAULT_MIN_MATCH_CHAR_LENGTH,
  });

  return fuse.search(normalizedQuery).map((result) => ({
    item: result.item,
    score: 1 - (result.score ?? 1),
  }));
}
