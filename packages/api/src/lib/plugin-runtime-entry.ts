import type {
  LapisExtensionManifest,
  LapisPluginModuleFormat,
  LapisRuntimeEntryDescriptor,
} from "./lapis-extension";
import type { PluginManifest } from "./plugin";

export type PluginExecutionHostId =
  | "workspace"
  | "electron-renderer"
  | "electron-sidecar";

export interface SelectedPluginRuntimeEntry {
  host: PluginExecutionHostId;
  path: string;
  format: LapisPluginModuleFormat;
  fallbackPath?: string;
  sharedDependencies: string[];
  requiresReloadOnUpdate?: boolean;
  source: "lapis-runtime-entry" | "lapis-legacy-runtime" | "obsidian-main";
}

export function selectPluginRuntimeEntry(options: {
  manifest: PluginManifest;
  requestedHost: PluginExecutionHostId;
  supportsEsm: boolean;
  supportsNodeEsm: boolean;
  hasMainJs: boolean;
}): SelectedPluginRuntimeEntry | null {
  const lapis = isLapisRuntimeContainer(options.manifest.lapis)
    ? options.manifest.lapis
    : null;
  const structuredEntry = lapis
    ? selectStructuredEntry(lapis, options.requestedHost)
    : null;

  if (!lapis) {
    if (!options.hasMainJs) {
      return null;
    }
    return {
      host: options.requestedHost,
      path: "main.js",
      format: "commonjs",
      sharedDependencies: [],
      source: "obsidian-main",
    };
  }

  if (structuredEntry) {
    return selectDescriptorEntry(structuredEntry, {
      host: options.requestedHost,
      supportsEsm: options.supportsEsm,
      supportsNodeEsm: options.supportsNodeEsm,
      sharedDependencies:
        structuredEntry.sharedDependencies ??
        getSharedDependencyDefaults(lapis, options.requestedHost),
    });
  }

  const legacyEntry = selectLegacyEntry(lapis, options.requestedHost);
  if (legacyEntry) {
    return {
      host: options.requestedHost,
      path: legacyEntry,
      format: "commonjs",
      sharedDependencies: getSharedDependencyDefaults(
        lapis,
        options.requestedHost,
      ),
      source: "lapis-legacy-runtime",
    };
  }

  if (options.hasMainJs) {
    return {
      host: options.requestedHost,
      path: "main.js",
      format: "commonjs",
      sharedDependencies: getSharedDependencyDefaults(
        lapis,
        options.requestedHost,
      ),
      source: "obsidian-main",
    };
  }

  return null;
}

function selectDescriptorEntry(
  descriptor: LapisRuntimeEntryDescriptor,
  options: {
    host: PluginExecutionHostId;
    supportsEsm: boolean;
    supportsNodeEsm: boolean;
    sharedDependencies: string[];
  },
): SelectedPluginRuntimeEntry | null {
  if (
    (descriptor.format === "esm" && !options.supportsEsm) ||
    (descriptor.format === "node-esm" && !options.supportsNodeEsm)
  ) {
    if (!descriptor.fallbackPath) {
      return null;
    }
    return {
      host: options.host,
      path: descriptor.fallbackPath,
      format: "commonjs",
      fallbackPath: descriptor.fallbackPath,
      sharedDependencies: options.sharedDependencies,
      requiresReloadOnUpdate: descriptor.requiresReloadOnUpdate,
      source: "lapis-runtime-entry",
    };
  }

  return {
    host: options.host,
    path: descriptor.path,
    format: descriptor.format,
    fallbackPath: descriptor.fallbackPath,
    sharedDependencies: options.sharedDependencies,
    requiresReloadOnUpdate: descriptor.requiresReloadOnUpdate,
    source: "lapis-runtime-entry",
  };
}

function selectStructuredEntry(
  lapis: LapisExtensionManifest,
  host: PluginExecutionHostId,
): LapisRuntimeEntryDescriptor | null {
  const entries = lapis.runtime?.entries;
  if (!entries) {
    return null;
  }

  switch (host) {
    case "electron-renderer":
      return entries.electronRenderer ?? entries.workspace ?? null;
    case "electron-sidecar":
      return (
        entries.trustedDesktop ??
        entries.electronSidecar ??
        entries.desktop ??
        null
      );
    case "workspace":
    default:
      return entries.workspace ?? null;
  }
}

function selectLegacyEntry(
  lapis: LapisExtensionManifest,
  host: PluginExecutionHostId,
): string | null {
  const runtime = lapis.runtime;
  if (!runtime) {
    return null;
  }

  if (host === "electron-sidecar") {
    return normalizeRuntimePath(runtime.trustedDesktop ?? runtime.desktop);
  }

  return normalizeRuntimePath(runtime.workspace);
}

function getSharedDependencyDefaults(
  lapis: LapisExtensionManifest | null,
  host: PluginExecutionHostId,
): string[] {
  const sharedDependencies = lapis?.runtime?.sharedDependencies;
  if (!sharedDependencies) {
    return [];
  }

  switch (host) {
    case "electron-renderer":
      return normalizeStringArray(
        sharedDependencies.electronRenderer ?? sharedDependencies.workspace,
      );
    case "electron-sidecar":
      return normalizeStringArray(
        sharedDependencies.electronSidecar ?? sharedDependencies.desktop,
      );
    case "workspace":
    default:
      return normalizeStringArray(sharedDependencies.workspace);
  }
}

function normalizeRuntimePath(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [
    ...new Set(
      value.filter((item): item is string => typeof item === "string"),
    ),
  ];
}

function isLapisRuntimeContainer(
  value: unknown,
): value is LapisExtensionManifest {
  return isRecord(value) && value.manifestVersion === 1;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
