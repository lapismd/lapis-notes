export type PluginProvenance =
  | "bundled"
  | "official"
  | "community"
  | "manual"
  | "development";

export type RegistryTrustTier = "official" | "community" | "local";

export interface PluginRegistrySource {
  id: string;
  name: string;
  url: string;
  trustTier: RegistryTrustTier;
  enabled: boolean;
  builtin?: boolean;
}

export type PluginRegistryChannel = "official" | "community";
export type PluginCatalogStatus = "active" | "pending" | "revoked";

export type PluginPlatform = "web" | "electron" | "desktop";

export type PluginBadge =
  | "official"
  | "verified"
  | "community"
  | "desktop-only"
  | "requires-trust"
  | "update-available"
  | "revoked";

export interface PluginContributionSummary {
  commands?: Array<{ id: string; name: string }>;
  editorViews?: Array<{
    id: string;
    filenamePatterns?: string[];
    extensions?: string[];
    mimeTypes?: string[];
  }>;
  markdownProcessors?: Array<{ id: string; name?: string }>;
  notebookRenderers?: Array<{ id: string; name?: string }>;
  configuration?: Array<{ id: string; name?: string }>;
}

export interface PluginCatalogIndex {
  schemaVersion: 1;
  generatedAt: string;
  registries?: Record<string, { name: string; trustTier: RegistryTrustTier }>;
  plugins: PluginCatalogEntry[];
  signatures?: SignatureRecord[];
}

export interface PluginCatalogEntry {
  id: string;
  name: string;
  description: string;
  readmeUrl?: string;
  author: string;
  authorUrl?: string;
  channel: PluginRegistryChannel;
  status?: PluginCatalogStatus;
  latestVersion: string;
  minAppVersion: string;
  platforms: PluginPlatform[];
  categories: string[];
  badges?: PluginBadge[];
  latestRelease?: PluginCatalogLatestRelease;
  detail: string;
  contributes?: PluginContributionSummary;
}

export interface PluginCatalogLatestRelease {
  releasedAt: string;
  bundleSize: number;
}

export interface PluginCatalogDetail {
  schemaVersion: 1;
  id: string;
  name: string;
  description: string;
  readmeUrl?: string;
  channel: PluginRegistryChannel;
  status?: PluginCatalogStatus;
  owner: {
    name: string;
    verified?: boolean;
    url?: string;
  };
  latestVersion: string;
  license?: string;
  links?: PluginCatalogLinks;
  highlights?: string[];
  content?: PluginCatalogContent;
  readme?: RemoteFileReference;
  contributes?: PluginContributionSummary;
  versions: Record<string, PluginCatalogRelease>;
  signatures?: SignatureRecord[];
}

export interface PluginCatalogLinks {
  homepage?: string;
  repository?: string;
  documentation?: string;
  issues?: string;
}

export interface PluginMarkdownReference {
  url: string;
  sourceUrl: string;
  sha256: string;
  size: number;
  mediaType: "text/markdown";
}

export interface PluginCatalogContent {
  overview?: PluginMarkdownReference;
  changelog?: PluginMarkdownReference;
}

export interface PluginCatalogRelease {
  version: string;
  minAppVersion: string;
  releasedAt: string;
  platforms: PluginPlatform[];
  bundle: RemoteFileReference;
  revoked?: PluginRevocationRecord;
}

export interface RemoteFileReference {
  url: string;
  sha256: string;
  size?: number;
}

export interface PluginReleaseFile {
  path: string;
  sha256: string;
  size: number;
}

export type PluginReleaseRuntimeHost =
  | "workspace"
  | "electronRenderer"
  | "electronSidecar"
  | "desktop"
  | "trustedDesktop";

export type PluginReleaseModuleFormat = "esm" | "commonjs" | "node-esm";

export interface PluginReleaseRuntimeEntryDescriptor {
  path: string;
  format: PluginReleaseModuleFormat;
  fallbackPath?: string;
  sharedDependencies?: string[];
  requiresReloadOnUpdate?: boolean;
}

export interface PluginReleaseRuntimeMetadata {
  entries?: Partial<
    Record<PluginReleaseRuntimeHost, PluginReleaseRuntimeEntryDescriptor>
  >;
  sharedDependencies?: Partial<Record<PluginReleaseRuntimeHost, string[]>>;
  compatibilityOverrides?: PluginReleaseRuntimeCompatibilityOverrides;
}

export interface PluginReleaseRuntimeCompatibilityOverrides {
  deprecatedHostModules?: Partial<Record<PluginReleaseRuntimeHost, string[]>>;
}

export type PluginReleaseRuntimeDiagnosticSeverity = "error" | "warning";

export type PluginReleaseRuntimeDiagnosticCode =
  | "lapis-manifest-invalid"
  | "runtime-metadata-missing"
  | "runtime-metadata-mismatch"
  | "runtime-entry-file-missing"
  | "runtime-entry-format-mismatch"
  | "runtime-fallback-file-missing"
  | "runtime-fallback-format-mismatch"
  | "runtime-main-missing"
  | "runtime-commonjs-not-allowed"
  | "runtime-dependency-unknown"
  | "runtime-dependency-private"
  | "runtime-dependency-platform-unsupported"
  | "runtime-dependency-undeclared"
  | "runtime-dependency-deprecated"
  | "runtime-legacy-commonjs";

export interface PluginReleaseRuntimeDiagnostic {
  severity: PluginReleaseRuntimeDiagnosticSeverity;
  code: PluginReleaseRuntimeDiagnosticCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface SignedEnvelope<T> {
  signed: T;
  signatures: SignatureRecord[];
}

export interface SignatureRecord {
  keyId: string;
  alg: "ed25519";
  sig: string;
}

export interface TrustedSigningKey {
  keyId: string;
  alg: "ed25519";
  publicKey: string;
  trustTier: RegistryTrustTier;
  expiresAt?: string;
}

export interface PluginReleaseManifest {
  schemaVersion: 1;
  type: "lapis.plugin.release";
  pluginId: string;
  version: string;
  channel: PluginRegistryChannel;
  source?: {
    repo?: string;
    commit?: string;
    package?: string;
  };
  compatibility: {
    minAppVersion: string;
    platforms: PluginPlatform[];
    desktopOnly?: boolean;
    requiresWorkspaceTrust?: boolean;
  };
  runtime?: PluginReleaseRuntimeMetadata;
  files: PluginReleaseFile[];
  revoked?: PluginRevocationRecord;
}

export interface PluginRevocationRecord {
  revokedAt: string;
  reason: string;
  message?: string;
  replacementVersion?: string;
}

export interface PluginRevokedVersionRecord extends PluginRevocationRecord {
  pluginId: string;
  versions: string[];
}

export interface PluginRevocationIndex {
  schemaVersion: 1;
  generatedAt: string;
  revoked: PluginRevokedVersionRecord[];
  signatures?: SignatureRecord[];
}

export interface InstalledPluginsState {
  schemaVersion: 1;
  updatedAt: string;
  plugins: Record<string, InstalledPluginRecord>;
  migrations?: Record<string, InstalledPluginMigrationRecord>;
  [key: string]: unknown;
}

export interface InstalledPluginRecord {
  pluginId: string;
  installedVersion: string;
  installedAt: string;
  updatedAt: string;
  provenance: PluginProvenance;
  registryId?: string;
  registryUrl?: string;
  releaseManifestSha256?: string;
  files: Array<{
    path: string;
    sha256: string;
    size: number;
  }>;
  runtimeWarnings?: PluginReleaseRuntimeDiagnostic[];
  signature?: SignatureRecord;
  revoked?: PluginRevocationRecord;
  restartRequired?: boolean;
  [key: string]: unknown;
}

export interface InstalledPluginMigrationRecord {
  oldId?: string;
  newId?: string;
  dataMigratedAt?: string;
  source?: string;
}

export interface PluginCompatibilityInput {
  appVersion: string;
  platform: PluginPlatform;
  workspaceTrusted?: boolean;
}

export interface PluginCompatibilityResult {
  compatible: boolean;
  reasons: Array<
    | "app-version-too-old"
    | "platform-unsupported"
    | "desktop-only"
    | "workspace-trust-required"
    | "revoked"
  >;
}
