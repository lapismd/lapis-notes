import { pluginHostModuleRegistry } from "../generated/plugin-host-modules.schema.generated";
import {
  type LapisExtensionManifest,
  validateLapisManifest,
} from "../lapis-extension";
import { scanBarePluginDependencySpecifiers } from "../plugin-dependency-scanner";
import type { PluginManifest } from "../plugin";
import { canonicalJson } from "./canonical-json";
import type {
  PluginPlatform,
  PluginProvenance,
  PluginReleaseManifest,
  PluginReleaseRuntimeDiagnostic,
  PluginReleaseRuntimeDiagnosticCode,
  PluginReleaseRuntimeDiagnosticSeverity,
  PluginReleaseRuntimeEntryDescriptor,
  PluginReleaseRuntimeHost,
  PluginReleaseRuntimeMetadata,
} from "./types";

const runtimeHosts = [
  "workspace",
  "electronRenderer",
  "electronSidecar",
  "desktop",
  "trustedDesktop",
] as const satisfies readonly PluginReleaseRuntimeHost[];

type HostModuleSpecifier = keyof typeof pluginHostModuleRegistry;
type HostModuleRecord = (typeof pluginHostModuleRegistry)[HostModuleSpecifier];

export interface PluginReleaseRuntimeValidationOptions {
  releaseManifest: PluginReleaseManifest;
  pluginManifest: PluginManifest;
  files: ReadonlyMap<string, Uint8Array>;
  provenance?: PluginProvenance;
}

export interface PluginReleaseRuntimeValidationResult {
  diagnostics: PluginReleaseRuntimeDiagnostic[];
  errors: PluginReleaseRuntimeDiagnostic[];
  warnings: PluginReleaseRuntimeDiagnostic[];
}

export function validatePluginReleaseRuntime(
  options: PluginReleaseRuntimeValidationOptions,
): PluginReleaseRuntimeValidationResult {
  const diagnostics: PluginReleaseRuntimeDiagnostic[] = [];
  const official =
    options.provenance === "official" ||
    options.releaseManifest.channel === "official";
  const manifestRuntime = runtimeMetadataFromManifest(options.pluginManifest);
  const signedRuntime = normalizeRuntimeMetadata(
    options.releaseManifest.runtime,
  );

  if (options.pluginManifest.lapis) {
    const manifestDiagnostics = validateLapisManifest(
      options.releaseManifest.pluginId,
      options.pluginManifest.lapis,
    );
    if (manifestDiagnostics.length) {
      diagnostics.push(
        diagnostic(official, "lapis-manifest-invalid", {
          message: `Plugin ${options.releaseManifest.pluginId} has invalid Lapis runtime metadata.`,
          details: { diagnostics: manifestDiagnostics },
        }),
      );
    }
  }

  if (manifestRuntime && !signedRuntime) {
    diagnostics.push(
      diagnostic(official, "runtime-metadata-missing", {
        message: `Plugin ${options.releaseManifest.pluginId} declares Lapis runtime metadata that is not mirrored in the signed release manifest.`,
      }),
    );
  } else if (!manifestRuntime && signedRuntime) {
    diagnostics.push(
      diagnostic(official, "runtime-metadata-mismatch", {
        message: `Plugin ${options.releaseManifest.pluginId} signed release runtime metadata does not match manifest.json.`,
      }),
    );
  } else if (
    manifestRuntime &&
    signedRuntime &&
    canonicalJson(manifestRuntime) !== canonicalJson(signedRuntime)
  ) {
    diagnostics.push(
      diagnostic(official, "runtime-metadata-mismatch", {
        message: `Plugin ${options.releaseManifest.pluginId} signed release runtime metadata does not match manifest.json.`,
      }),
    );
  }

  const runtime = signedRuntime ?? manifestRuntime;
  if (!runtime?.entries) {
    if (official) {
      diagnostics.push(
        diagnostic(true, "runtime-legacy-commonjs", {
          message: `Official plugin ${options.releaseManifest.pluginId} must declare lapis.runtime.entries with an ESM workspace entry. CommonJS is reserved for legacy Obsidian-compatible plugins.`,
        }),
      );
    } else if (options.files.has("main.js")) {
      diagnostics.push(
        diagnostic(false, "runtime-legacy-commonjs", {
          message: `Plugin ${options.releaseManifest.pluginId} uses legacy CommonJS loading without signed structured runtime metadata.`,
          details: { path: "main.js" },
        }),
      );
    }
    return splitDiagnostics(diagnostics);
  }

  if (official) {
    const workspaceEntry = runtime.entries.workspace;
    if (!workspaceEntry) {
      diagnostics.push(
        diagnostic(true, "runtime-metadata-missing", {
          message: `Official plugin ${options.releaseManifest.pluginId} must declare runtime.entries.workspace for ESM-first loading.`,
        }),
      );
    } else {
      if (workspaceEntry.format !== "esm") {
        diagnostics.push(
          diagnostic(true, "runtime-entry-format-mismatch", {
            message: `Official plugin ${options.releaseManifest.pluginId} must use format \"esm\" for runtime.entries.workspace.`,
            details: {
              host: "workspace",
              path: workspaceEntry.path,
              format: workspaceEntry.format,
            },
          }),
        );
      }

      if (workspaceEntry.fallbackPath) {
        diagnostics.push(
          diagnostic(true, "runtime-commonjs-not-allowed", {
            message: `Official plugin ${options.releaseManifest.pluginId} declares CommonJS fallback ${workspaceEntry.fallbackPath}, but official external plugins must be ESM-only.`,
            details: { host: "workspace", path: workspaceEntry.fallbackPath },
          }),
        );
      }
    }

    for (const host of runtimeHosts) {
      const entry = runtime.entries[host];
      if (entry?.format === "commonjs") {
        diagnostics.push(
          diagnostic(true, "runtime-commonjs-not-allowed", {
            message: `Official plugin ${options.releaseManifest.pluginId} declares ${host} CommonJS runtime entry ${entry.path}, but official external plugins must be ESM-only.`,
            details: { host, path: entry.path },
          }),
        );
      }
    }
  }

  for (const host of runtimeHosts) {
    const entry = runtime.entries[host];
    if (!entry) {
      continue;
    }
    validateEntry({
      releaseManifest: options.releaseManifest,
      files: options.files,
      runtime,
      host,
      entry,
      official,
      diagnostics,
    });
  }

  return splitDiagnostics(diagnostics);
}

function validateEntry(options: {
  releaseManifest: PluginReleaseManifest;
  files: ReadonlyMap<string, Uint8Array>;
  runtime: PluginReleaseRuntimeMetadata;
  host: PluginReleaseRuntimeHost;
  entry: PluginReleaseRuntimeEntryDescriptor;
  official: boolean;
  diagnostics: PluginReleaseRuntimeDiagnostic[];
}): void {
  const { entry, diagnostics, official, host } = options;

  if (!options.files.has(entry.path)) {
    diagnostics.push(
      diagnostic(official, "runtime-entry-file-missing", {
        message: `Plugin ${options.releaseManifest.pluginId} declares ${host} runtime entry ${entry.path}, but that file is not in the verified release.`,
        details: { host, path: entry.path },
      }),
    );
  }
  if (!entryPathMatchesFormat(entry.path, entry.format)) {
    diagnostics.push(
      diagnostic(official, "runtime-entry-format-mismatch", {
        message: `Plugin ${options.releaseManifest.pluginId} declares ${entry.path} as ${entry.format}, but the file extension is not compatible with that module format.`,
        details: { host, path: entry.path, format: entry.format },
      }),
    );
  }

  if (entry.fallbackPath) {
    if (!options.files.has(entry.fallbackPath)) {
      diagnostics.push(
        diagnostic(official, "runtime-fallback-file-missing", {
          message: `Plugin ${options.releaseManifest.pluginId} declares CommonJS fallback ${entry.fallbackPath}, but that file is not in the verified release.`,
          details: { host, path: entry.fallbackPath },
        }),
      );
    }
    if (!commonJsPath(entry.fallbackPath)) {
      diagnostics.push(
        diagnostic(official, "runtime-fallback-format-mismatch", {
          message: `Plugin ${options.releaseManifest.pluginId} declares fallback ${entry.fallbackPath}, but fallbacks must be CommonJS .js or .cjs files.`,
          details: { host, path: entry.fallbackPath },
        }),
      );
    }
  }

  const declared = new Set([
    ...normalizeStringArray(entry.sharedDependencies),
    ...defaultSharedDependencies(options.runtime, host),
  ]);
  const used = new Set<string>();
  for (const path of [entry.path, entry.fallbackPath].filter(
    (value): value is string => Boolean(value),
  )) {
    const bytes = options.files.get(path);
    if (!bytes) {
      continue;
    }
    for (const specifier of scanBarePluginDependencySpecifiers(
      new TextDecoder().decode(bytes),
    )) {
      used.add(specifier);
    }
  }

  for (const specifier of new Set([...declared, ...used])) {
    validateHostDependency({
      specifier,
      host,
      releasePlatforms: options.releaseManifest.compatibility.platforms,
      official,
      diagnostics,
      declared: declared.has(specifier),
      pluginId: options.releaseManifest.pluginId,
      runtime: options.runtime,
    });
  }
}

function validateHostDependency(options: {
  specifier: string;
  host: PluginReleaseRuntimeHost;
  releasePlatforms: PluginPlatform[];
  official: boolean;
  diagnostics: PluginReleaseRuntimeDiagnostic[];
  declared: boolean;
  pluginId: string;
  runtime: PluginReleaseRuntimeMetadata;
}): void {
  const module = hostModule(options.specifier);
  if (!module) {
    options.diagnostics.push(
      diagnostic(options.official, "runtime-dependency-unknown", {
        message: `Plugin ${options.pluginId} references ${options.specifier}, which is not in the generated plugin host module catalogue.`,
        details: { host: options.host, specifier: options.specifier },
      }),
    );
    return;
  }

  if (!module.public) {
    options.diagnostics.push(
      diagnostic(options.official, "runtime-dependency-private", {
        message: `Plugin ${options.pluginId} references private host module ${options.specifier}.`,
        details: { host: options.host, specifier: options.specifier },
      }),
    );
  }

  const requiredPlatforms = requiredHostModulePlatforms(
    options.host,
    options.releasePlatforms,
  );
  const modulePlatforms = module.platforms as readonly string[];
  const missingPlatforms = requiredPlatforms.filter(
    (platform) => !modulePlatforms.includes(platform),
  );
  if (missingPlatforms.length) {
    options.diagnostics.push(
      diagnostic(options.official, "runtime-dependency-platform-unsupported", {
        message: `Plugin ${options.pluginId} references ${options.specifier}, but that host module is not available for ${options.host}.`,
        details: {
          host: options.host,
          specifier: options.specifier,
          requiredPlatforms,
          modulePlatforms: [...modulePlatforms],
          missingPlatforms,
        },
      }),
    );
  }

  if (!options.declared) {
    options.diagnostics.push(
      diagnostic(options.official, "runtime-dependency-undeclared", {
        message: `Plugin ${options.pluginId} imports ${options.specifier}, but it is not declared in the selected runtime entry sharedDependencies.`,
        details: { host: options.host, specifier: options.specifier },
      }),
    );
  }

  if ("deprecated" in module && module.deprecated) {
    const compatibilityOverride = deprecatedHostModuleOverrideApplies(
      options.runtime,
      options.host,
      options.specifier,
    );
    options.diagnostics.push(
      diagnostic(
        options.official && !compatibilityOverride,
        "runtime-dependency-deprecated",
        {
          message: `Plugin ${options.pluginId} references deprecated host module ${options.specifier}.`,
          details: {
            host: options.host,
            specifier: options.specifier,
            reason: "reason" in module ? module.reason : undefined,
            replacement:
              "replacement" in module ? module.replacement : undefined,
            compatibilityOverride: compatibilityOverride || undefined,
          },
        },
      ),
    );
  }
}

function diagnostic(
  official: boolean,
  code: PluginReleaseRuntimeDiagnosticCode,
  options: {
    message: string;
    details?: Record<string, unknown>;
    severity?: PluginReleaseRuntimeDiagnosticSeverity;
  },
): PluginReleaseRuntimeDiagnostic {
  return {
    severity: options.severity ?? (official ? "error" : "warning"),
    code,
    message: options.message,
    ...(options.details ? { details: options.details } : {}),
  };
}

function splitDiagnostics(
  diagnostics: PluginReleaseRuntimeDiagnostic[],
): PluginReleaseRuntimeValidationResult {
  return {
    diagnostics,
    errors: diagnostics.filter((item) => item.severity === "error"),
    warnings: diagnostics.filter((item) => item.severity === "warning"),
  };
}

function runtimeMetadataFromManifest(
  manifest: PluginManifest,
): PluginReleaseRuntimeMetadata | null {
  const runtime = manifest.lapis?.runtime;
  if (!runtime) {
    return null;
  }
  return normalizeRuntimeMetadata(runtime);
}

function normalizeRuntimeMetadata(
  runtime: LapisExtensionManifest["runtime"] | PluginReleaseRuntimeMetadata,
): PluginReleaseRuntimeMetadata | null {
  if (!runtime || typeof runtime !== "object") {
    return null;
  }
  const metadata: PluginReleaseRuntimeMetadata = {};
  const entries = isRecord(runtime.entries)
    ? normalizeRuntimeEntries(runtime.entries)
    : undefined;
  if (entries) {
    metadata.entries = entries;
  }
  const sharedDependencies = isRecord(runtime.sharedDependencies)
    ? normalizeSharedDependencyMap(runtime.sharedDependencies)
    : undefined;
  if (sharedDependencies) {
    metadata.sharedDependencies = sharedDependencies;
  }
  const compatibilityOverrides = isRecord(runtime.compatibilityOverrides)
    ? normalizeRuntimeCompatibilityOverrides(runtime.compatibilityOverrides)
    : undefined;
  if (compatibilityOverrides) {
    metadata.compatibilityOverrides = compatibilityOverrides;
  }
  return metadata.entries ||
    metadata.sharedDependencies ||
    metadata.compatibilityOverrides
    ? metadata
    : null;
}

function normalizeRuntimeEntries(
  entries: Record<string, unknown>,
): PluginReleaseRuntimeMetadata["entries"] | undefined {
  const normalized: PluginReleaseRuntimeMetadata["entries"] = {};
  for (const host of runtimeHosts) {
    const entry = entries[host];
    if (!isRecord(entry)) {
      continue;
    }
    if (
      typeof entry.path !== "string" ||
      (entry.format !== "esm" &&
        entry.format !== "commonjs" &&
        entry.format !== "node-esm")
    ) {
      continue;
    }
    normalized[host] = {
      path: entry.path,
      format: entry.format,
      ...(typeof entry.fallbackPath === "string"
        ? { fallbackPath: entry.fallbackPath }
        : {}),
      ...(Array.isArray(entry.sharedDependencies)
        ? {
            sharedDependencies: normalizeStringArray(entry.sharedDependencies),
          }
        : {}),
      ...(typeof entry.requiresReloadOnUpdate === "boolean"
        ? { requiresReloadOnUpdate: entry.requiresReloadOnUpdate }
        : {}),
    };
  }
  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeSharedDependencyMap(
  sharedDependencies: Record<string, unknown>,
): PluginReleaseRuntimeMetadata["sharedDependencies"] | undefined {
  const normalized: PluginReleaseRuntimeMetadata["sharedDependencies"] = {};
  for (const host of runtimeHosts) {
    const value = normalizeStringArray(sharedDependencies[host]);
    if (value.length) {
      normalized[host] = value;
    }
  }
  return Object.keys(normalized).length ? normalized : undefined;
}

function normalizeRuntimeCompatibilityOverrides(
  overrides: Record<string, unknown>,
): PluginReleaseRuntimeMetadata["compatibilityOverrides"] | undefined {
  const deprecatedHostModules = isRecord(overrides.deprecatedHostModules)
    ? normalizeSharedDependencyMap(overrides.deprecatedHostModules)
    : undefined;
  return deprecatedHostModules ? { deprecatedHostModules } : undefined;
}

function deprecatedHostModuleOverrideApplies(
  runtime: PluginReleaseRuntimeMetadata,
  host: PluginReleaseRuntimeHost,
  specifier: string,
): boolean {
  return Boolean(
    runtime.compatibilityOverrides?.deprecatedHostModules?.[host]?.includes(
      specifier,
    ),
  );
}

function defaultSharedDependencies(
  runtime: PluginReleaseRuntimeMetadata,
  host: PluginReleaseRuntimeHost,
): string[] {
  const sharedDependencies = runtime.sharedDependencies;
  if (!sharedDependencies) {
    return [];
  }
  switch (host) {
    case "electronRenderer":
      return normalizeStringArray(
        sharedDependencies.electronRenderer ?? sharedDependencies.workspace,
      );
    case "electronSidecar":
    case "trustedDesktop":
      return normalizeStringArray(
        sharedDependencies.electronSidecar ??
          sharedDependencies.trustedDesktop ??
          sharedDependencies.desktop,
      );
    case "desktop":
      return normalizeStringArray(sharedDependencies.desktop);
    case "workspace":
    default:
      return normalizeStringArray(sharedDependencies.workspace);
  }
}

function requiredHostModulePlatforms(
  host: PluginReleaseRuntimeHost,
  releasePlatforms: PluginPlatform[],
): Array<HostModuleRecord["platforms"][number]> {
  switch (host) {
    case "electronRenderer":
      return ["electron-renderer"];
    case "electronSidecar":
    case "desktop":
    case "trustedDesktop":
      return ["electron-sidecar"];
    case "workspace": {
      const platforms: Array<HostModuleRecord["platforms"][number]> = [];
      if (releasePlatforms.includes("web")) {
        platforms.push("web");
      }
      if (
        releasePlatforms.includes("electron") ||
        releasePlatforms.includes("desktop")
      ) {
        platforms.push("electron-renderer");
      }
      return platforms.length ? platforms : ["web", "electron-renderer"];
    }
  }
}

function hostModule(specifier: string): HostModuleRecord | null {
  return Object.hasOwn(pluginHostModuleRegistry, specifier)
    ? pluginHostModuleRegistry[specifier as HostModuleSpecifier]
    : null;
}

function entryPathMatchesFormat(
  path: string,
  format: PluginReleaseRuntimeEntryDescriptor["format"],
): boolean {
  switch (format) {
    case "esm":
    case "node-esm":
      return esmPath(path);
    case "commonjs":
      return commonJsPath(path);
  }
}

function esmPath(path: string): boolean {
  return /\.(?:mjs|es\.js)$/u.test(path);
}

function commonJsPath(path: string): boolean {
  return (
    /\.cjs$/u.test(path) || (/\.js$/u.test(path) && !/\.es\.js$/u.test(path))
  );
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
