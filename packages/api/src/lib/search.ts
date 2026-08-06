export type SearchMatchPart = [start: number, end: number];
export type SearchMatches = SearchMatchPart[];

export interface SearchResult {
  score: number;
  matches: SearchMatches;
}

export interface SearchResultContainer {
  score?: number;
  result?: SearchResult;
}

export interface FuzzyMatch<T> {
  item: T;
  match: SearchResult;
}

function normalizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function mergeMatches(matches: SearchMatches): SearchMatches {
  const sorted = [...matches].sort((a, b) => a[0] - b[0]);
  const merged: SearchMatches = [];
  for (const [start, end] of sorted) {
    const previous = merged[merged.length - 1];
    if (previous && start <= previous[1]) {
      previous[1] = Math.max(previous[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

function simpleSearchText(query: string, text: string): SearchResult | null {
  const parts = normalizeQuery(query);
  if (!parts.length) return { score: 0, matches: [] };
  const lowerText = text.toLowerCase();
  const matches: SearchMatches = [];
  let score = 0;
  let cursor = 0;

  for (const part of parts) {
    const index = lowerText.indexOf(part, cursor);
    if (index === -1) return null;
    matches.push([index, index + part.length]);
    score += part.length * 10 - index;
    cursor = index + part.length;
  }

  return { score, matches: mergeMatches(matches) };
}

function fuzzySearchText(query: string, text: string): SearchResult | null {
  const needle = query.toLowerCase().replace(/\s+/g, "");
  if (!needle.length) return { score: 0, matches: [] };

  const haystack = text.toLowerCase();
  const matches: SearchMatches = [];
  let cursor = 0;
  let score = 0;

  for (const char of needle) {
    const index = haystack.indexOf(char, cursor);
    if (index === -1) return null;

    const previous = matches[matches.length - 1];
    if (previous && previous[1] === index) {
      previous[1] = index + 1;
      score += 8;
    } else {
      matches.push([index, index + 1]);
      score += 5;
    }
    if (index === cursor) score += 3;
    cursor = index + 1;
  }

  const first = matches[0]?.[0] ?? 0;
  return { score: score - first, matches };
}

export function prepareSimpleSearch(
  query: string,
): (text: string) => SearchResult | null {
  return (text: string) => simpleSearchText(query, text);
}

export function prepareFuzzySearch(
  query: string,
): (text: string) => SearchResult | null {
  return (text: string) => {
    return simpleSearchText(query, text) ?? fuzzySearchText(query, text);
  };
}

export function renderMatches(
  el: HTMLElement | DocumentFragment,
  text: string,
  matches: SearchMatches | null,
  offset: number = 0,
): void {
  if (!matches?.length) {
    el.append(document.createTextNode(text));
    return;
  }

  let cursor = 0;
  for (const [from, to] of matches) {
    const start = Math.max(0, from - offset);
    const end = Math.max(start, to - offset);
    if (start > cursor) {
      el.append(document.createTextNode(text.slice(cursor, start)));
    }
    const mark = document.createElement("span");
    mark.className = "suggestion-highlight";
    mark.textContent = text.slice(start, end);
    el.append(mark);
    cursor = end;
  }
  if (cursor < text.length) {
    el.append(document.createTextNode(text.slice(cursor)));
  }
}

export function renderResults(
  el: HTMLElement,
  text: string,
  result: SearchResult,
  offset?: number,
): void {
  el.empty();
  renderMatches(el, text, result.matches, offset);
}

export function sortSearchResults(results: SearchResultContainer[]): void {
  results.sort(
    (a, b) =>
      (b.score ?? b.result?.score ?? 0) - (a.score ?? a.result?.score ?? 0),
  );
}
