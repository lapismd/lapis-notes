import type {
  PluginCatalogEntry,
  PluginCatalogRelease,
  PluginCompatibilityInput,
  PluginCompatibilityResult,
  PluginReleaseManifest,
} from "./types";

export const checkCatalogEntryCompatibility = (
  entry: PluginCatalogEntry,
  input: PluginCompatibilityInput,
): PluginCompatibilityResult =>
  checkBaseCompatibility(
    entry.minAppVersion,
    entry.platforms,
    false,
    false,
    false,
    input,
  );

export const checkCatalogReleaseCompatibility = (
  release: PluginCatalogRelease,
  input: PluginCompatibilityInput,
): PluginCompatibilityResult =>
  checkBaseCompatibility(
    release.minAppVersion,
    release.platforms,
    false,
    false,
    Boolean(release.revoked),
    input,
  );

export const checkReleaseManifestCompatibility = (
  manifest: PluginReleaseManifest,
  input: PluginCompatibilityInput,
): PluginCompatibilityResult =>
  checkBaseCompatibility(
    manifest.compatibility.minAppVersion,
    manifest.compatibility.platforms,
    Boolean(manifest.compatibility.desktopOnly),
    Boolean(manifest.compatibility.requiresWorkspaceTrust),
    Boolean(manifest.revoked),
    input,
  );

const checkBaseCompatibility = (
  minAppVersion: string,
  platforms: string[],
  desktopOnly: boolean,
  requiresWorkspaceTrust: boolean,
  revoked: boolean,
  input: PluginCompatibilityInput,
): PluginCompatibilityResult => {
  const reasons: PluginCompatibilityResult["reasons"] = [];

  if (compareVersions(input.appVersion, minAppVersion) < 0) {
    reasons.push("app-version-too-old");
  }

  if (!platforms.includes(input.platform)) {
    reasons.push("platform-unsupported");
  }

  if (desktopOnly && input.platform === "web") {
    reasons.push("desktop-only");
  }

  if (requiresWorkspaceTrust && !input.workspaceTrusted) {
    reasons.push("workspace-trust-required");
  }

  if (revoked) {
    reasons.push("revoked");
  }

  return { compatible: reasons.length === 0, reasons };
};

export const compareVersions = (actual: string, required: string): number => {
  const actualParts = parseVersion(actual);
  const requiredParts = parseVersion(required);
  const length = Math.max(actualParts.length, requiredParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (actualParts[index] ?? 0) - (requiredParts[index] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }

  return 0;
};

const parseVersion = (version: string): number[] =>
  version
    .replace(/^[^\d]*/, "")
    .split(/[.+-]/)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
