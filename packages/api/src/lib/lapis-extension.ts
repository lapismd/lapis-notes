import type { Command, Hotkey } from "./command.svelte";
import type { HostedPluginCapability } from "./plugin-capability-facade";
import type { LanguageServiceProviderMetadata } from "./language-service";

export type LapisPluginClassification =
  | "obsidian-compatible"
  | "lapis-extension"
  | "hybrid";

export type LapisExtensionKind =
  | "workspace"
  | "browserWorker"
  | "trustedDesktop";

export type LapisExtensionRuntimeHost = "workspace" | "desktop";

export type LapisPluginModuleFormat = "esm" | "commonjs" | "node-esm";

export interface LapisRuntimeEntryDescriptor {
  path: string;
  format: LapisPluginModuleFormat;
  fallbackPath?: string;
  sharedDependencies?: string[];
  requiresReloadOnUpdate?: boolean;
}

export interface LapisRuntimeEntryMap {
  workspace?: LapisRuntimeEntryDescriptor;
  electronRenderer?: LapisRuntimeEntryDescriptor;
  electronSidecar?: LapisRuntimeEntryDescriptor;
  desktop?: LapisRuntimeEntryDescriptor;
  trustedDesktop?: LapisRuntimeEntryDescriptor;
}

export type LapisExtensionPermission =
  | "vault.read"
  | "vault.write"
  | "plugin.data"
  | "commands"
  | "notices"
  | "settings.read"
  | "metadata.query"
  | "events"
  | "logging";

export interface LapisCommandContribution {
  command: string;
  title: string;
  category?: string;
  icon?: string;
  when?: string;
  hotkeys?: Hotkey[];
  activationEvent?: string;
  argumentSchema?: Record<string, unknown>;
}

export interface LapisConfigurationContribution {
  id?: string;
  title?: string;
  properties?: Record<string, unknown>;
}

export interface LapisLanguageContribution {
  id: string;
  aliases?: string[];
  extensions?: string[];
  filenames?: string[];
  mimetypes?: string[];
}

export interface LapisViewContribution {
  id: string;
  name: string;
  icon?: string;
  side?: "left" | "right";
  activationEvent?: string;
}

export interface LapisEditorViewContribution {
  id: string;
  viewType?: string;
  label: string;
  description?: string;
  filenamePatterns: string[];
  priority?: "default" | "option" | "exclusive";
  pluginId?: string;
  source?: "core" | "plugin" | "manifest" | "compat";
  activationEvent?: string;
}

export interface LapisServiceContribution {
  id: string;
  service: string;
  languages?: string[];
  runtime?: LapisExtensionRuntimeHost | string;
  priority?: number;
  capabilities?: Record<string, boolean>;
  activationEvent?: string;
  permissions?: LapisExtensionPermission[];
}

export interface LapisNotebookRendererContribution {
  id: string;
  displayName: string;
  mimeTypes?: string[];
  activationEvent?: string;
}

export interface LapisMarkdownPostProcessorContribution {
  id: string;
  language?: string;
  sortOrder?: number;
  activationEvent?: string;
}

export interface LapisStatusBarItemContribution {
  id: string;
  text?: string;
  icon?: string;
  alignment?: "left" | "right";
  priority?: number;
  tooltip?: string;
  command?: string;
  when?: string;
}

export interface LapisExtensionContributions {
  commands?: LapisCommandContribution[];
  configuration?: LapisConfigurationContribution[];
  languages?: LapisLanguageContribution[];
  views?: LapisViewContribution[];
  editorViews?: LapisEditorViewContribution[];
  services?: LapisServiceContribution[];
  notebookRenderers?: LapisNotebookRendererContribution[];
  markdownPostProcessors?: LapisMarkdownPostProcessorContribution[];
  statusBarItems?: LapisStatusBarItemContribution[];
}

export interface LapisExtensionManifest {
  manifestVersion: 1;
  extensionKind?: LapisExtensionKind[];
  contributes?: LapisExtensionContributions;
  activationEvents?: string[];
  runtime?: {
    workspace?: string;
    desktop?: string;
    trustedDesktop?: string;
    entries?: LapisRuntimeEntryMap;
    sharedDependencies?: {
      workspace?: string[];
      electronRenderer?: string[];
      electronSidecar?: string[];
      desktop?: string[];
    };
    compatibilityOverrides?: {
      deprecatedHostModules?: {
        workspace?: string[];
        electronRenderer?: string[];
        electronSidecar?: string[];
        desktop?: string[];
        trustedDesktop?: string[];
      };
    };
  };
  permissions?: LapisExtensionPermission[];
  source?: "community" | "official" | "system";
  enabled?: boolean;
  locked?: boolean;
  enabledByDefault?: boolean;
}

export type LapisBuiltInContributionKind =
  keyof Required<LapisExtensionContributions>;

export type LapisContributionKind =
  | LapisBuiltInContributionKind
  | (string & {});

export interface LapisContributionIndexEntry<T = unknown> {
  pluginId: string;
  kind: LapisContributionKind;
  id: string;
  manifestPath: string;
  contribution: T;
  activationEvent?: string;
  runtimeHost?: string;
  requiredPermissions: LapisExtensionPermission[];
  state: "valid" | "invalid";
  diagnostics: string[];
}

interface LapisContributionPointIndexOptions {
  pluginId: string;
  manifestPath: string;
  value: unknown;
}

interface LapisContributionEntryOptions<T> {
  pluginId: string;
  manifestPath: string;
  index: number;
  contribution: T;
}

export interface LapisContributionPointDescriptor {
  kind: LapisBuiltInContributionKind;
  manifestInstallable: boolean;
  activationEvent?: (entry: LapisContributionIndexEntry) => string | undefined;
  index(
    options: LapisContributionPointIndexOptions,
  ): LapisContributionIndexEntry[];
}

export interface LapisIndexedExtension {
  pluginId: string;
  name?: string;
  source: "community" | "official" | "system";
  classification: LapisPluginClassification;
  manifestPath: string;
  activationEvents: string[];
  runtime: LapisExtensionManifest["runtime"];
  permissions: LapisExtensionPermission[];
  requestedCapabilities: HostedPluginCapability[];
  grantedCapabilities: HostedPluginCapability[];
  enabled: boolean;
  locked: boolean;
  enabledByDefault: boolean;
  activationErrors: string[];
  contributions: LapisContributionIndexEntry[];
  privileges: string[];
}

export interface LapisServiceProviderRegistration {
  pluginId: string;
  service: string;
  id: string;
  metadata?: LanguageServiceProviderMetadata | Record<string, unknown>;
  provider: unknown;
  dispose?: () => void | Promise<void>;
}

export interface LapisSystemServiceProviderRegistration {
  id: string;
  service: string;
  metadata?: LanguageServiceProviderMetadata | Record<string, unknown>;
  provider?: unknown;
  createProvider?: (app: import("./context.svelte").App) => unknown;
  dispose?: () => void | Promise<void>;
}

export interface LapisSystemExtensionRegistration {
  manifest: {
    id: string;
    name: string;
    author?: string;
    version: string;
    minAppVersion?: string;
    description?: string;
    lapis: LapisExtensionManifest;
  };
  plugin?: new (
    app: import("./context.svelte").App,
  ) => import("./plugin").Plugin;
  basePath?: string;
  enabledByDefault?: boolean;
  locked?: boolean;
  privileges?: string[];
  serviceProviders?: LapisSystemServiceProviderRegistration[];
}

export function isLapisManifest(
  value: unknown,
): value is LapisExtensionManifest {
  if (!isRecord(value)) {
    return false;
  }
  return value.manifestVersion === 1;
}

export function classifyLapisPlugin(
  manifest: { lapis?: unknown },
  options: { hasMainJs?: boolean } = {},
): LapisPluginClassification {
  if (!isRecord(manifest.lapis)) {
    return "obsidian-compatible";
  }
  if (options.hasMainJs || requiresObsidianMain(manifest.lapis)) {
    return "hybrid";
  }
  return "lapis-extension";
}

export function validateLapisManifest(
  pluginId: string,
  lapis: unknown,
): string[] {
  const diagnostics: string[] = [];
  if (!isRecord(lapis)) {
    diagnostics.push(`Plugin ${pluginId} has invalid lapis metadata`);
    return diagnostics;
  }
  if (lapis.manifestVersion !== 1) {
    diagnostics.push(
      `Plugin ${pluginId} declares unsupported lapis.manifestVersion`,
    );
  }
  if (
    lapis.extensionKind !== undefined &&
    !isStringArray(lapis.extensionKind)
  ) {
    diagnostics.push(`Plugin ${pluginId} has invalid lapis.extensionKind`);
  }
  if (
    lapis.activationEvents !== undefined &&
    !isStringArray(lapis.activationEvents)
  ) {
    diagnostics.push(`Plugin ${pluginId} has invalid lapis.activationEvents`);
  }
  if (lapis.permissions !== undefined && !isStringArray(lapis.permissions)) {
    diagnostics.push(`Plugin ${pluginId} has invalid lapis.permissions`);
  } else {
    const invalidPermissions = normalizeStringArray(lapis.permissions).filter(
      (permission) => permissionToCapability(permission) === null,
    );
    if (invalidPermissions.length) {
      diagnostics.push(
        `Plugin ${pluginId} declares unknown lapis.permissions: ${invalidPermissions.join(", ")}`,
      );
    }
  }
  if (lapis.contributes !== undefined && !isRecord(lapis.contributes)) {
    diagnostics.push(`Plugin ${pluginId} has invalid lapis.contributes`);
  }
  if (lapis.runtime !== undefined) {
    if (!isRecord(lapis.runtime)) {
      diagnostics.push(`Plugin ${pluginId} has invalid lapis.runtime`);
    } else {
      diagnostics.push(...validateLapisRuntime(pluginId, lapis.runtime));
    }
  }
  return diagnostics;
}

export function buildLapisContributionIndex(options: {
  pluginId: string;
  name?: string;
  manifestPath: string;
  classification: LapisPluginClassification;
  source: "community" | "official" | "system";
  lapis: LapisExtensionManifest;
  grantedCapabilities: HostedPluginCapability[];
  requestedCapabilities?: HostedPluginCapability[];
  privileges?: string[];
}): LapisIndexedExtension {
  const activationEvents = normalizeStringArray(options.lapis.activationEvents);
  const permissions = normalizePermissions(options.lapis.permissions);
  const contributions = (
    isRecord(options.lapis.contributes) ? options.lapis.contributes : {}
  ) as Record<string, unknown>;
  const indexedContributions = markDuplicateContributionEntries([
    ...BUILT_IN_CONTRIBUTION_POINT_DESCRIPTORS.flatMap((descriptor) =>
      descriptor.index({
        pluginId: options.pluginId,
        manifestPath: options.manifestPath,
        value: contributions[descriptor.kind],
      }),
    ),
    ...indexUnknownContributionKeys(
      options.pluginId,
      options.manifestPath,
      contributions,
    ),
  ]);

  return {
    pluginId: options.pluginId,
    name: options.name,
    source: options.source,
    classification: options.classification,
    manifestPath: options.manifestPath,
    activationEvents,
    runtime: options.lapis.runtime,
    permissions,
    requestedCapabilities:
      options.requestedCapabilities ?? permissionsToCapabilities(permissions),
    grantedCapabilities: options.grantedCapabilities,
    enabled: options.lapis.enabled ?? options.lapis.enabledByDefault ?? true,
    locked: options.lapis.locked ?? false,
    enabledByDefault: options.lapis.enabledByDefault ?? true,
    activationErrors: [],
    privileges: [...new Set(options.privileges ?? [])],
    contributions: indexedContributions,
  };
}

export function getLapisContributionPointDescriptor(
  kind: string,
): LapisContributionPointDescriptor | undefined {
  return CONTRIBUTION_POINT_DESCRIPTOR_BY_KIND.get(kind);
}

export function getLapisContributionPointDescriptors(): readonly LapisContributionPointDescriptor[] {
  return BUILT_IN_CONTRIBUTION_POINT_DESCRIPTORS;
}

export function getLapisWorkspaceEntry(
  lapis: LapisExtensionManifest | undefined,
): string | null {
  if (!lapis?.runtime) {
    return null;
  }
  return typeof lapis.runtime.workspace === "string" &&
    lapis.runtime.workspace.trim()
    ? lapis.runtime.workspace
    : null;
}

export function getLapisDesktopEntry(
  lapis: LapisExtensionManifest | undefined,
): string | null {
  if (!lapis?.runtime) {
    return null;
  }
  const entry = lapis.runtime.trustedDesktop ?? lapis.runtime.desktop;
  return typeof entry === "string" && entry.trim() ? entry : null;
}

export function permissionsToCapabilities(
  permissions: readonly string[] | undefined,
): HostedPluginCapability[] {
  const capabilities = new Set<HostedPluginCapability>();
  for (const permission of permissions ?? []) {
    const capability = permissionToCapability(permission);
    if (capability) {
      capabilities.add(capability);
    }
  }
  return [...capabilities];
}

export function activationEventForContribution(
  pluginId: string,
  entry: LapisContributionIndexEntry,
): string | undefined {
  if (entry.activationEvent) {
    return entry.activationEvent;
  }
  return getLapisContributionPointDescriptor(entry.kind)?.activationEvent?.(
    entry,
  );
}

export function commandContributionToCommand(
  contribution: LapisCommandContribution,
): Command {
  return {
    id: contribution.command,
    title: contribution.title,
    category: contribution.category,
    name: contribution.category
      ? `${contribution.category}: ${contribution.title}`
      : contribution.title,
    icon: contribution.icon,
    when: contribution.when,
    hotkeys: contribution.hotkeys,
    argumentSchema: contribution.argumentSchema,
  };
}

export function normalizeManifestCommandId(
  pluginId: string,
  commandId: string,
): string {
  return commandId.startsWith(`${pluginId}:`)
    ? commandId
    : `${pluginId}:${commandId}`;
}

const BUILT_IN_CONTRIBUTION_POINT_DESCRIPTORS: readonly LapisContributionPointDescriptor[] =
  [
    createContributionPointDescriptor<LapisCommandContribution>({
      kind: "commands",
      manifestInstallable: true,
      validationMessage:
        "expected an object with string `command` and `title` fields",
      isContribution: isCommandContribution,
      activationEvent: (entry) => `onCommand:${entry.id}`,
      buildEntry: ({ contribution }) => ({
        id: contribution.command,
        contribution,
        activationEvent: contribution.activationEvent,
        requiredPermissions: ["commands"],
      }),
    }),
    createContributionPointDescriptor<LapisConfigurationContribution>({
      kind: "configuration",
      manifestInstallable: true,
      validationMessage: "expected an object contribution record",
      isContribution: isRecord,
      buildEntry: ({ pluginId, index, contribution }) => ({
        id: String(contribution.id ?? `${pluginId}.configuration.${index}`),
        contribution,
        requiredPermissions: [],
      }),
    }),
    createContributionPointDescriptor<LapisLanguageContribution>({
      kind: "languages",
      manifestInstallable: false,
      validationMessage: "expected an object with a string `id` field",
      isContribution: isLanguageContribution,
      activationEvent: (entry) => `onLanguage:${entry.id}`,
      buildEntry: ({ contribution }) => ({
        id: contribution.id,
        contribution,
        requiredPermissions: [],
      }),
    }),
    createContributionPointDescriptor<LapisViewContribution>({
      kind: "views",
      manifestInstallable: false,
      validationMessage:
        "expected an object with string `id` and `name` fields",
      isContribution: isViewContribution,
      activationEvent: (entry) => `onView:${entry.id}`,
      buildEntry: ({ contribution }) => ({
        id: contribution.id,
        contribution,
        activationEvent: contribution.activationEvent,
        requiredPermissions: [],
      }),
    }),
    createContributionPointDescriptor<LapisEditorViewContribution>({
      kind: "editorViews",
      manifestInstallable: true,
      validationMessage:
        "expected an object with string `id`, string `label`, and non-empty string array `filenamePatterns` fields",
      isContribution: isEditorViewContribution,
      activationEvent: (entry) => {
        const contribution = entry.contribution as LapisEditorViewContribution;
        return `onView:${contribution.viewType ?? contribution.id}`;
      },
      buildEntry: ({ contribution }) => ({
        id: contribution.id,
        contribution,
        activationEvent: contribution.activationEvent,
        requiredPermissions: [],
      }),
    }),
    createContributionPointDescriptor<LapisServiceContribution>({
      kind: "services",
      manifestInstallable: false,
      validationMessage:
        "expected an object with string `id` and `service` fields",
      isContribution: isServiceContribution,
      activationEvent: (entry) => `onService:${entry.id}`,
      buildEntry: ({ contribution }) => ({
        id: contribution.id,
        contribution,
        activationEvent: contribution.activationEvent,
        runtimeHost: contribution.runtime,
        requiredPermissions: normalizePermissions(contribution.permissions),
      }),
    }),
    createContributionPointDescriptor<LapisNotebookRendererContribution>({
      kind: "notebookRenderers",
      manifestInstallable: false,
      validationMessage:
        "expected an object with string `id` and `displayName` fields",
      isContribution: isNotebookRendererContribution,
      buildEntry: ({ contribution }) => ({
        id: contribution.id,
        contribution,
        activationEvent: contribution.activationEvent,
        requiredPermissions: [],
      }),
    }),
    createContributionPointDescriptor<LapisMarkdownPostProcessorContribution>({
      kind: "markdownPostProcessors",
      manifestInstallable: false,
      validationMessage: "expected an object with a string `id` field",
      isContribution: isMarkdownPostProcessorContribution,
      buildEntry: ({ contribution }) => ({
        id: contribution.id,
        contribution,
        activationEvent: contribution.activationEvent,
        requiredPermissions: [],
      }),
    }),
    createContributionPointDescriptor<LapisStatusBarItemContribution>({
      kind: "statusBarItems",
      manifestInstallable: true,
      validationMessage:
        "expected an object with string `id` plus at least one of `text` or `icon`",
      isContribution: isStatusBarItemContribution,
      buildEntry: ({ contribution }) => ({
        id: contribution.id,
        contribution,
        requiredPermissions: [],
      }),
    }),
  ] as const;

const CONTRIBUTION_POINT_DESCRIPTOR_BY_KIND: ReadonlyMap<
  string,
  LapisContributionPointDescriptor
> = new Map(
  BUILT_IN_CONTRIBUTION_POINT_DESCRIPTORS.map((descriptor) => [
    descriptor.kind,
    descriptor,
  ]),
);

function createContributionPointDescriptor<T>(options: {
  kind: LapisBuiltInContributionKind;
  manifestInstallable: boolean;
  validationMessage: string;
  isContribution(value: unknown): value is T;
  activationEvent?: (
    entry: LapisContributionIndexEntry<T>,
  ) => string | undefined;
  buildEntry(
    options: LapisContributionEntryOptions<T>,
  ): Omit<
    LapisContributionIndexEntry<T>,
    "pluginId" | "kind" | "manifestPath" | "state" | "diagnostics"
  >;
}): LapisContributionPointDescriptor {
  return {
    kind: options.kind,
    manifestInstallable: options.manifestInstallable,
    activationEvent:
      options.activationEvent as LapisContributionPointDescriptor["activationEvent"],
    index({ pluginId, manifestPath, value }) {
      if (value === undefined) {
        return [];
      }
      if (!Array.isArray(value)) {
        return [
          createInvalidContributionEntry({
            pluginId,
            manifestPath,
            kind: options.kind,
            id: options.kind,
            reason: `expected lapis.contributes.${options.kind} to be an array`,
            contribution: value,
          }),
        ];
      }

      return value.map((contribution, index) => {
        if (!options.isContribution(contribution)) {
          return createInvalidContributionEntry({
            pluginId,
            manifestPath,
            kind: options.kind,
            id: `${options.kind}[${index}]`,
            reason: options.validationMessage,
            contribution,
          });
        }

        return {
          pluginId,
          kind: options.kind,
          manifestPath,
          state: "valid",
          diagnostics: [],
          ...options.buildEntry({
            pluginId,
            manifestPath,
            index,
            contribution,
          }),
        };
      });
    },
  };
}

function createInvalidContributionEntry(options: {
  pluginId: string;
  manifestPath: string;
  kind: string;
  id: string;
  reason: string;
  contribution?: unknown;
}): LapisContributionIndexEntry<unknown> {
  return {
    pluginId: options.pluginId,
    kind: options.kind,
    id: options.id,
    manifestPath: options.manifestPath,
    contribution: options.contribution,
    requiredPermissions: [],
    state: "invalid",
    diagnostics: [
      `Plugin ${options.pluginId} has invalid lapis contribution ${options.kind}:${options.id} in ${options.manifestPath}: ${options.reason}`,
    ],
  };
}

function indexUnknownContributionKeys(
  pluginId: string,
  manifestPath: string,
  contributions: Record<string, unknown>,
): LapisContributionIndexEntry[] {
  return Object.keys(contributions)
    .filter((kind) => !CONTRIBUTION_POINT_DESCRIPTOR_BY_KIND.has(kind))
    .map((kind) => ({
      pluginId,
      kind,
      id: kind,
      manifestPath,
      contribution: contributions[kind],
      requiredPermissions: [],
      state: "invalid" as const,
      diagnostics: [
        `Plugin ${pluginId} declares unsupported lapis.contributes.${kind} in ${manifestPath}; add a contribution point descriptor before using it`,
      ],
    }));
}

function markDuplicateContributionEntries(
  entries: LapisContributionIndexEntry[],
): LapisContributionIndexEntry[] {
  const entriesByKey = new Map<string, LapisContributionIndexEntry[]>();

  for (const entry of entries) {
    if (entry.state !== "valid") {
      continue;
    }
    const key = `${entry.kind}:${entry.id}`;
    entriesByKey.set(key, [...(entriesByKey.get(key) ?? []), entry]);
  }

  for (const duplicates of entriesByKey.values()) {
    if (duplicates.length < 2) {
      continue;
    }
    for (const entry of duplicates) {
      entry.state = "invalid";
      entry.diagnostics.push(
        `Plugin ${entry.pluginId} declares duplicate lapis contribution ${entry.kind}:${entry.id} in ${entry.manifestPath}`,
      );
    }
  }

  return entries;
}

function requiresObsidianMain(lapis: Record<string, unknown>): boolean {
  const runtime = lapis.runtime;
  if (!isRecord(runtime)) {
    return false;
  }
  return (
    typeof runtime.workspace === "string" && runtime.workspace === "main.js"
  );
}

function validateLapisRuntime(
  pluginId: string,
  runtime: Record<string, unknown>,
): string[] {
  const diagnostics: string[] = [];
  for (const field of ["workspace", "desktop", "trustedDesktop"] as const) {
    if (runtime[field] !== undefined && typeof runtime[field] !== "string") {
      diagnostics.push(`Plugin ${pluginId} has invalid lapis.runtime.${field}`);
    }
  }

  if (runtime.entries !== undefined) {
    if (!isRecord(runtime.entries)) {
      diagnostics.push(`Plugin ${pluginId} has invalid lapis.runtime.entries`);
    } else {
      diagnostics.push(
        ...validateLapisRuntimeEntries(pluginId, runtime.entries),
      );
    }
  }

  if (runtime.sharedDependencies !== undefined) {
    if (!isRecord(runtime.sharedDependencies)) {
      diagnostics.push(
        `Plugin ${pluginId} has invalid lapis.runtime.sharedDependencies`,
      );
    } else {
      for (const field of [
        "workspace",
        "electronRenderer",
        "electronSidecar",
        "desktop",
      ] as const) {
        if (
          runtime.sharedDependencies[field] !== undefined &&
          !isStringArray(runtime.sharedDependencies[field])
        ) {
          diagnostics.push(
            `Plugin ${pluginId} has invalid lapis.runtime.sharedDependencies.${field}`,
          );
        }
      }
    }
  }

  if (runtime.compatibilityOverrides !== undefined) {
    if (!isRecord(runtime.compatibilityOverrides)) {
      diagnostics.push(
        `Plugin ${pluginId} has invalid lapis.runtime.compatibilityOverrides`,
      );
    } else {
      const deprecatedHostModules =
        runtime.compatibilityOverrides.deprecatedHostModules;
      if (deprecatedHostModules !== undefined) {
        if (!isRecord(deprecatedHostModules)) {
          diagnostics.push(
            `Plugin ${pluginId} has invalid lapis.runtime.compatibilityOverrides.deprecatedHostModules`,
          );
        } else {
          for (const field of [
            "workspace",
            "electronRenderer",
            "electronSidecar",
            "desktop",
            "trustedDesktop",
          ] as const) {
            if (
              deprecatedHostModules[field] !== undefined &&
              !isStringArray(deprecatedHostModules[field])
            ) {
              diagnostics.push(
                `Plugin ${pluginId} has invalid lapis.runtime.compatibilityOverrides.deprecatedHostModules.${field}`,
              );
            }
          }
        }
      }
    }
  }

  return diagnostics;
}

function validateLapisRuntimeEntries(
  pluginId: string,
  entries: Record<string, unknown>,
): string[] {
  const diagnostics: string[] = [];
  for (const field of [
    "workspace",
    "electronRenderer",
    "electronSidecar",
    "desktop",
    "trustedDesktop",
  ] as const) {
    const entry = entries[field];
    if (entry === undefined) {
      continue;
    }
    if (!isRecord(entry)) {
      diagnostics.push(
        `Plugin ${pluginId} has invalid lapis.runtime.entries.${field}`,
      );
      continue;
    }
    diagnostics.push(...validateLapisRuntimeEntry(pluginId, field, entry));
  }
  return diagnostics;
}

function validateLapisRuntimeEntry(
  pluginId: string,
  field: string,
  entry: Record<string, unknown>,
): string[] {
  const diagnostics: string[] = [];
  if (!isValidRuntimeEntryPath(entry.path)) {
    diagnostics.push(
      `Plugin ${pluginId} has invalid lapis.runtime.entries.${field}.path`,
    );
  }
  if (
    entry.format !== "esm" &&
    entry.format !== "commonjs" &&
    entry.format !== "node-esm"
  ) {
    diagnostics.push(
      `Plugin ${pluginId} has invalid lapis.runtime.entries.${field}.format`,
    );
  }
  if (
    entry.fallbackPath !== undefined &&
    !isValidRuntimeEntryPath(entry.fallbackPath)
  ) {
    diagnostics.push(
      `Plugin ${pluginId} has invalid lapis.runtime.entries.${field}.fallbackPath`,
    );
  }
  if (
    entry.sharedDependencies !== undefined &&
    !isStringArray(entry.sharedDependencies)
  ) {
    diagnostics.push(
      `Plugin ${pluginId} has invalid lapis.runtime.entries.${field}.sharedDependencies`,
    );
  }
  if (
    entry.requiresReloadOnUpdate !== undefined &&
    typeof entry.requiresReloadOnUpdate !== "boolean"
  ) {
    diagnostics.push(
      `Plugin ${pluginId} has invalid lapis.runtime.entries.${field}.requiresReloadOnUpdate`,
    );
  }
  return diagnostics;
}

function isValidRuntimeEntryPath(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const normalized = value.trim();
  return (
    normalized.length > 0 &&
    !normalized.startsWith("/") &&
    !normalized.split("/").includes("..") &&
    /\.(?:[cm]?js)$/u.test(normalized)
  );
}

function permissionToCapability(
  permission: string,
): HostedPluginCapability | null {
  switch (permission) {
    case "vault.read":
      return "vault:read";
    case "vault.write":
      return "vault:write";
    case "plugin.data":
      return "plugin:data";
    case "commands":
    case "notices":
    case "events":
    case "logging":
      return permission;
    case "settings.read":
      return "settings";
    case "metadata.query":
      return "metadata:query";
    default:
      return null;
  }
}

function normalizePermissions(
  permissions: readonly string[] | undefined,
): LapisExtensionPermission[] {
  return normalizeStringArray(permissions).filter(
    (permission): permission is LapisExtensionPermission =>
      permissionToCapability(permission) !== null,
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

function normalizeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCommandContribution(
  value: unknown,
): value is LapisCommandContribution {
  return (
    isRecord(value) &&
    typeof value.command === "string" &&
    typeof value.title === "string"
  );
}

function isLanguageContribution(
  value: unknown,
): value is LapisLanguageContribution {
  return isRecord(value) && typeof value.id === "string";
}

function isViewContribution(value: unknown): value is LapisViewContribution {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

function isEditorViewContribution(
  value: unknown,
): value is LapisEditorViewContribution {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    Array.isArray(value.filenamePatterns) &&
    value.filenamePatterns.length > 0 &&
    value.filenamePatterns.every((entry) => typeof entry === "string") &&
    (value.viewType === undefined || typeof value.viewType === "string") &&
    (value.description === undefined ||
      typeof value.description === "string") &&
    (value.priority === undefined ||
      value.priority === "default" ||
      value.priority === "option" ||
      value.priority === "exclusive") &&
    (value.activationEvent === undefined ||
      typeof value.activationEvent === "string")
  );
}

function isServiceContribution(
  value: unknown,
): value is LapisServiceContribution {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.service === "string"
  );
}

function isNotebookRendererContribution(
  value: unknown,
): value is LapisNotebookRendererContribution {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.displayName === "string"
  );
}

function isMarkdownPostProcessorContribution(
  value: unknown,
): value is LapisMarkdownPostProcessorContribution {
  return isRecord(value) && typeof value.id === "string";
}

function isStatusBarItemContribution(
  value: unknown,
): value is LapisStatusBarItemContribution {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    (typeof value.text === "string" || typeof value.icon === "string") &&
    (value.alignment === undefined ||
      value.alignment === "left" ||
      value.alignment === "right") &&
    (value.priority === undefined || typeof value.priority === "number") &&
    (value.tooltip === undefined || typeof value.tooltip === "string") &&
    (value.command === undefined || typeof value.command === "string") &&
    (value.when === undefined || typeof value.when === "string")
  );
}
