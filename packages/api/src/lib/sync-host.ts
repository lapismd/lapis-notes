import type {
  AppDatabase,
  AppDatabaseMetaMutation,
} from "./storage/app-database";
import { TFile } from "./storage/fs";
import type { VaultReadHandle } from "./storage/fs";
import type { Vault } from "./storage/vault.svelte";
import type { HostedPluginCapability } from "./plugin-capability-facade";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import {
  SyncHostSecurityService,
  type PluginNetworkCapability,
  type SyncCryptoCapability,
  type SyncCryptoEnrollmentRequest,
  type SyncCryptoStatus,
  type SyncIdentityCapability,
  type SyncHostSecurityOptions,
  type SyncMembershipCapability,
  type SyncPairingCapability,
  type SyncRecoveryCapability,
  type SyncWrappingKeyDescriptor,
} from "./sync-host-security";

const ROOT_PREFIX = "sync-host:v1:";
const DATABASE_GENERATION_KEY = `${ROOT_PREFIX}database-generation`;
const CHANGE_SEQUENCE_KEY = `${ROOT_PREFIX}change-sequence`;
const FILE_PREFIX = `${ROOT_PREFIX}file:`;
const PATH_PREFIX = `${ROOT_PREFIX}path:`;
const CHANGE_PREFIX = `${ROOT_PREFIX}change:`;
const LATEST_CHANGE_PREFIX = `${ROOT_PREFIX}latest-change:`;
const ALIAS_PREFIX = `${ROOT_PREFIX}alias:`;
const BINDING_PREFIX = `${ROOT_PREFIX}binding:`;
const GENERATED_PREFIX = `${ROOT_PREFIX}generated:`;
const MAX_PAGE_SIZE = 500;
const MAX_TRANSACTION_ATTEMPTS = 8;

export type HostFileIdentityState = "present" | "tombstoned";
export type HostFileChangeKind = "create" | "modify" | "rename" | "delete";

export interface HostFileIdentity {
  fileId: string;
  currentPath: string;
  state: HostFileIdentityState;
  createdAt: number;
  updatedAt: number;
  tombstonedAt?: number;
  lastObservedMtime?: number;
  lastObservedSize?: number;
  contentGeneration: number;
  lastChangeSequence: number;
  contentFingerprint?: string;
}

export interface HostFilePathAlias {
  fileId: string;
  path: string;
  firstSeenAt: number;
  lastSeenAt?: number;
  reason: "create" | "rename" | "move" | "scan-reconciliation" | "restore";
}

export interface HostChangeCursor {
  databaseGenerationId: string;
  sequence: number;
}

export interface HostFileChange {
  file: HostFileIdentity;
  kind: HostFileChangeKind;
  previousPath?: string;
  selfOriginated: boolean;
}

interface StoredHostFileChange extends Omit<HostFileChange, "selfOriginated"> {
  originId?: string;
  originPluginId?: string;
}

export interface HostChangedFileBatch {
  status: "ok" | "reset-required";
  databaseGenerationId: string;
  changes: HostFileChange[];
  nextCursor: HostChangeCursor;
  hasMore: boolean;
}

export interface ExternalFileIdentityBinding {
  namespace: string;
  externalFileId: string;
  localFileId: string;
  boundAt: number;
  updatedAt: number;
}

export interface OperationOrigin {
  readonly token: string;
}

export interface GeneratedStateRecord<T = unknown> {
  key: string;
  value: T;
  version: number;
  updatedAt: number;
}

export interface GeneratedStateMutation {
  type: "set" | "delete";
  key: string;
  value?: unknown;
}

export interface GeneratedStateTransaction {
  expectedRevision?: number;
  expectedSchemaVersion?: number;
  schemaVersion?: number;
  mutations: GeneratedStateMutation[];
}

export interface GeneratedStateTransactionResult {
  applied: boolean;
  revision: number;
  schemaVersion: number;
}

export interface GeneratedStatePage<T = unknown> {
  records: GeneratedStateRecord<T>[];
  nextCursor?: string;
}

export interface PluginGeneratedState {
  get<T = unknown>(key: string): Promise<GeneratedStateRecord<T> | null>;
  scan<T = unknown>(options?: {
    prefix?: string;
    after?: string;
    limit?: number;
  }): Promise<GeneratedStatePage<T>>;
  getRevision(): Promise<number>;
  getSchemaVersion(): Promise<number>;
  transact(
    transaction: GeneratedStateTransaction,
  ): Promise<GeneratedStateTransactionResult>;
  clear(): Promise<void>;
}

export interface SyncHostCapabilities {
  readonly files: {
    getIdentity(path: string): Promise<HostFileIdentity | null>;
    resolveIdentity(fileId: string): Promise<HostFileIdentity | null>;
    listChangedSince(
      cursor?: HostChangeCursor,
      options?: { limit?: number },
    ): Promise<HostChangedFileBatch>;
    getExternalBinding(
      externalFileId: string,
    ): Promise<ExternalFileIdentityBinding | null>;
    bindExternalIdentity(
      localFileId: string,
      externalFileId: string,
    ): Promise<ExternalFileIdentityBinding>;
  };
  readonly origins: {
    create(): Promise<OperationOrigin>;
  };
  readonly vault: {
    flushOpenEditor(
      path?: string,
    ): Promise<{ flushed: boolean; path?: string }>;
    openRead(
      path: string,
    ): Promise<VaultReadHandle & { fileId: string; contentGeneration: number }>;
    atomicWrite(
      path: string,
      source: ReadableStream<Uint8Array>,
      options?: {
        origin?: OperationOrigin;
        expectedFileId?: string;
        expectedContentGeneration?: number;
        signal?: AbortSignal;
      },
    ): Promise<HostFileIdentity>;
    remove(
      path: string,
      options?: {
        origin?: OperationOrigin;
        expectedFileId?: string;
        expectedContentGeneration?: number;
      },
    ): Promise<HostFileIdentity>;
  };
  readonly network: PluginNetworkCapability;
  readonly crypto: SyncCryptoCapability;
  readonly syncIdentity: SyncIdentityCapability;
  readonly pairing: SyncPairingCapability;
  readonly membership: SyncMembershipCapability;
  readonly recovery: SyncRecoveryCapability;
  readonly generatedState: PluginGeneratedState;
}

export interface SyncHostServiceOptions {
  flushOpenEditor?: (
    path?: string,
  ) => Promise<{ flushed: boolean; path?: string }>;
  security?: SyncHostSecurityOptions;
  /** Host UI/native adapter callback. It never becomes part of a plugin facade. */
  requestCryptoUnlock?: (
    pluginId: string,
    status: SyncCryptoStatus,
    enrollment?: SyncCryptoEnrollmentRequest,
  ) => Promise<void>;
  /** Host-owned passphrase or equivalent recovery-bundle interaction. */
  requestRecoveryPassphrase?: (
    pluginId: string,
    mode: "export" | "import",
  ) => Promise<string | null>;
  /** Host consent callback for an exact plugin network origin. */
  requestNetworkOriginGrant?: (request: {
    pluginId: string;
    origin: string;
    allowPrivateNetwork: boolean;
  }) => Promise<boolean>;
}

function randomId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  if (typeof crypto === "undefined") {
    throw new Error("Secure randomness is unavailable in this host");
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
    .slice(6, 8)
    .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function encodeKeyPart(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

async function hashKeyPart(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function sequenceKey(sequence: number, fileId: string): string {
  return `${CHANGE_PREFIX}${String(sequence).padStart(20, "0")}:${fileId}`;
}

function requireBoundedString(
  value: string,
  label: string,
  maximum = 256,
): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > maximum) {
    throw new Error(
      `${label} must contain between 1 and ${maximum} characters`,
    );
  }
  return normalized;
}

function requireGeneratedKey(key: string): string {
  const normalized = requireBoundedString(key, "Generated-state key", 160);
  if (!/^[A-Za-z0-9._:/-]+$/.test(normalized)) {
    throw new Error(
      "Generated-state keys may contain letters, digits, dot, underscore, colon, slash, and dash",
    );
  }
  return normalized;
}

function boundedLimit(limit = 100): number {
  return Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(limit)));
}

export class SyncHostService {
  readonly #ready: Promise<void>;
  #eventQueue: Promise<void> = Promise.resolve();
  readonly #runtimeIds = new Map<string, Set<string>>();
  readonly #origins = new Map<
    string,
    { pluginId: string; runtimeId: string }
  >();
  readonly #security: SyncHostSecurityService;

  constructor(
    readonly database: AppDatabase,
    readonly vault: Vault,
    readonly clock: () => number = Date.now,
    readonly options: SyncHostServiceOptions = {},
  ) {
    this.#security = new SyncHostSecurityService(
      database,
      (pluginId, runtimeId) => this.#assertRuntime(pluginId, runtimeId),
      options.security,
    );
    this.vault.on("all", (event, file, context) => {
      if (!(file instanceof TFile) || !this.#isChangeKind(event)) return;
      const previousPath =
        typeof context.oldPath === "string" ? context.oldPath : undefined;
      const originId =
        typeof context.operationOrigin === "string"
          ? context.operationOrigin
          : undefined;
      this.#eventQueue = this.#eventQueue
        .then(async () => {
          await this.#recordFileChange(event, file, previousPath, originId);
        })
        .catch(() => undefined);
    });
    this.#ready = this.#initialize();
  }

  async ready(): Promise<void> {
    await this.#ready;
    await this.#eventQueue;
  }

  forPlugin(
    pluginId: string,
    grantedCapabilities?: readonly HostedPluginCapability[],
  ): SyncHostCapabilities {
    const normalizedPluginId = requireBoundedString(pluginId, "Plugin ID", 128);
    const runtimeId = randomId();
    const runtimeIds = this.#runtimeIds.get(normalizedPluginId) ?? new Set();
    runtimeIds.add(runtimeId);
    this.#runtimeIds.set(normalizedPluginId, runtimeIds);
    const assertActive = () =>
      this.#assertRuntime(normalizedPluginId, runtimeId);
    const grants = grantedCapabilities ? new Set(grantedCapabilities) : null;
    const assertGranted = (capability: HostedPluginCapability) => {
      assertActive();
      if (grants && !grants.has(capability)) {
        throw new Error(
          `Plugin ${normalizedPluginId} is not granted ${capability}`,
        );
      }
    };
    return {
      files: {
        getIdentity: async (path) => {
          assertGranted("metadata:identity");
          await this.ready();
          return this.#getIdentityByPath(path);
        },
        resolveIdentity: async (fileId) => {
          assertGranted("metadata:identity");
          await this.ready();
          return this.#getIdentityById(fileId);
        },
        listChangedSince: async (cursor, options) => {
          assertGranted("metadata:changes");
          await this.ready();
          return this.#listChangedSince(
            normalizedPluginId,
            runtimeId,
            cursor,
            options?.limit,
          );
        },
        getExternalBinding: async (externalFileId) => {
          assertGranted("metadata:identity");
          await this.ready();
          return this.#getExternalBinding(normalizedPluginId, externalFileId);
        },
        bindExternalIdentity: async (localFileId, externalFileId) => {
          assertGranted("metadata:identity");
          await this.ready();
          return this.#bindExternalIdentity(
            normalizedPluginId,
            localFileId,
            externalFileId,
          );
        },
      },
      origins: {
        create: async () => {
          assertGranted("vault:stream");
          const token = randomId();
          this.#origins.set(token, { pluginId: normalizedPluginId, runtimeId });
          return Object.freeze({ token });
        },
      },
      vault: {
        flushOpenEditor: async (path) => {
          assertGranted("vault:stream");
          return (
            (await this.options.flushOpenEditor?.(path)) ?? {
              flushed: false,
              path,
            }
          );
        },
        openRead: async (path) => {
          assertGranted("vault:stream");
          await this.ready();
          const file = this.vault.getFileByPath(path);
          const identity = await this.#getIdentityByPath(path);
          if (!file || !identity || identity.state !== "present") {
            throw new Error(`Cannot stream missing file ${path}`);
          }
          return Object.assign(await this.vault.openRead(file), {
            fileId: identity.fileId,
            contentGeneration: identity.contentGeneration,
          });
        },
        atomicWrite: async (path, source, options = {}) => {
          assertGranted("vault:stream");
          await this.ready();
          const current = await this.#getIdentityByPath(path);
          if (
            options.expectedFileId !== undefined &&
            current?.fileId !== options.expectedFileId
          ) {
            throw new Error(
              `File identity changed before atomic write: ${path}`,
            );
          }
          if (
            options.expectedContentGeneration !== undefined &&
            current?.contentGeneration !== options.expectedContentGeneration
          ) {
            throw new Error(
              `File content generation changed before atomic write: ${path}`,
            );
          }
          if (options.origin) {
            const owner = this.#origins.get(options.origin.token);
            if (
              !owner ||
              owner.pluginId !== normalizedPluginId ||
              owner.runtimeId !== runtimeId
            ) {
              throw new Error(
                "Operation origin is invalid or belongs to another plugin runtime",
              );
            }
          }
          await this.vault.atomicWrite(path, source, {
            signal: options.signal,
            operationOrigin: options.origin?.token,
          });
          await this.ready();
          const next = await this.#getIdentityByPath(path);
          if (!next)
            throw new Error(
              `Atomic write did not produce file identity: ${path}`,
            );
          return next;
        },
        remove: async (path, options = {}) => {
          assertGranted("vault:stream");
          await this.ready();
          const current = await this.#getIdentityByPath(path);
          const file = this.vault.getFileByPath(path);
          if (!current || !file)
            throw new Error(`Cannot remove missing file ${path}`);
          if (
            options.expectedFileId !== undefined &&
            current.fileId !== options.expectedFileId
          ) {
            throw new Error(`File identity changed before remove: ${path}`);
          }
          if (
            options.expectedContentGeneration !== undefined &&
            current.contentGeneration !== options.expectedContentGeneration
          ) {
            throw new Error(
              `File content generation changed before remove: ${path}`,
            );
          }
          if (options.origin) {
            const owner = this.#origins.get(options.origin.token);
            if (
              !owner ||
              owner.pluginId !== normalizedPluginId ||
              owner.runtimeId !== runtimeId
            ) {
              throw new Error(
                "Operation origin is invalid or belongs to another plugin runtime",
              );
            }
          }
          await this.vault.delete(file, false, {
            operationOrigin: options.origin?.token,
          });
          await this.ready();
          const tombstone = await this.#getIdentityById(current.fileId);
          if (!tombstone)
            throw new Error(`Remove did not produce tombstone: ${path}`);
          return tombstone;
        },
      },
      network: this.#security.network(
        normalizedPluginId,
        runtimeId,
        () => assertGranted("network:connect"),
        async (origin, options) => {
          if (
            await this.#security.hasNetworkOriginGrant(
              normalizedPluginId,
              origin,
            )
          ) {
            return;
          }
          const approved = await this.options.requestNetworkOriginGrant?.({
            pluginId: normalizedPluginId,
            origin: new URL(origin).origin,
            allowPrivateNetwork: options?.allowPrivateNetwork ?? false,
          });
          if (approved !== true) {
            throw new Error(
              `Network origin grant was not approved for ${normalizedPluginId}`,
            );
          }
          await this.#security.grantNetworkOrigin(
            normalizedPluginId,
            origin,
            options,
          );
        },
      ),
      crypto: this.#security.crypto(
        normalizedPluginId,
        runtimeId,
        () => assertGranted("crypto:nostr-sync"),
        async () => {
          const status = await this.#security.status(normalizedPluginId);
          if (status.state === "unlocked") return status;
          if (!this.options.requestCryptoUnlock) {
            throw new Error(
              `Sync crypto is ${status.state} for ${normalizedPluginId}; the host has no unlock flow`,
            );
          }
          await this.options.requestCryptoUnlock(normalizedPluginId, status);
          const next = await this.#security.status(normalizedPluginId);
          if (next.state !== "unlocked") {
            throw new Error(
              `The host did not unlock sync crypto for ${normalizedPluginId}`,
            );
          }
          return next;
        },
        async (enrollment) => {
          const status = await this.#security.status(normalizedPluginId);
          if (status.state !== "unenrolled") {
            throw new Error(
              `Sync crypto is already enrolled for ${normalizedPluginId}`,
            );
          }
          if (!this.options.requestCryptoUnlock) {
            throw new Error(
              `The host has no sync enrollment flow for ${normalizedPluginId}`,
            );
          }
          await this.options.requestCryptoUnlock(
            normalizedPluginId,
            status,
            enrollment,
          );
          const next = await this.#security.status(normalizedPluginId);
          if (next.state !== "unlocked") {
            throw new Error(
              `The host did not enroll sync crypto for ${normalizedPluginId}`,
            );
          }
          return next;
        },
      ),
      syncIdentity: this.#security.syncIdentity(
        normalizedPluginId,
        runtimeId,
        () => assertGranted("crypto:nostr-sync"),
      ),
      pairing: this.#security.pairing(
        normalizedPluginId,
        runtimeId,
        () => assertGranted("crypto:nostr-sync"),
        async (enrollment) => {
          const status = await this.#security.status(normalizedPluginId);
          if (status.state !== "unenrolled") return status;
          if (!this.options.requestCryptoUnlock) {
            throw new Error(
              `The host has no sync enrollment flow for ${normalizedPluginId}`,
            );
          }
          await this.options.requestCryptoUnlock(
            normalizedPluginId,
            status,
            enrollment,
          );
          return this.#security.status(normalizedPluginId);
        },
      ),
      membership: this.#security.membership(normalizedPluginId, runtimeId, () =>
        assertGranted("crypto:nostr-sync"),
      ),
      recovery: this.#security.recovery(
        normalizedPluginId,
        runtimeId,
        () => assertGranted("crypto:nostr-sync"),
        this.options.requestRecoveryPassphrase
          ? (mode) =>
              this.options.requestRecoveryPassphrase!(normalizedPluginId, mode)
          : undefined,
        async (enrollment) => {
          const status = await this.#security.status(normalizedPluginId);
          if (status.state !== "unenrolled") return status;
          if (!this.options.requestCryptoUnlock) {
            throw new Error(
              `The host has no sync enrollment flow for ${normalizedPluginId}`,
            );
          }
          await this.options.requestCryptoUnlock(
            normalizedPluginId,
            status,
            enrollment,
          );
          return this.#security.status(normalizedPluginId);
        },
      ),
      generatedState: this.#generatedState(normalizedPluginId, runtimeId, () =>
        assertGranted("plugin:generated-state"),
      ),
    };
  }

  revokePlugin(pluginId: string): void {
    this.#runtimeIds.delete(pluginId);
    for (const [token, owner] of this.#origins) {
      if (owner.pluginId === pluginId) this.#origins.delete(token);
    }
    this.#security.revokePlugin(pluginId);
  }

  /** Host-controlled enrollment; this operation is intentionally absent from plugin facades. */
  enrollPluginCrypto(
    pluginId: string,
    passphrase: string,
    request?: SyncCryptoEnrollmentRequest,
  ): Promise<SyncCryptoStatus> {
    return this.#security.enroll(
      requireBoundedString(pluginId, "Plugin ID", 128),
      passphrase,
      request,
    );
  }

  /** Host-controlled unlock; plugins can only observe locked state. */
  unlockPluginCrypto(
    pluginId: string,
    passphrase: string,
  ): Promise<SyncCryptoStatus> {
    return this.#security.unlock(
      requireBoundedString(pluginId, "Plugin ID", 128),
      passphrase,
    );
  }

  /** Host-controlled passkey or OS-credential enrollment. */
  enrollPluginCryptoWithWrappingKey(
    pluginId: string,
    wrappingKey: Uint8Array,
    descriptor: Extract<SyncWrappingKeyDescriptor, { name: "external" }>,
    request?: SyncCryptoEnrollmentRequest,
  ): Promise<SyncCryptoStatus> {
    return this.#security.enrollWithWrappingKey(
      requireBoundedString(pluginId, "Plugin ID", 128),
      wrappingKey,
      descriptor,
      request,
    );
  }

  /** Host-controlled passkey or OS-credential unlock. */
  unlockPluginCryptoWithWrappingKey(
    pluginId: string,
    wrappingKey: Uint8Array,
  ): Promise<SyncCryptoStatus> {
    return this.#security.unlockWithWrappingKey(
      requireBoundedString(pluginId, "Plugin ID", 128),
      wrappingKey,
    );
  }

  lockPluginCrypto(pluginId: string): void {
    this.#security.lock(requireBoundedString(pluginId, "Plugin ID", 128));
  }

  grantPluginNetworkOrigin(
    pluginId: string,
    origin: string,
    options?: { allowPrivateNetwork?: boolean },
  ): Promise<void> {
    return this.#security.grantNetworkOrigin(
      requireBoundedString(pluginId, "Plugin ID", 128),
      origin,
      options,
    );
  }

  revokePluginNetworkOrigin(pluginId: string, origin: string): Promise<void> {
    return this.#security.revokeNetworkOrigin(
      requireBoundedString(pluginId, "Plugin ID", 128),
      origin,
    );
  }

  async recordOriginatedChange(
    pluginId: string,
    origin: OperationOrigin,
    kind: HostFileChangeKind,
    file: TFile,
    previousPath?: string,
  ): Promise<void> {
    await this.ready();
    const owner = this.#origins.get(origin.token);
    if (!owner || owner.pluginId !== pluginId) {
      throw new Error(
        "Operation origin is invalid or belongs to another plugin runtime",
      );
    }
    this.#assertRuntime(owner.pluginId, owner.runtimeId);
    await this.#recordFileChange(kind, file, previousPath, origin.token);
  }

  async #initialize(): Promise<void> {
    await this.vault.load();
    const generation = await this.database.getMeta<string>(
      DATABASE_GENERATION_KEY,
    );
    if (!generation) {
      await this.database.transactMeta({
        checks: [{ key: DATABASE_GENERATION_KEY, exists: false }],
        mutations: [
          { key: DATABASE_GENERATION_KEY, value: randomId() },
          { key: CHANGE_SEQUENCE_KEY, value: 0 },
        ],
      });
    }
    // Tombstone missing paths first so a later unmatched file can recover one
    // unique strong-fingerprint identity after an out-of-process rename.
    let after: string | undefined;
    do {
      const page = await this.database.scanMeta<HostFileIdentity>({
        prefix: FILE_PREFIX,
        after,
        limit: MAX_PAGE_SIZE,
      });
      for (const { value } of page.entries) {
        if (
          value.state === "present" &&
          !this.vault.getFileByPath(value.currentPath)
        ) {
          const synthetic = new TFile(
            value.currentPath,
            {
              ctime: value.createdAt,
              mtime: value.lastObservedMtime ?? value.updatedAt,
              size: value.lastObservedSize ?? 0,
            },
            null,
            this.vault,
          );
          await this.#recordFileChange("delete", synthetic);
        }
      }
      after = page.nextCursor;
    } while (after);
    for (const file of this.vault.iterateFiles()) {
      const identity = await this.#getIdentityByPath(file.path);
      if (!identity) {
        await this.#recordFileChange(
          "create",
          file,
          undefined,
          undefined,
          true,
        );
        continue;
      }
      if (
        identity.lastObservedMtime !== file.stat.mtime ||
        identity.lastObservedSize !== file.stat.size
      ) {
        await this.#recordFileChange("modify", file);
      }
    }
  }

  #isChangeKind(value: string): value is HostFileChangeKind {
    return (
      value === "create" ||
      value === "modify" ||
      value === "rename" ||
      value === "delete"
    );
  }

  #assertRuntime(pluginId: string, runtimeId: string): void {
    if (!this.#runtimeIds.get(pluginId)?.has(runtimeId)) {
      throw new Error(
        `Sync-host capabilities for ${pluginId} have been revoked`,
      );
    }
  }

  async #getIdentityByPath(path: string): Promise<HostFileIdentity | null> {
    const pointer = await this.database.getMeta<{
      fileId: string;
      path: string;
    }>(`${PATH_PREFIX}${await hashKeyPart(path)}`);
    if (!pointer || pointer.path !== path) return null;
    return this.#getIdentityById(pointer.fileId);
  }

  async #getIdentityById(fileId: string): Promise<HostFileIdentity | null> {
    return (
      (await this.database.getMeta<HostFileIdentity>(
        `${FILE_PREFIX}${requireBoundedString(fileId, "File ID", 128)}`,
      )) ?? null
    );
  }

  async #strongFingerprint(
    path: string,
    readIfMissing = false,
  ): Promise<string | undefined> {
    const indexed = await this.database.getIndexedFile(path);
    if (indexed?.file.hash) return indexed.file.hash;
    if (!readIfMissing) return undefined;
    const file = this.vault.getFileByPath(path);
    if (!file) return undefined;
    const handle = await this.vault.openRead(file);
    const reader = handle.stream().getReader();
    const hash = sha256.create();
    try {
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        hash.update(chunk.value);
      }
      return bytesToHex(hash.digest());
    } finally {
      reader.releaseLock();
    }
  }

  async #findUniqueTombstone(
    fingerprint: string,
  ): Promise<HostFileIdentity | null> {
    let match: HostFileIdentity | null = null;
    let after: string | undefined;
    do {
      const page = await this.database.scanMeta<HostFileIdentity>({
        prefix: FILE_PREFIX,
        after,
        limit: MAX_PAGE_SIZE,
      });
      for (const { value } of page.entries) {
        if (
          value.state !== "tombstoned" ||
          value.contentFingerprint !== fingerprint
        ) {
          continue;
        }
        if (match) return null;
        match = value;
      }
      after = page.nextCursor;
    } while (after);
    return match;
  }

  async #recordFileChange(
    kind: HostFileChangeKind,
    file: TFile,
    previousPath?: string,
    originId?: string,
    allowFingerprintRecovery = false,
  ): Promise<HostFileIdentity> {
    for (let attempt = 0; attempt < MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
      const now = this.clock();
      const generation = await this.database.getMeta<string>(
        DATABASE_GENERATION_KEY,
      );
      if (!generation)
        throw new Error("Sync-host database generation is unavailable");
      const currentSequence =
        (await this.database.getMeta<number>(CHANGE_SEQUENCE_KEY)) ?? 0;
      const path = file.path;
      const lookupPath = kind === "rename" ? (previousPath ?? path) : path;
      let current = await this.#getIdentityByPath(lookupPath);
      let fingerprint: string | undefined;
      if (kind === "delete") {
        fingerprint = current?.contentFingerprint;
      } else {
        try {
          fingerprint = await this.#strongFingerprint(
            path,
            allowFingerprintRecovery,
          );
        } catch (error) {
          const missing = error as { code?: string; name?: string } | null;
          if (missing?.code !== "ENOENT" && missing?.name !== "NotFoundError") {
            throw error;
          }
          // Vault discovery and native streaming are separate operations. A
          // concurrent uninstall or external delete can remove the bytes between
          // them; reconcile that removal instead of rejecting host readiness.
          kind = "delete";
          fingerprint = current?.contentFingerprint;
        }
      }
      if (
        !current &&
        kind === "create" &&
        allowFingerprintRecovery &&
        fingerprint
      ) {
        current = await this.#findUniqueTombstone(fingerprint);
        if (current) kind = "rename";
      }
      if (!current && kind === "delete") {
        return {
          fileId: randomId(),
          currentPath: path,
          state: "tombstoned",
          createdAt: now,
          updatedAt: now,
          tombstonedAt: now,
          contentGeneration: 0,
          lastChangeSequence: currentSequence,
        };
      }
      const nextSequence = currentSequence + 1;
      const fileId = current?.fileId ?? randomId();
      const next: HostFileIdentity = {
        fileId,
        currentPath: path,
        state: kind === "delete" ? "tombstoned" : "present",
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
        tombstonedAt: kind === "delete" ? now : undefined,
        lastObservedMtime: file.stat.mtime,
        lastObservedSize: file.stat.size,
        contentGeneration:
          (current?.contentGeneration ?? 0) +
          (kind === "modify" || kind === "create" ? 1 : 0),
        lastChangeSequence: nextSequence,
        contentFingerprint: fingerprint ?? current?.contentFingerprint,
      };
      const change: StoredHostFileChange = {
        file: next,
        kind,
        previousPath:
          kind === "rename"
            ? (previousPath ?? current?.currentPath)
            : undefined,
        originId,
        originPluginId: originId
          ? this.#origins.get(originId)?.pluginId
          : undefined,
      };
      const mutations: AppDatabaseMetaMutation[] = [
        { key: CHANGE_SEQUENCE_KEY, value: nextSequence },
        { key: `${FILE_PREFIX}${fileId}`, value: next },
      ];
      const oldLatestKey = await this.database.getMeta<string>(
        `${LATEST_CHANGE_PREFIX}${fileId}`,
      );
      if (oldLatestKey) mutations.push({ key: oldLatestKey, delete: true });
      const nextChangeKey = sequenceKey(nextSequence, fileId);
      mutations.push(
        { key: nextChangeKey, value: change },
        { key: `${LATEST_CHANGE_PREFIX}${fileId}`, value: nextChangeKey },
      );
      const currentPathKey = `${PATH_PREFIX}${await hashKeyPart(path)}`;
      if (kind === "delete") {
        mutations.push({ key: currentPathKey, delete: true });
      } else {
        mutations.push({ key: currentPathKey, value: { fileId, path } });
      }
      if (previousPath && previousPath !== path) {
        mutations.push({
          key: `${PATH_PREFIX}${await hashKeyPart(previousPath)}`,
          delete: true,
        });
      }
      const alias: HostFilePathAlias = {
        fileId,
        path,
        firstSeenAt: now,
        lastSeenAt: kind === "delete" ? now : undefined,
        reason:
          kind === "rename"
            ? "rename"
            : allowFingerprintRecovery
              ? "scan-reconciliation"
              : "create",
      };
      mutations.push({
        key: `${ALIAS_PREFIX}${fileId}:${String(now).padStart(16, "0")}:${await hashKeyPart(path)}`,
        value: alias,
      });
      const result = await this.database.transactMeta({
        checks: [{ key: CHANGE_SEQUENCE_KEY, value: currentSequence }],
        mutations,
      });
      if (result.applied) return next;
    }
    throw new Error(
      "Sync-host file change could not be committed after concurrent updates",
    );
  }

  async #listChangedSince(
    pluginId: string,
    runtimeId: string,
    cursor?: HostChangeCursor,
    limit = 100,
  ): Promise<HostChangedFileBatch> {
    const databaseGenerationId =
      (await this.database.getMeta<string>(DATABASE_GENERATION_KEY)) ?? "";
    const currentSequence =
      (await this.database.getMeta<number>(CHANGE_SEQUENCE_KEY)) ?? 0;
    if (cursor && cursor.databaseGenerationId !== databaseGenerationId) {
      return {
        status: "reset-required",
        databaseGenerationId,
        changes: [],
        nextCursor: { databaseGenerationId, sequence: 0 },
        hasMore: false,
      };
    }
    const fromSequence = Math.max(0, cursor?.sequence ?? 0);
    const page = await this.database.scanMeta<StoredHostFileChange>({
      prefix: CHANGE_PREFIX,
      after: sequenceKey(fromSequence, "~"),
      limit: boundedLimit(limit),
    });
    const changes = page.entries.map(({ value }) => ({
      file: value.file,
      kind: value.kind,
      previousPath: value.previousPath,
      selfOriginated:
        value.originPluginId === pluginId ||
        (Boolean(value.originId) &&
          this.#origins.get(value.originId!)?.pluginId === pluginId &&
          this.#origins.get(value.originId!)?.runtimeId === runtimeId),
    }));
    const sequence = changes.at(-1)?.file.lastChangeSequence ?? currentSequence;
    return {
      status: "ok",
      databaseGenerationId,
      changes,
      nextCursor: { databaseGenerationId, sequence },
      hasMore: Boolean(page.nextCursor),
    };
  }

  async #bindingKey(pluginId: string, externalFileId: string): Promise<string> {
    return `${BINDING_PREFIX}${encodeKeyPart(pluginId)}:${await hashKeyPart(
      requireBoundedString(externalFileId, "External file ID", 512),
    )}`;
  }

  async #getExternalBinding(
    pluginId: string,
    externalFileId: string,
  ): Promise<ExternalFileIdentityBinding | null> {
    const binding = await this.database.getMeta<ExternalFileIdentityBinding>(
      await this.#bindingKey(pluginId, externalFileId),
    );
    return binding?.namespace === pluginId &&
      binding.externalFileId === externalFileId
      ? binding
      : null;
  }

  async #bindExternalIdentity(
    pluginId: string,
    localFileId: string,
    externalFileId: string,
  ): Promise<ExternalFileIdentityBinding> {
    const identity = await this.#getIdentityById(localFileId);
    if (!identity || identity.state !== "present") {
      throw new Error(
        `Cannot bind missing or tombstoned local file ${localFileId}`,
      );
    }
    const key = await this.#bindingKey(pluginId, externalFileId);
    const existing =
      await this.database.getMeta<ExternalFileIdentityBinding>(key);
    if (existing && existing.localFileId !== localFileId) {
      throw new Error(
        `External file identity ${externalFileId} is already bound`,
      );
    }
    const now = this.clock();
    const binding: ExternalFileIdentityBinding = {
      namespace: pluginId,
      externalFileId,
      localFileId,
      boundAt: existing?.boundAt ?? now,
      updatedAt: now,
    };
    const result = await this.database.transactMeta({
      checks: existing ? [{ key, value: existing }] : [{ key, exists: false }],
      mutations: [{ key, value: binding }],
    });
    if (!result.applied) {
      throw new Error(
        `External file identity ${externalFileId} changed concurrently`,
      );
    }
    return binding;
  }

  #generatedState(
    pluginId: string,
    runtimeId: string,
    assertActive: () => void,
  ): PluginGeneratedState {
    const prefix = `${GENERATED_PREFIX}${encodeKeyPart(pluginId)}:`;
    const revisionKey = `${prefix}__revision__`;
    const schemaKey = `${prefix}__schema__`;
    const recordPrefix = `${prefix}record:`;
    const recordKey = (key: string) =>
      `${recordPrefix}${requireGeneratedKey(key)}`;
    return {
      get: async <T>(key: string) => {
        assertActive();
        return (
          (await this.database.getMeta<GeneratedStateRecord<T>>(
            recordKey(key),
          )) ?? null
        );
      },
      scan: async <T>({
        prefix: keyPrefix = "",
        after,
        limit,
      }: {
        prefix?: string;
        after?: string;
        limit?: number;
      } = {}) => {
        assertActive();
        const normalizedPrefix = keyPrefix
          ? requireGeneratedKey(keyPrefix)
          : "";
        const page = await this.database.scanMeta<GeneratedStateRecord<T>>({
          prefix: `${recordPrefix}${normalizedPrefix}`,
          after: after ? recordKey(after) : undefined,
          limit: boundedLimit(limit),
        });
        return {
          records: page.entries.map(({ value }) => value),
          nextCursor: page.nextCursor?.slice(recordPrefix.length),
        };
      },
      getRevision: async () => {
        assertActive();
        return (await this.database.getMeta<number>(revisionKey)) ?? 0;
      },
      getSchemaVersion: async () => {
        assertActive();
        return (await this.database.getMeta<number>(schemaKey)) ?? 0;
      },
      transact: async ({
        expectedRevision,
        expectedSchemaVersion,
        schemaVersion,
        mutations,
      }) => {
        assertActive();
        this.#assertRuntime(pluginId, runtimeId);
        const currentRevision =
          (await this.database.getMeta<number>(revisionKey)) ?? 0;
        const currentSchemaVersion =
          (await this.database.getMeta<number>(schemaKey)) ?? 0;
        if (
          (expectedRevision !== undefined &&
            expectedRevision !== currentRevision) ||
          (expectedSchemaVersion !== undefined &&
            expectedSchemaVersion !== currentSchemaVersion)
        ) {
          return {
            applied: false,
            revision: currentRevision,
            schemaVersion: currentSchemaVersion,
          };
        }
        const now = this.clock();
        const databaseMutations: AppDatabaseMetaMutation[] = [];
        for (const mutation of mutations) {
          const key = requireGeneratedKey(mutation.key);
          const storageKey = recordKey(key);
          if (mutation.type === "delete") {
            databaseMutations.push({ key: storageKey, delete: true });
            continue;
          }
          const existing =
            await this.database.getMeta<GeneratedStateRecord>(storageKey);
          databaseMutations.push({
            key: storageKey,
            value: {
              key,
              value: mutation.value,
              version: (existing?.version ?? 0) + 1,
              updatedAt: now,
            } satisfies GeneratedStateRecord,
          });
        }
        const nextRevision = currentRevision + 1;
        const nextSchemaVersion = schemaVersion ?? currentSchemaVersion;
        databaseMutations.push(
          { key: revisionKey, value: nextRevision },
          { key: schemaKey, value: nextSchemaVersion },
        );
        const applied = await this.database.transactMeta({
          checks: [
            currentRevision === 0
              ? { key: revisionKey, exists: false }
              : { key: revisionKey, value: currentRevision },
            currentSchemaVersion === 0
              ? { key: schemaKey, exists: false }
              : { key: schemaKey, value: currentSchemaVersion },
          ],
          mutations: databaseMutations,
        });
        return {
          applied: applied.applied,
          revision: applied.applied ? nextRevision : currentRevision,
          schemaVersion: applied.applied
            ? nextSchemaVersion
            : currentSchemaVersion,
        };
      },
      clear: async () => {
        assertActive();
        let after: string | undefined;
        do {
          const page = await this.database.scanMeta({
            prefix,
            after,
            limit: MAX_PAGE_SIZE,
          });
          if (page.entries.length > 0) {
            await this.database.transactMeta({
              mutations: page.entries.map(({ key }) => ({ key, delete: true })),
            });
          }
          after = page.nextCursor;
        } while (after);
      },
    };
  }
}
