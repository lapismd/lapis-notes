/** Durable opaque sync data. Hosts keep this separate from disposable AppDatabase indexes. */
export interface SealedSyncState {
  version: number;
  epoch: number;
  ciphertext: Uint8Array;
}

export interface SyncRepository {
  readonly blobs: {
    has(hash: string): Promise<boolean>;
    put(ciphertext: Uint8Array): Promise<{ hash: string; size: number }>;
    get(hash: string): Promise<Uint8Array>;
  };
  readState(): Promise<SealedSyncState | null>;
  compareAndSwap(
    expectedVersion: number,
    next: SealedSyncState,
    authority?: SyncOperationAuthority,
  ): Promise<boolean>;
}

/** Expected endpoint authority for a guarded host operation, outside encrypted protocol data. */
export interface SyncOperationAuthority {
  vaultId: string;
  devicePublicKey: string;
  epoch: number;
  membershipGeneration: number;
}

/** Immutable sealed records addressed by opaque 64-character lowercase hex keys. */
export interface SealedSyncRecord {
  epoch: number;
  ciphertext: Uint8Array;
}

/** Optional repository extension for independently encrypted, indexed local records. */
export interface SyncIndexedRepository extends SyncRepository {
  readonly records: {
    get(key: string): Promise<SealedSyncRecord | null>;
    /** False preserves the existing record unchanged, including concurrent insertion. */
    putIfAbsent(key: string, record: SealedSyncRecord): Promise<boolean>;
  };
}

/** Captured by the owning host; a missing file is represented by null. */
export interface SyncFileGeneration {
  fileId: string;
  contentGeneration: number;
  hostFileId?: string;
}

export interface SyncFileMutation {
  id: string;
  kind: "write" | "remove";
  path: string;
  expected: SyncFileGeneration | null;
  fileId: string;
}

/** Capture only protocol-neutral mutation data; file handles may carry read functions. */
export function snapshotSyncFileMutation(
  input: SyncFileMutation,
): SyncFileMutation {
  return {
    id: input.id,
    kind: input.kind,
    path: input.path,
    fileId: input.fileId,
    expected:
      input.expected === null
        ? null
        : {
            fileId: input.expected.fileId,
            contentGeneration: input.expected.contentGeneration,
            ...(input.expected.hostFileId !== undefined
              ? { hostFileId: input.expected.hostFileId }
              : {}),
          },
  };
}

export interface SyncFileMutationReceipt {
  operation: SyncFileMutation;
  result: SyncFileGeneration | null;
}

/** The host journals immutable operation IDs and verifies guards at mutation. */
export interface SyncFileMutationAccess {
  receipt(
    operationId: string,
    authority?: SyncOperationAuthority,
  ): Promise<SyncFileMutationReceipt | null>;
  mutate(
    operation: SyncFileMutation,
    source?: ReadableStream<Uint8Array>,
    authority?: SyncOperationAuthority,
  ): Promise<SyncFileMutationReceipt>;
}

export interface SyncFileDescriptor extends SyncFileGeneration {
  path: string;
}

export interface SyncGuardedFile extends SyncFileDescriptor {
  openRead(): Promise<ReadableStream<Uint8Array>>;
}

/** Captured working files and durable encrypted state owned by the current host. */
export interface SyncLocalHostCapabilities {
  list(): Promise<SyncGuardedFile[]>;
  readonly repository: SyncRepository;
  readonly apply: SyncFileMutationAccess;
}

/** Trusted host adapter. Neither this controller nor storage paths enter plugin facades. */
export interface SyncHostLocalProvider {
  forRuntime(runtimeId: string): SyncLocalHostCapabilities;
  revokeRuntime(runtimeId: string): void | Promise<void>;
}

/** The owning host protects editor state for the entire callback, including recovery. */
export type SyncLocalApplyGuard = <T>(
  path: string | undefined,
  operation: () => Promise<T>,
) => Promise<T>;

/** Minimal opaque crypto boundary; implementations retain all secret material. */
export interface SyncVaultStateCrypto {
  status(): Promise<{
    state: "unenrolled" | "locked" | "unlocked";
    suite: "lapis-sync-v1-xchacha20poly1305-schnorr";
    vaultId?: string;
    devicePublicKey?: string;
    deviceState?: "active" | "revoked" | "recovery-pending";
    currentEpoch?: number;
    membershipGeneration?: number;
  }>;
  encryptObject(input: {
    epoch: number;
    type: "local-state";
    plaintext: Uint8Array;
  }): Promise<{ bytes: Uint8Array; objectHash: string }>;
  decryptObject(input: {
    epoch: number;
    type: "local-state";
    envelope: Uint8Array;
  }): Promise<Uint8Array>;
}
