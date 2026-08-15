import type { TFile } from "$lib/storage/fs";
import type { App } from "$lib/context.svelte";
import { resolveApplication } from "$lib/application-compatibility";

const IMAGE_EMBED_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "bmp",
  "ico",
  "tif",
  "tiff",
  "avif",
  "apng",
]);

export type VaultFilePredicate = (file: TFile) => boolean;

/** Markdown notes only — useful for wiki-link targets. */
export function markdownNotesVaultFilter(file: TFile): boolean {
  const ext = file.extension.toLowerCase();
  return ext === "md" || ext === "markdown";
}

/**
 * Common raster / SVG extensions suitable for embed completions (![[...]]).
 * Aligns with plugin-markdown media MIME keys where practical.
 */
export function embeddableMediaVaultFilter(file: TFile): boolean {
  return IMAGE_EMBED_EXTENSIONS.has(file.extension.toLowerCase());
}

/**
 * True when `linkPath` (wiki target or path string) uses an image-like
 * extension. Replaces plugin-local string checks against `isImageAsset`.
 */
export function isImageEmbedLinkPath(linkPath: string): boolean {
  const index = linkPath.lastIndexOf(".");
  if (index === -1) {
    return false;
  }
  return IMAGE_EMBED_EXTENSIONS.has(linkPath.slice(index + 1).toLowerCase());
}

export interface VaultFilesPathMatchOptions {
  /** Application that owns the vault. */
  app?: App;
  filter?: VaultFilePredicate;
  /** Max matches (default 150). */
  limit?: number;
}

/**
 * Vault files whose path contains `query`, optionally filtered, capped for UI
 * performance.
 */
export function vaultFilesMatchingPathSubstring(
  query: string,
  options: VaultFilesPathMatchOptions = {},
): TFile[] {
  const limit = options.limit ?? 150;
  const filter = options.filter;
  const application = resolveApplication(options.app);
  return application.vault
    .getFiles()
    .filter((file) => {
      if (filter && !filter(file)) return false;
      return file.path.includes(query);
    })
    .slice(0, limit);
}
