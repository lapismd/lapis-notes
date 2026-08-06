import { fuzzySearch, type FuzzySearchOptions } from "./fuzzy-search.js";

type CommandFuzzyFilterOptions = Pick<
  FuzzySearchOptions<{ text: string }>,
  "threshold" | "distance" | "minMatchCharLength"
>;

/**
 * Returns a per-item Fuse.js scorer for filtering ranked lists and Command
 * items.
 */
export function createFuzzyMatchScore(
  options?: CommandFuzzyFilterOptions,
): (value: string, search: string, keywords?: string[]) => number {
  return (value, search, keywords = []) => {
    const normalizedQuery = search.trim();
    if (!normalizedQuery) {
      return 1;
    }

    const texts = [value, ...keywords].filter(Boolean);
    if (texts.length === 0) {
      return 0;
    }

    const results = fuzzySearch(
      texts.map((text) => ({ text })),
      normalizedQuery,
      {
        keys: ["text"],
        ...options,
      },
    );

    return results.reduce((best, result) => Math.max(best, result.score), 0);
  };
}

export const fuzzyMatchScore = createFuzzyMatchScore();

/** @alias fuzzyMatchScore */
export const createCommandFuzzyFilter = createFuzzyMatchScore;

/** @alias fuzzyMatchScore */
export const commandFuzzyFilter = fuzzyMatchScore;
