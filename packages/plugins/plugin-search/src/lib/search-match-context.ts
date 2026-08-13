export interface SearchMatchContextWindow {
  start: number;
  end: number;
  ranges: Array<{ start: number; end: number }>;
}

export type SearchMatchContextDirection = "before" | "after";

function lineStartAt(source: string, offset: number): number {
  return source.lastIndexOf("\n", Math.max(0, offset - 1)) + 1;
}

function expandBefore(
  source: string,
  start: number,
  lineCount: number,
): number {
  let next = lineStartAt(source, start);
  for (let index = 0; index < lineCount && next > 0; index += 1) {
    next = lineStartAt(source, next - 1);
  }
  return next;
}

function expandAfter(source: string, end: number, lineCount: number): number {
  const currentLineEnd = source.indexOf("\n", Math.max(0, end));
  let next = currentLineEnd === -1 ? source.length : currentLineEnd;
  for (let index = 0; index < lineCount && next < source.length; index += 1) {
    const followingLineEnd = source.indexOf("\n", next + 1);
    next = followingLineEnd === -1 ? source.length : followingLineEnd;
  }
  return next;
}

export function expandSearchMatchContext(
  source: string,
  window: SearchMatchContextWindow,
  direction: SearchMatchContextDirection,
  lineCount = 2,
): SearchMatchContextWindow {
  const start = Math.max(0, Math.min(source.length, window.start));
  const end = Math.max(start, Math.min(source.length, window.end));
  return {
    start:
      direction === "before"
        ? expandBefore(source, start, Math.max(1, lineCount))
        : start,
    end:
      direction === "after"
        ? expandAfter(source, end, Math.max(1, lineCount))
        : end,
    ranges: window.ranges.map((range) => ({ ...range })),
  };
}

export function sliceSearchMatchContext(
  source: string,
  window: SearchMatchContextWindow,
): { text: string; ranges: Array<{ start: number; end: number }> } {
  const start = Math.max(0, Math.min(source.length, window.start));
  const end = Math.max(start, Math.min(source.length, window.end));
  return {
    text: source.slice(start, end),
    ranges: window.ranges
      .map((range) => ({
        start: Math.max(0, range.start - start),
        end: Math.min(end - start, range.end - start),
      }))
      .filter((range) => range.end > range.start),
  };
}
