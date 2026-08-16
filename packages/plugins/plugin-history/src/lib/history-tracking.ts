import {
  isLapisInternalPath,
  matchesEditorAssociationGlob,
  normalizePath,
  type TFile,
} from "@lapis-notes/api";
import type { HistoryPluginSettings } from "./history-settings";

export const HISTORY_BINARY_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "avif",
  "bmp",
  "ico",
  "pdf",
  "zip",
  "gz",
  "tgz",
  "7z",
  "mp3",
  "mp4",
  "mov",
  "wav",
  "ogg",
  "woff",
  "woff2",
  "ttf",
  "otf",
]);

export function isHistoryTrackedFile(
  file: TFile,
  settings: HistoryPluginSettings,
): boolean {
  const path = normalizePath(file.path);
  if (isLapisInternalPath(path)) {
    return false;
  }

  if (file.stat.size > settings.maxFileSizeBytes) {
    return false;
  }

  const extension = file.extension.toLowerCase();
  if (HISTORY_BINARY_EXTENSIONS.has(extension)) {
    return false;
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

  if (settings.trackedExtensions.length === 0) {
    return true;
  }

  return settings.trackedExtensions.includes(extension);
}
