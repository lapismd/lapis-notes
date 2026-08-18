import { matchesEditorAssociationGlob } from "@lapis-notes/api";
import type { SpellcheckFileType, SpellcheckSettings } from "./settings";

export function vaultPathFromDocumentUri(uri: string): string | null {
  if (!uri.startsWith("vault:///")) {
    return null;
  }

  try {
    const path = decodeURI(uri.slice("vault:///".length)).trim();
    return path.length > 0 ? path : null;
  } catch {
    return null;
  }
}

export function fileTypeFromPath(path: string | null): SpellcheckFileType {
  if (!path) {
    return "markdown";
  }
  return /\.(txt|text)$/iu.test(path) ? "plaintext" : "markdown";
}

export function shouldCheckSpellcheckPath(
  path: string | null,
  settings: SpellcheckSettings,
): boolean {
  if (!settings.automaticChecking) {
    return false;
  }

  const fileType = fileTypeFromPath(path);
  if (!settings.enabledFileTypes.includes(fileType)) {
    return false;
  }

  if (!path) {
    return true;
  }

  if (
    settings.excludeGlobs.some((pattern) =>
      matchesEditorAssociationGlob(pattern, path),
    )
  ) {
    return false;
  }

  if (
    settings.includeGlobs.length > 0 &&
    !settings.includeGlobs.some((pattern) =>
      matchesEditorAssociationGlob(pattern, path),
    )
  ) {
    return false;
  }

  return true;
}

export function documentExceedsMaxLength(
  text: string,
  maxFileLength: number,
): boolean {
  return new TextEncoder().encode(text).length > maxFileLength;
}
