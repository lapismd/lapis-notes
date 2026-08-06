import { basename, dirname } from "./storage/path";
import { stripHeadingForLink } from "./utils";

export type NewLinkFormat = "shortest" | "relative" | "absolute";

export type LinkStyle = "wikilink" | "markdown";

export interface LinkSettings {
  newLinkFormat: NewLinkFormat;
  useWikilinks: boolean;
  omitMarkdownExtension: boolean;
  useShortestUniqueSuffix?: boolean;
}

export const defaultLinkSettings: LinkSettings = {
  newLinkFormat: "shortest",
  useWikilinks: true,
  omitMarkdownExtension: true,
  useShortestUniqueSuffix: false,
};

export interface VaultIndexFile {
  path: string;
  basename: string;
  extension: string;
}

export interface VaultIndex {
  getFiles(): VaultIndexFile[];
}

export interface GenerateLinkOptions {
  sourcePath: string;
  targetPath: string;
  alias?: string;
  embed?: boolean;
  heading?: string;
  blockId?: string;
  settings?: Partial<LinkSettings>;
  vaultIndex?: VaultIndex;
}

function splitVaultPath(path: string): string[] {
  return normalizeVaultPath(path).split("/").filter(Boolean);
}

function isMarkdownExtension(extension: string): boolean {
  return /^(md|markdown)$/i.test(extension);
}

function getFileExtension(path: string): string {
  const name = basename(normalizeVaultPath(path));
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0) {
    return "";
  }
  return name.slice(lastDot + 1);
}

function getFileBasename(path: string): string {
  const name = basename(normalizeVaultPath(path));
  const lastDot = name.lastIndexOf(".");
  if (lastDot <= 0) {
    return name;
  }
  return name.slice(0, lastDot);
}

function getMarkdownBasename(path: string): string {
  return basename(normalizeVaultPath(path)).replace(/\.(md|markdown)$/i, "");
}

function getPathSuffix(path: string, segmentCount: number): string {
  const parts = splitVaultPath(path);
  return parts.slice(-segmentCount).join("/");
}

function getSourceDirectory(sourcePath: string): string {
  const normalized = normalizeVaultPath(sourcePath);
  if (!normalized.length) {
    return "";
  }

  const directory = dirname(normalized);
  return directory === "/" ? "" : normalizeVaultPath(directory);
}

function applyMarkdownExtensionPreference(
  path: string,
  settings: LinkSettings,
): string {
  if (!settings.omitMarkdownExtension) {
    return path;
  }

  return normalizeVaultPath(path).replace(/\.(md|markdown)$/i, "");
}

function getAbsoluteLinkPath(
  targetPath: string,
  settings: LinkSettings,
): string {
  return applyMarkdownExtensionPreference(targetPath, settings);
}

function getRelativeLinkPath(
  targetPath: string,
  sourcePath: string,
  settings: LinkSettings,
): string {
  const targetParts = splitVaultPath(targetPath);
  const sourceParts = splitVaultPath(getSourceDirectory(sourcePath));

  let sharedLength = 0;
  while (
    sharedLength < sourceParts.length &&
    sharedLength < targetParts.length &&
    sourceParts[sharedLength] === targetParts[sharedLength]
  ) {
    sharedLength += 1;
  }

  const relativeParts = [
    ...sourceParts.slice(sharedLength).map(() => ".."),
    ...targetParts.slice(sharedLength),
  ];
  const relativePath = relativeParts.join("/");

  return applyMarkdownExtensionPreference(relativePath, settings);
}

function getObsidianCompatibleShortestPath(
  targetPath: string,
  settings: LinkSettings,
  vaultIndex: VaultIndex,
): string {
  const normalizedTarget = normalizeVaultPath(targetPath);
  const targetExtension = getFileExtension(normalizedTarget);
  const targetBase = isMarkdownExtension(targetExtension)
    ? getMarkdownBasename(normalizedTarget)
    : getFileBasename(normalizedTarget);
  const matches = vaultIndex
    .getFiles()
    .filter(
      (file) =>
        file.basename === targetBase &&
        file.extension.toLowerCase() === targetExtension.toLowerCase(),
    );

  if (matches.length === 1) {
    if (!targetExtension) {
      return targetBase;
    }
    return applyMarkdownExtensionPreference(
      `${targetBase}.${targetExtension}`,
      settings,
    );
  }

  return getAbsoluteLinkPath(normalizedTarget, settings);
}

function getShortestUniqueSuffixPath(
  targetPath: string,
  settings: LinkSettings,
  vaultIndex: VaultIndex,
): string {
  const normalizedTarget = normalizeVaultPath(targetPath);
  const targetExtension = getFileExtension(normalizedTarget);
  const targetBase = isMarkdownExtension(targetExtension)
    ? getMarkdownBasename(normalizedTarget)
    : getFileBasename(normalizedTarget);
  const matches = vaultIndex
    .getFiles()
    .filter(
      (file) =>
        file.basename === targetBase &&
        file.extension.toLowerCase() === targetExtension.toLowerCase(),
    );

  if (matches.length <= 1) {
    return getObsidianCompatibleShortestPath(
      normalizedTarget,
      settings,
      vaultIndex,
    );
  }

  const targetParts = splitVaultPath(normalizedTarget);
  for (
    let segmentCount = 1;
    segmentCount <= targetParts.length;
    segmentCount += 1
  ) {
    const suffix = getPathSuffix(normalizedTarget, segmentCount);
    const collisions = matches.filter(
      (file) => getPathSuffix(file.path, segmentCount) === suffix,
    );

    if (collisions.length === 1) {
      return applyMarkdownExtensionPreference(suffix, settings);
    }
  }

  return getAbsoluteLinkPath(normalizedTarget, settings);
}

function getResolvedSettings(settings?: Partial<LinkSettings>): LinkSettings {
  return {
    ...defaultLinkSettings,
    ...settings,
  };
}

function getLabelFromTargetPath(targetPath: string): string {
  const normalized = normalizeVaultPath(targetPath);
  const extension = getFileExtension(normalized);
  if (isMarkdownExtension(extension)) {
    return getMarkdownBasename(normalized);
  }
  return basename(normalized);
}

function getLinkFragment(options: GenerateLinkOptions): string {
  if (options.blockId?.trim()) {
    return `#^${options.blockId.trim()}`;
  }
  if (options.heading?.trim()) {
    return `#${stripHeadingForLink(options.heading)}`;
  }
  return "";
}

function escapeRegexChar(char: string): string {
  return `\\${char}`;
}

export function normalizeVaultPath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/$/, "");
}

export function escapeWikilinkPath(path: string): string {
  return path.replace(/[\\#[\]|]/g, escapeRegexChar);
}

export function escapeWikilinkAlias(alias: string): string {
  return alias.replace(/[\\[\]|]/g, escapeRegexChar);
}

export function encodeMarkdownLinkDestination(path: string): string {
  const [rawPath, rawFragment] = path.split("#", 2);
  const encodedPath = splitVaultPath(rawPath)
    .map((part) => encodeURIComponent(part))
    .join("/");

  if (rawFragment === undefined) {
    return encodedPath;
  }

  return `${encodedPath}#${encodeURIComponent(rawFragment)}`;
}

export function escapeMarkdownLabel(label: string): string {
  return label.replace(/[\\\[\]]/g, escapeRegexChar);
}

export function getLinkPath(
  targetPath: string,
  sourcePath: string,
  settings: LinkSettings,
  vaultIndex: VaultIndex,
): string {
  const normalizedTarget = normalizeVaultPath(targetPath);
  const normalizedSource = normalizeVaultPath(sourcePath);

  switch (settings.newLinkFormat) {
    case "absolute":
      return getAbsoluteLinkPath(normalizedTarget, settings);
    case "relative":
      return getRelativeLinkPath(normalizedTarget, normalizedSource, settings);
    case "shortest":
    default:
      if (settings.useShortestUniqueSuffix) {
        return getShortestUniqueSuffixPath(
          normalizedTarget,
          settings,
          vaultIndex,
        );
      }
      return getObsidianCompatibleShortestPath(
        normalizedTarget,
        settings,
        vaultIndex,
      );
  }
}

export function generateInternalLink(options: GenerateLinkOptions): string {
  const settings = getResolvedSettings(options.settings);
  const targetPath = normalizeVaultPath(options.targetPath);
  const linkPath = getLinkPath(
    targetPath,
    options.sourcePath,
    settings,
    options.vaultIndex ?? { getFiles: () => [] },
  );
  const fragment = getLinkFragment(options);

  if (settings.useWikilinks) {
    const target = `${escapeWikilinkPath(linkPath)}${fragment}`;
    const alias = options.alias?.trim();
    const display = alias ? `|${escapeWikilinkAlias(alias)}` : "";
    return `${options.embed ? "!" : ""}[[${target}${display}]]`;
  }

  const alias = options.alias?.trim();
  const label = escapeMarkdownLabel(
    alias || getLabelFromTargetPath(targetPath),
  );
  const destination = encodeMarkdownLinkDestination(`${linkPath}${fragment}`);
  return `${options.embed ? "!" : ""}[${label}](${destination})`;
}
