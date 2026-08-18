export function toSingleReplacement(
  before: string,
  after: string,
): { from: number; to: number; insert: string } | null {
  if (before === after) {
    return null;
  }

  let start = 0;
  while (
    start < before.length &&
    start < after.length &&
    before[start] === after[start]
  ) {
    start += 1;
  }

  let beforeEnd = before.length;
  let afterEnd = after.length;
  while (
    beforeEnd > start &&
    afterEnd > start &&
    before[beforeEnd - 1] === after[afterEnd - 1]
  ) {
    beforeEnd -= 1;
    afterEnd -= 1;
  }

  return {
    from: start,
    to: beforeEnd,
    insert: after.slice(start, afterEnd),
  };
}

export function offsetToPosition(
  text: string,
  offset: number,
): { line: number; character: number } {
  const clamped = Math.max(0, Math.min(offset, text.length));
  let line = 0;
  let lastBreak = 0;
  for (let index = 0; index < clamped; index += 1) {
    if (text[index] === "\n") {
      line += 1;
      lastBreak = index + 1;
    }
  }
  return { line, character: clamped - lastBreak };
}

export function rangesIntersect(
  left: { start: { line: number; character: number }; end: { line: number; character: number } },
  right: { start: { line: number; character: number }; end: { line: number; character: number } },
): boolean {
  return comparePosition(left.start, right.end) <= 0 &&
    comparePosition(right.start, left.end) <= 0;
}

function comparePosition(
  left: { line: number; character: number },
  right: { line: number; character: number },
): number {
  if (left.line !== right.line) {
    return left.line - right.line;
  }
  return left.character - right.character;
}
