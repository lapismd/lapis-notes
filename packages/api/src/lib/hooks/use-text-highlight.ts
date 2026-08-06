export type TextHighlightPart =
  | { highlighted: false; text: string }
  | { highlighted: true; text: string };

function findRanges(value: string, term: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  const needle = term.toLocaleLowerCase();
  const haystack = value.toLocaleLowerCase();
  let cursor = 0;

  while (needle && cursor < haystack.length) {
    const index = haystack.indexOf(needle, cursor);
    if (index === -1) {
      break;
    }
    ranges.push([index, index + needle.length]);
    cursor = index + Math.max(needle.length, 1);
  }

  return ranges;
}

function mergeRanges(ranges: Array<[number, number]>): Array<[number, number]> {
  const sorted = ranges
    .filter(([from, to]) => to > from)
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: Array<[number, number]> = [];

  for (const [from, to] of sorted) {
    const last = merged[merged.length - 1];
    if (last && from <= last[1]) {
      last[1] = Math.max(last[1], to);
      continue;
    }
    merged.push([from, to]);
  }

  return merged;
}

export function getTextHighlightParts(
  query: string,
  value: string,
): TextHighlightPart[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [{ highlighted: false, text: value }];
  }

  let ranges = findRanges(value, normalizedQuery);
  if (ranges.length === 0) {
    ranges = normalizedQuery
      .split(/\s+/u)
      .filter((part) => part.length > 1)
      .flatMap((part) => findRanges(value, part));
  }

  const merged = mergeRanges(ranges);
  if (merged.length === 0) {
    return [{ highlighted: false, text: value }];
  }

  const parts: TextHighlightPart[] = [];
  let cursor = 0;
  for (const [from, to] of merged) {
    if (from > cursor) {
      parts.push({ highlighted: false, text: value.slice(cursor, from) });
    }
    parts.push({ highlighted: true, text: value.slice(from, to) });
    cursor = to;
  }
  if (cursor < value.length) {
    parts.push({ highlighted: false, text: value.slice(cursor) });
  }
  return parts;
}

function renderHighlight(el: HTMLElement, query: string, value: string): void {
  const fragment = document.createDocumentFragment();
  for (const part of getTextHighlightParts(query, value)) {
    if (!part.highlighted) {
      fragment.append(document.createTextNode(part.text));
      continue;
    }

    const span = document.createElement("span");
    span.className = "suggestion-highlight";
    span.textContent = part.text;
    fragment.append(span);
  }
  el.replaceChildren(fragment);
}

export function useTextHighlight(
  el: HTMLElement,
  { query, value }: { query: string; value: string },
) {
  renderHighlight(el, query, value);
  return {
    update({ query, value }: { query: string; value: string }) {
      renderHighlight(el, query, value);
    },
  };
}
