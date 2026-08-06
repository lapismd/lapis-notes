import type {
  LanguageServicePosition,
  LanguageServiceRange,
  VirtualDocument,
} from "./types";

export function createVirtualDocument(
  document: Omit<VirtualDocument, "version"> & { version?: number },
): VirtualDocument {
  return {
    ...document,
    version: document.version ?? 0,
  };
}

export function offsetToLanguageServicePosition(
  text: string,
  offset: number,
): LanguageServicePosition {
  const boundedOffset = Math.max(0, Math.min(offset, text.length));
  let line = 0;
  let lineStart = 0;
  for (let index = 0; index < boundedOffset; index += 1) {
    if (text[index] === "\n") {
      line += 1;
      lineStart = index + 1;
    }
  }
  return { line, character: boundedOffset - lineStart };
}

export function languageServicePositionToOffset(
  text: string,
  position: LanguageServicePosition,
): number {
  const targetLine = Math.max(0, position.line);
  const targetCharacter = Math.max(0, position.character);
  let line = 0;
  let lineStart = 0;
  for (let index = 0; index < text.length && line < targetLine; index += 1) {
    if (text[index] === "\n") {
      line += 1;
      lineStart = index + 1;
    }
  }
  const lineEnd = text.indexOf("\n", lineStart);
  const end = lineEnd === -1 ? text.length : lineEnd;
  return Math.min(lineStart + targetCharacter, end);
}

export function languageServiceRangeToOffsets(
  text: string,
  range: LanguageServiceRange,
): { from: number; to: number } {
  return {
    from: languageServicePositionToOffset(text, range.start),
    to: languageServicePositionToOffset(text, range.end),
  };
}

export function offsetsToLanguageServiceRange(
  text: string,
  from: number,
  to: number,
): LanguageServiceRange {
  return {
    start: offsetToLanguageServicePosition(text, from),
    end: offsetToLanguageServicePosition(text, to),
  };
}
