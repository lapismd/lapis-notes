import { matchesEditorAssociationGlob } from "@lapis-notes/api";
import type { MarkdownLintSettings } from "./settings";

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

export function shouldLintMarkdownPath(
  path: string | null,
  settings: MarkdownLintSettings,
): boolean {
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
