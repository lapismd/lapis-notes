import { Minimatch, type MinimatchOptions } from "minimatch";
import { Platform } from "./platform";

export type EditorAssociationGlobOptions = {
  caseSensitive?: boolean;
};

export type EditorAssociationGlobValidation =
  | { valid: true }
  | { valid: false; message: string };

const MAGIC_TOKEN_PATTERN = /\*\*|[*?{[]/gu;

function editorAssociationGlobOptions(
  pattern: string,
  options: EditorAssociationGlobOptions = {},
): MinimatchOptions {
  return {
    dot: true,
    magicalBraces: true,
    matchBase: !pattern.includes("/"),
    nocase:
      options.caseSensitive === undefined
        ? Platform.isMacOS || Platform.isWin
        : !options.caseSensitive,
    nocomment: true,
    noext: true,
    nonegate: true,
  };
}

export function normalizeGlobPath(path: string): string {
  return path.trim().replace(/\\+/gu, "/");
}

export function normalizeEditorAssociationGlob(pattern: string): string {
  return normalizeGlobPath(pattern);
}

function compileEditorAssociationGlob(
  pattern: string,
  options: EditorAssociationGlobOptions = {},
): Minimatch | null {
  const normalizedPattern = normalizeEditorAssociationGlob(pattern);
  if (!normalizedPattern) {
    return null;
  }

  try {
    const matcher = new Minimatch(
      normalizedPattern,
      editorAssociationGlobOptions(normalizedPattern, options),
    );
    return matcher.makeRe() ? matcher : null;
  } catch {
    return null;
  }
}

export function validateEditorAssociationGlob(
  pattern: string,
): EditorAssociationGlobValidation {
  if (!normalizeEditorAssociationGlob(pattern)) {
    return { valid: false, message: "Glob pattern must not be empty." };
  }

  if (!compileEditorAssociationGlob(pattern)) {
    return { valid: false, message: "Glob pattern is invalid." };
  }

  return { valid: true };
}

export function matchesEditorAssociationGlob(
  pattern: string,
  path: string,
  options: EditorAssociationGlobOptions = {},
): boolean {
  const matcher = compileEditorAssociationGlob(pattern, options);
  return matcher?.match(normalizeGlobPath(path)) ?? false;
}

export function hasEditorAssociationGlobMagic(pattern: string): boolean {
  return compileEditorAssociationGlob(pattern)?.hasMagic() ?? false;
}

function countMagicTokens(pattern: string): number {
  return (
    normalizeEditorAssociationGlob(pattern).match(MAGIC_TOKEN_PATTERN)
      ?.length ?? 0
  );
}

export function compareEditorAssociationPatternSpecificity(
  left: string,
  right: string,
): number {
  const leftExact = hasEditorAssociationGlobMagic(left) ? 0 : 1;
  const rightExact = hasEditorAssociationGlobMagic(right) ? 0 : 1;
  if (leftExact !== rightExact) {
    return leftExact - rightExact;
  }

  const leftLength = normalizeEditorAssociationGlob(left).length;
  const rightLength = normalizeEditorAssociationGlob(right).length;
  if (leftLength !== rightLength) {
    return leftLength - rightLength;
  }

  return countMagicTokens(right) - countMagicTokens(left);
}
