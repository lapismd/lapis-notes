import { xchacha20poly1305 } from "@noble/ciphers/chacha.js";
import { argon2idAsync } from "@noble/hashes/argon2.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes, randomBytes } from "@noble/hashes/utils.js";
import {
  finalizeEvent,
  getPublicKey,
  verifyEvent,
  type Event as NostrEvent,
} from "nostr-tools/pure";
import { v2 as nip44 } from "nostr-tools/nip44";
import type { AppDatabase } from "./storage/app-database";

const SECURITY_PREFIX = "sync-host:v1:security:";
const KEY_LENGTH = 32;
const NONCE_LENGTH = 24;
const OBJECT_ENVELOPE_VERSION = 1;
const KEY_ENVELOPE_VERSION = 3;
const MAX_CRYPTO_INPUT_BYTES = 32 * 1024 * 1024;
const MAX_PAIRING_EVENT_BYTES = 64 * 1024;
const MAX_PAIRING_METADATA_BYTES = 16 * 1024;
const MAX_RECOVERY_METADATA_BYTES = 64 * 1024;
const PAIRING_KIND = 24_134;
const MEMBERSHIP_KIND = 30_079;
const PAIRING_TTL_MS = 120_000;
const MAX_REDIRECTS = 5;

export type SyncCryptoObjectType =
  | "file-content"
  | "file-manifest"
  | "tree-manifest"
  | "revision-payload"
  | "revision-archive"
  | "head-payload"
  | "membership-payload";

export type SyncDeviceRole = "owner" | "member";

export type SyncIdentityState =
  | "setup-required"
  | "active"
  | "rotation-pending";

export interface SyncIdentityHistoryEntry {
  publicKey: string;
  generation: number;
  activatedMembershipGeneration: number;
  retiredMembershipGeneration?: number;
  cutoffHeads?: Record<string, string>;
}

export interface SyncIdentityPublicStatus {
  state: SyncIdentityState;
  publicKey?: string;
  generation: number;
  history: SyncIdentityHistoryEntry[];
  pendingPublicKey?: string;
  canRotate: boolean;
}

export interface SyncDeviceMembership {
  publicKey: string;
  alias: string;
  role: SyncDeviceRole;
  state: "active" | "revoked";
  addedAt: number;
  revokedAt?: number;
  cutoffHead?: string;
}

export interface SyncMembershipSnapshot {
  schemaVersion: 1 | 2;
  vaultId: string;
  ownerPublicKey: string;
  generation: number;
  currentEpoch: number;
  previousEventId?: string;
  devices: SyncDeviceMembership[];
  /** NIP-44 sealed current-epoch material, keyed by active device public key. */
  epochEnvelopes?: Record<string, string>;
  /** Current-epoch material sealed to the recovery authority. */
  recoveryEpochEnvelope?: string;
  /** Stable remote-account identity and its root-authorised public lineage. */
  syncIdentity?: {
    publicKey: string;
    generation: number;
    history: SyncIdentityHistoryEntry[];
  };
  /** Active Sync Identity secret sealed independently to each active device. */
  syncIdentityEnvelopes?: Record<string, string>;
  /** Active Sync Identity secret sealed to the recovery authority. */
  recoverySyncIdentityEnvelope?: string;
  /** Final accepted legacy device-authored HEADs at Sync Identity activation. */
  legacyTransportCutoffHeads?: Record<string, string>;
  event?: NostrEvent;
}

export interface SyncCryptoStatus {
  state: "unenrolled" | "locked" | "unlocked";
  suite: "lapis-sync-v1-xchacha20poly1305-schnorr";
  publicKey?: string;
  /** Unambiguous replacement for the deprecated publicKey device-key alias. */
  devicePublicKey?: string;
  vaultId?: string;
  deviceAlias?: string;
  role?: SyncDeviceRole;
  deviceState?: "active" | "revoked" | "recovery-pending";
  currentEpoch?: number;
  membershipGeneration?: number;
  canManageDevices?: boolean;
  syncIdentity?: SyncIdentityPublicStatus;
}

export interface SyncEncryptedObject {
  bytes: Uint8Array;
  objectHash: string;
}

export interface UnsignedSyncEvent {
  kind: number;
  created_at: number;
  tags: string[][];
  content: string;
}

export interface SyncCryptoCapability {
  status(): Promise<SyncCryptoStatus>;
  /** Explicitly create a new sync vault through a host-owned enrollment flow. */
  enrollNewVault(input: { deviceAlias: string }): Promise<SyncCryptoStatus>;
  /** Ask the owning host to perform its user-verification unlock flow. */
  requestUnlock(): Promise<SyncCryptoStatus>;
  getDevicePublicKey(): Promise<string>;
  encryptObject(input: {
    epoch: number;
    type: SyncCryptoObjectType;
    plaintext: Uint8Array;
  }): Promise<SyncEncryptedObject>;
  decryptObject(input: {
    epoch: number;
    type: SyncCryptoObjectType;
    envelope: Uint8Array;
  }): Promise<Uint8Array>;
  calculateContentId(input: {
    epoch: number;
    plaintext: Uint8Array;
  }): Promise<string>;
  signEvent(event: UnsignedSyncEvent): Promise<NostrEvent>;
  /** Sign a bounded inner revision or HEAD attestation with this device. */
  signDeviceEvent(event: UnsignedSyncEvent): Promise<NostrEvent>;
}

export type SyncIdentitySigningPurpose =
  | "transport"
  | "relay-auth"
  | "blossom-auth"
  | "connection-probe";

export interface SyncIdentityCapability {
  status(): Promise<SyncIdentityPublicStatus>;
  initialize(input: {
    cutoffHeads: Record<string, string>;
  }): Promise<{
    status: SyncIdentityPublicStatus;
    membershipEvent: NostrEvent;
  }>;
  signEvent(input: {
    purpose: SyncIdentitySigningPurpose;
    identity?: "active" | "pending";
    event: UnsignedSyncEvent;
  }): Promise<NostrEvent>;
  beginRotation(): Promise<SyncIdentityPublicStatus>;
  commitRotation(input: {
    pendingPublicKey: string;
    cutoffHeads: Record<string, string>;
  }): Promise<{
    status: SyncIdentityPublicStatus;
    membershipEvent: NostrEvent;
  }>;
  cancelRotation(): Promise<SyncIdentityPublicStatus>;
}

export interface SyncPairingSessionSnapshot {
  sessionId: string;
  role: "owner" | "joining";
  state:
    | "waiting-for-peer"
    | "waiting-for-sas"
    | "waiting-for-confirmation"
    | "ready-to-enroll"
    | "transferring"
    | "complete"
    | "cancelled"
    | "expired"
    | "error";
  expiresAt: number;
  sas?: string;
  peerPublicKey?: string;
  peerAlias?: string;
  error?: string;
}

export interface SyncPairingActionResult {
  session: SyncPairingSessionSnapshot;
  outboundEvents: NostrEvent[];
  /** Public transport endpoints for this bounded pairing session. */
  relayUrls: string[];
  invitationUri?: string;
  membershipEvent?: NostrEvent;
  /** Bounded plugin data recovered only from the encrypted pairing transfer. */
  metadata?: unknown;
}

export interface SyncPairingCapability {
  beginOwner(input: {
    relayUrls: string[];
    cutoffHeads?: Record<string, string>;
    metadata?: unknown;
  }): Promise<SyncPairingActionResult>;
  acceptInvite(input: {
    invitationUri: string;
    deviceAlias: string;
  }): Promise<SyncPairingActionResult>;
  ingest(input: {
    sessionId: string;
    event: NostrEvent;
  }): Promise<SyncPairingActionResult>;
  confirm(sessionId: string, sas?: string): Promise<SyncPairingActionResult>;
  cancel(sessionId: string): Promise<SyncPairingSessionSnapshot>;
  /** Create a disposable kind-24134 event for relay policy probing. */
  createRelayProbe(): Promise<NostrEvent>;
}

export interface SyncMembershipCapability {
  getSnapshot(): Promise<SyncMembershipSnapshot>;
  ingest(event: NostrEvent): Promise<SyncMembershipSnapshot>;
  renameDevice(input: {
    publicKey: string;
    alias: string;
  }): Promise<SyncMembershipSnapshot>;
  revokeDevice(input: {
    publicKey: string;
    cutoffHeads: Record<string, string>;
  }): Promise<SyncMembershipSnapshot>;
  recoverOwner(input: {
    cutoffHeads: Record<string, string>;
  }): Promise<SyncMembershipSnapshot>;
}

export interface SyncRecoveryCapability {
  exportBundle(input?: { metadata?: unknown }): Promise<Uint8Array>;
  importBundle(input: {
    bundle: Uint8Array;
    replaceExisting?: boolean;
  }): Promise<{ status: SyncCryptoStatus; metadata?: unknown }>;
}

export interface SyncCryptoEnrollmentRequest {
  mode: "new-vault" | "paired-device" | "recovery";
  deviceAlias?: string;
  sessionId?: string;
}

export interface PluginNetworkRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit | ReadableStream<Uint8Array> | null;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface PluginNetworkResponse {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: ReadableStream<Uint8Array> | null;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

export interface PluginWebSocket {
  readonly url: string;
  readonly ready: Promise<void>;
  readonly readyState: number;
  addEventListener(
    type: "open" | "message" | "error" | "close",
    listener: EventListenerOrEventListenerObject,
  ): void;
  removeEventListener(
    type: "open" | "message" | "error" | "close",
    listener: EventListenerOrEventListenerObject,
  ): void;
  send(data: string | ArrayBuffer | ArrayBufferView | Blob): void;
  close(code?: number, reason?: string): void;
}

export interface PluginNetworkCapability {
  /** Ask the host to approve and persist an exact origin grant. */
  requestOriginGrant(
    origin: string,
    options?: { allowPrivateNetwork?: boolean },
  ): Promise<void>;
  request(request: PluginNetworkRequest): Promise<PluginNetworkResponse>;
  connectWebSocket(
    url: string,
    protocols?: string | string[],
  ): Promise<PluginWebSocket>;
}

export type SyncWrappingKeyDescriptor =
  | {
      name: "argon2id";
      timeCost: number;
      memoryKiB: number;
      parallelism: number;
      dkLen: 32;
      saltHex: string;
    }
  | {
      name: "external";
      provider: "webauthn-prf" | "os-credential-store";
      keyId: string;
    };

interface CryptoEnvelopeV1 {
  version: 1;
  suite: "lapis-sync-v1-xchacha20poly1305-schnorr";
  kdf: SyncWrappingKeyDescriptor;
  nonceHex: string;
  ciphertextHex: string;
  publicKey: string;
}

interface CryptoEnvelopeV2 {
  version: 2;
  suite: "lapis-sync-v1-xchacha20poly1305-schnorr";
  kdf: SyncWrappingKeyDescriptor;
  nonceHex: string;
  ciphertextHex: string;
  publicKey: string;
  vaultId: string;
  deviceAlias: string;
  role: SyncDeviceRole;
  deviceState: "active" | "revoked" | "recovery-pending";
  currentEpoch: number;
  membershipGeneration: number;
  ownerPublicKey: string;
  recoveryPublicKey: string;
}

interface CryptoEnvelopeV3 {
  version: 3;
  suite: "lapis-sync-v1-xchacha20poly1305-schnorr";
  kdf: SyncWrappingKeyDescriptor;
  nonceHex: string;
  ciphertextHex: string;
  publicKey: string;
  vaultId: string;
  deviceAlias: string;
  role: SyncDeviceRole;
  deviceState: "active" | "revoked" | "recovery-pending";
  currentEpoch: number;
  membershipGeneration: number;
  ownerPublicKey: string;
  recoveryPublicKey: string;
  syncIdentityState: SyncIdentityState;
  syncPublicKey?: string;
  syncIdentityGeneration: number;
  pendingSyncPublicKey?: string;
}

type CryptoEnvelope = CryptoEnvelopeV1 | CryptoEnvelopeV2 | CryptoEnvelopeV3;

interface StoredKeyMaterialV2 {
  schemaVersion: 2;
  vaultId: string;
  deviceAlias: string;
  role: SyncDeviceRole;
  currentEpoch: number;
  membershipGeneration: number;
  vaultKeys: Record<string, string>;
  deviceSecretHex: string;
  ownerSecretHex?: string;
  ownerPublicKey: string;
  recoverySecretHex?: string;
  recoveryPublicKey: string;
  membership: SyncMembershipSnapshot;
}

interface StoredKeyMaterialV3 {
  schemaVersion: 3;
  vaultId: string;
  deviceAlias: string;
  role: SyncDeviceRole;
  currentEpoch: number;
  membershipGeneration: number;
  vaultKeys: Record<string, string>;
  deviceSecretHex: string;
  ownerSecretHex?: string;
  ownerPublicKey: string;
  recoverySecretHex?: string;
  recoveryPublicKey: string;
  syncSecretHex?: string;
  syncPublicKey?: string;
  syncIdentityGeneration: number;
  syncIdentityHistory: SyncIdentityHistoryEntry[];
  pendingSyncSecretHex?: string;
  pendingSyncPublicKey?: string;
  membership: SyncMembershipSnapshot;
}

type StoredKeyMaterial = StoredKeyMaterialV2 | StoredKeyMaterialV3;

interface UnlockedKeys {
  vaultId: string;
  deviceAlias: string;
  role: SyncDeviceRole;
  currentEpoch: number;
  membershipGeneration: number;
  vaultKeys: Map<number, Uint8Array>;
  deviceSecret: Uint8Array;
  publicKey: string;
  ownerSecret?: Uint8Array;
  ownerPublicKey: string;
  recoverySecret?: Uint8Array;
  recoveryPublicKey: string;
  syncSecret?: Uint8Array;
  syncPublicKey?: string;
  syncIdentityGeneration: number;
  syncIdentityHistory: SyncIdentityHistoryEntry[];
  pendingSyncSecret?: Uint8Array;
  pendingSyncPublicKey?: string;
  membership: SyncMembershipSnapshot;
  wrappingKey: Uint8Array;
  kdf: SyncWrappingKeyDescriptor;
}

interface PairingInvitationPayload {
  v: 1;
  p: string;
  s: string;
  e: number;
  r: string[];
}

interface PairingMessage {
  v: 1;
  sessionId: string;
  sequence: number;
  type: "hello" | "ack" | "confirm" | "transfer" | "complete" | "abort";
  sessionSecret: string;
  devicePublicKey?: string;
  deviceAlias?: string;
  payload?: StoredPairingTransfer;
}

interface StoredPairingTransfer {
  vaultId: string;
  vaultKeys: Record<string, string>;
  currentEpoch: number;
  ownerPublicKey: string;
  recoveryPublicKey: string;
  syncSecretHex: string;
  syncPublicKey: string;
  syncIdentityGeneration: number;
  syncIdentityHistory: SyncIdentityHistoryEntry[];
  membership: SyncMembershipSnapshot;
  metadata?: unknown;
}

interface PairingSession {
  pluginId: string;
  sessionId: string;
  role: "owner" | "joining";
  state: SyncPairingSessionSnapshot["state"];
  expiresAt: number;
  ephemeralSecret: Uint8Array;
  ephemeralPublicKey: string;
  sessionSecret: string;
  relays: string[];
  sequence: number;
  lastReceivedSequence: number;
  peerEphemeralPublicKey?: string;
  peerDevicePublicKey?: string;
  peerAlias?: string;
  sas?: string;
  localConfirmed: boolean;
  peerConfirmed: boolean;
  cutoffHeads: Record<string, string>;
  metadata?: unknown;
  pendingDeviceSecret?: Uint8Array;
  pendingTransfer?: StoredPairingTransfer;
  seenEventIds: Set<string>;
}

interface PendingEnrollment {
  request: SyncCryptoEnrollmentRequest;
  material?: StoredKeyMaterial;
}

interface RecoveryBundleEnvelope {
  version: 1;
  kdf: Extract<SyncWrappingKeyDescriptor, { name: "argon2id" }>;
  nonceHex: string;
  ciphertextHex: string;
}

interface RecoveryBundlePayload {
  schemaVersion: 1;
  exportedAt: number;
  keyMaterial: StoredKeyMaterial;
  metadata?: unknown;
}

interface NetworkGrant {
  origin: string;
  allowPrivateNetwork: boolean;
  grantedAt: number;
}

export interface SyncHostSecurityOptions {
  fetch?: typeof fetch;
  WebSocket?: typeof WebSocket;
  argon2?: {
    timeCost?: number;
    memoryKiB?: number;
    parallelism?: number;
  };
}

function typeTag(type: SyncCryptoObjectType): number {
  return (
    {
      "file-content": 1,
      "file-manifest": 2,
      "tree-manifest": 3,
      "revision-payload": 4,
      "revision-archive": 5,
      "head-payload": 6,
      "membership-payload": 7,
    } as const
  )[type];
}

function requireCryptoSize(bytes: Uint8Array): void {
  if (bytes.byteLength > MAX_CRYPTO_INPUT_BYTES) {
    throw new Error(
      `Sync crypto input exceeds ${MAX_CRYPTO_INPUT_BYTES} bytes`,
    );
  }
}

function requireWrappingKey(bytes: Uint8Array): Uint8Array {
  if (bytes.byteLength !== KEY_LENGTH) {
    throw new Error(
      `Sync wrapping key must contain exactly ${KEY_LENGTH} bytes`,
    );
  }
  return bytes.slice();
}

function objectAad(type: SyncCryptoObjectType): Uint8Array {
  return new TextEncoder().encode(
    `lapis-sync-v1:${type}:${OBJECT_ENVELOPE_VERSION}`,
  );
}

function deriveObjectKey(
  vaultKey: Uint8Array,
  epoch: number,
  purpose: SyncCryptoObjectType | "content-id",
): Uint8Array {
  if (!Number.isSafeInteger(epoch) || epoch < 1) {
    throw new Error("Sync crypto epoch must be a positive safe integer");
  }
  return hkdf(
    sha256,
    vaultKey,
    undefined,
    new TextEncoder().encode(`lapis-sync-v1:${purpose}:epoch:${epoch}`),
    KEY_LENGTH,
  );
}

function envelopeKey(pluginId: string): string {
  return `${SECURITY_PREFIX}crypto:${pluginId}`;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new Error("Pairing data is not valid base64url");
  }
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function requireAlias(value: string): string {
  const normalized = value.trim().normalize("NFC");
  if (
    !normalized ||
    normalized.length > 80 ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    throw new Error(
      "Device alias must contain between 1 and 80 printable characters",
    );
  }
  return normalized;
}

function clonePairingMetadata(value: unknown): unknown {
  if (value === undefined) return undefined;
  const bytes = new TextEncoder().encode(canonicalJson(value));
  if (bytes.byteLength > MAX_PAIRING_METADATA_BYTES) {
    bytes.fill(0);
    throw new Error("Pairing metadata exceeds the host limit");
  }
  bytes.fill(0);
  return structuredClone(value);
}

function requirePublicKey(value: string, label = "Device public key"): string {
  if (!/^[0-9a-f]{64}$/u.test(value)) {
    throw new Error(`${label} must be a 32-byte lowercase hex key`);
  }
  return value;
}

function requireRelayUrls(values: string[]): string[] {
  if (values.length < 1 || values.length > 8) {
    throw new Error("Pairing requires between one and eight relay URLs");
  }
  const result: string[] = [];
  for (const value of values) {
    const url = new URL(value);
    if (!["wss:", "ws:"].includes(url.protocol)) {
      throw new Error("Pairing relays must use wss or loopback ws");
    }
    if (url.protocol === "ws:" && !isLoopback(url.hostname)) {
      throw new Error(
        "Insecure pairing relays are limited to loopback development",
      );
    }
    url.hash = "";
    const normalized = url.href.replace(/\/$/u, "");
    if (!result.includes(normalized)) result.push(normalized);
  }
  return result;
}

function requireCutoffHeads(
  value: Record<string, string>,
): Record<string, string> {
  const entries = Object.entries(value);
  if (entries.length > 256)
    throw new Error("Sync cutoff HEADs exceed the host limit");
  return Object.fromEntries(
    entries.map(([publicKey, eventId]) => {
      requirePublicKey(publicKey);
      if (
        typeof eventId !== "string" ||
        eventId.length < 1 ||
        eventId.length > 128
      ) {
        throw new Error("Sync cutoff HEAD IDs must be bounded strings");
      }
      return [publicKey, eventId];
    }),
  );
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .filter(([, child]) => child !== undefined)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, child]) => `${JSON.stringify(key)}:${canonicalJson(child)}`)
    .join(",")}}`;
}

function cloneMembership(
  snapshot: SyncMembershipSnapshot,
): SyncMembershipSnapshot {
  return {
    ...snapshot,
    devices: snapshot.devices.map((device) => ({ ...device })),
    epochEnvelopes: snapshot.epochEnvelopes
      ? { ...snapshot.epochEnvelopes }
      : undefined,
    syncIdentity: snapshot.syncIdentity
      ? {
          ...snapshot.syncIdentity,
          history: cloneSyncIdentityHistory(snapshot.syncIdentity.history),
        }
      : undefined,
    syncIdentityEnvelopes: snapshot.syncIdentityEnvelopes
      ? { ...snapshot.syncIdentityEnvelopes }
      : undefined,
    legacyTransportCutoffHeads: snapshot.legacyTransportCutoffHeads
      ? { ...snapshot.legacyTransportCutoffHeads }
      : undefined,
    event: snapshot.event ? structuredClone(snapshot.event) : undefined,
  };
}

function cloneSyncIdentityHistory(
  history: readonly SyncIdentityHistoryEntry[] | undefined,
): SyncIdentityHistoryEntry[] {
  return (history ?? []).map((entry) => ({
    ...entry,
    cutoffHeads: entry.cutoffHeads ? { ...entry.cutoffHeads } : undefined,
  }));
}

function pairingSessionId(secret: string): string {
  return bytesToHex(
    sha256(new TextEncoder().encode(`lapis-pairing-v1:${secret}`)),
  );
}

function pairingSas(
  sessionId: string,
  firstPublicKey: string,
  secondPublicKey: string,
): string {
  const ordered = [firstPublicKey, secondPublicKey].sort().join(":");
  const digest = sha256(
    new TextEncoder().encode(`lapis-pairing-sas-v1:${sessionId}:${ordered}`),
  );
  const value =
    ((digest[0]! << 16) | (digest[1]! << 8) | digest[2]!) % 1_000_000;
  return value.toString().padStart(6, "0");
}

function networkGrantKey(pluginId: string): string {
  return `${SECURITY_PREFIX}network:${pluginId}`;
}

function normalizeOrigin(input: string): string {
  const url = new URL(input);
  if (url.username || url.password) {
    throw new Error("Network grants must not contain URL credentials");
  }
  if (!["https:", "wss:", "http:", "ws:"].includes(url.protocol)) {
    throw new Error(`Unsupported network protocol ${url.protocol}`);
  }
  return url.origin;
}

function isLoopback(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname === "::1"
  );
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
    return false;
  }
  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1]! >= 16 && parts[1]! <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 127
  );
}

function validateGrantedUrl(url: URL, grant: NetworkGrant): void {
  if (url.origin !== grant.origin)
    throw new Error(`Network origin is not granted: ${url.origin}`);
  const insecure = url.protocol === "http:" || url.protocol === "ws:";
  if (insecure && !isLoopback(url.hostname)) {
    throw new Error(
      "Insecure network protocols are limited to explicit loopback grants",
    );
  }
  if (
    (isLoopback(url.hostname) || isPrivateIpv4(url.hostname)) &&
    !grant.allowPrivateNetwork
  ) {
    throw new Error(
      `Private network access requires an explicit grant: ${url.origin}`,
    );
  }
}

function combineAbort(
  signal: AbortSignal | undefined,
  timeoutMs: number,
): { signal: AbortSignal; abort(reason?: unknown): void; dispose(): void } {
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(
    () =>
      controller.abort(
        new DOMException("Network request timed out", "TimeoutError"),
      ),
    Math.max(1, Math.min(timeoutMs, 5 * 60_000)),
  );
  return {
    signal: controller.signal,
    abort(reason) {
      controller.abort(reason);
    },
    dispose() {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", abort);
    },
  };
}

function keepRequestAlive(
  source: ReadableStream<Uint8Array>,
  dispose: () => void,
): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    dispose();
  };
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const result = await reader.read();
        if (result.done) {
          controller.close();
          finish();
          return;
        }
        controller.enqueue(result.value);
      } catch (error) {
        controller.error(error);
        finish();
      }
    },
    async cancel(reason) {
      try {
        await reader.cancel(reason);
      } finally {
        finish();
      }
    },
  });
}

export class SyncHostSecurityService {
  readonly #unlocked = new Map<string, UnlockedKeys>();
  readonly #pairingSessions = new Map<string, PairingSession>();
  readonly #pendingEnrollments = new Map<string, PendingEnrollment>();
  readonly #sockets = new Map<string, Set<WebSocket>>();
  readonly #requests = new Map<string, Set<ReturnType<typeof combineAbort>>>();
  readonly #fetch: typeof fetch;
  readonly #WebSocket: typeof WebSocket | undefined;
  readonly #argon2: {
    timeCost: number;
    memoryKiB: number;
    parallelism: number;
  };

  constructor(
    readonly database: AppDatabase,
    readonly assertRuntime: (pluginId: string, runtimeId: string) => void,
    options: SyncHostSecurityOptions = {},
  ) {
    this.#fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.#WebSocket = options.WebSocket ?? globalThis.WebSocket;
    this.#argon2 = {
      timeCost: options.argon2?.timeCost ?? 3,
      memoryKiB: options.argon2?.memoryKiB ?? 64 * 1024,
      parallelism: options.argon2?.parallelism ?? 1,
    };
  }

  async enroll(
    pluginId: string,
    passphrase: string,
    request: SyncCryptoEnrollmentRequest = { mode: "new-vault" },
  ): Promise<SyncCryptoStatus> {
    if (passphrase.length < 10) {
      throw new Error(
        "Sync unlock passphrase must contain at least 10 characters",
      );
    }
    if (await this.database.getMeta(envelopeKey(pluginId))) {
      throw new Error(`Sync crypto is already enrolled for ${pluginId}`);
    }
    const salt = randomBytes(16);
    const wrappingKey = await argon2idAsync(
      new TextEncoder().encode(passphrase),
      salt,
      {
        t: this.#argon2.timeCost,
        m: this.#argon2.memoryKiB,
        p: this.#argon2.parallelism,
        dkLen: KEY_LENGTH,
      },
    );
    try {
      return await this.#enrollWithKey(
        pluginId,
        wrappingKey,
        {
          name: "argon2id",
          timeCost: this.#argon2.timeCost,
          memoryKiB: this.#argon2.memoryKiB,
          parallelism: this.#argon2.parallelism,
          dkLen: 32,
          saltHex: bytesToHex(salt),
        },
        request,
      );
    } finally {
      wrappingKey.fill(0);
    }
  }

  async enrollWithWrappingKey(
    pluginId: string,
    wrappingKey: Uint8Array,
    descriptor: Extract<SyncWrappingKeyDescriptor, { name: "external" }>,
    request: SyncCryptoEnrollmentRequest = { mode: "new-vault" },
  ): Promise<SyncCryptoStatus> {
    const key = requireWrappingKey(wrappingKey);
    try {
      return await this.#enrollWithKey(pluginId, key, descriptor, request);
    } finally {
      key.fill(0);
    }
  }

  async unlock(
    pluginId: string,
    passphrase: string,
  ): Promise<SyncCryptoStatus> {
    const envelope = await this.database.getMeta<CryptoEnvelope>(
      envelopeKey(pluginId),
    );
    if (!envelope)
      throw new Error(`Sync crypto is not enrolled for ${pluginId}`);
    if (
      ![1, 2, 3].includes(envelope.version) ||
      envelope.kdf.name !== "argon2id" ||
      envelope.suite !== "lapis-sync-v1-xchacha20poly1305-schnorr"
    ) {
      throw new Error("Unsupported sync crypto envelope");
    }
    const wrappingKey = await argon2idAsync(
      new TextEncoder().encode(passphrase),
      hexToBytes(envelope.kdf.saltHex),
      {
        t: envelope.kdf.timeCost,
        m: envelope.kdf.memoryKiB,
        p: envelope.kdf.parallelism,
        dkLen: envelope.kdf.dkLen,
      },
    );
    try {
      return await this.#unlockWithKey(pluginId, envelope, wrappingKey);
    } finally {
      wrappingKey.fill(0);
    }
  }

  async unlockWithWrappingKey(
    pluginId: string,
    wrappingKey: Uint8Array,
  ): Promise<SyncCryptoStatus> {
    const envelope = await this.database.getMeta<CryptoEnvelope>(
      envelopeKey(pluginId),
    );
    if (!envelope)
      throw new Error(`Sync crypto is not enrolled for ${pluginId}`);
    if (
      ![1, 2, 3].includes(envelope.version) ||
      envelope.kdf.name !== "external" ||
      envelope.suite !== "lapis-sync-v1-xchacha20poly1305-schnorr"
    ) {
      throw new Error("Sync crypto enrollment requires passphrase unlock");
    }
    const key = requireWrappingKey(wrappingKey);
    try {
      return await this.#unlockWithKey(pluginId, envelope, key);
    } finally {
      key.fill(0);
    }
  }

  async #enrollWithKey(
    pluginId: string,
    wrappingKey: Uint8Array,
    descriptor: SyncWrappingKeyDescriptor,
    request: SyncCryptoEnrollmentRequest,
  ): Promise<SyncCryptoStatus> {
    if (await this.database.getMeta(envelopeKey(pluginId))) {
      throw new Error(`Sync crypto is already enrolled for ${pluginId}`);
    }
    const pending = this.#pendingEnrollments.get(pluginId);
    if (request.mode !== "new-vault") {
      if (!pending || pending.request.mode !== request.mode) {
        throw new Error(
          `No pending ${request.mode} enrollment exists for ${pluginId}`,
        );
      }
      if (
        request.sessionId &&
        pending.request.sessionId !== request.sessionId
      ) {
        throw new Error("Pending sync enrollment session does not match");
      }
    }
    const keys = pending?.material
      ? this.#materialToUnlocked(pending.material, wrappingKey, descriptor)
      : this.#createOwnerKeys(
          requireAlias(request.deviceAlias ?? "This device"),
          wrappingKey,
          descriptor,
        );
    const envelope = this.#sealEnvelope(pluginId, keys);
    const stored = await this.database.transactMeta({
      checks: [{ key: envelopeKey(pluginId), exists: false }],
      mutations: [{ key: envelopeKey(pluginId), value: envelope }],
    });
    if (!stored.applied) {
      this.#destroyKeys(keys);
      throw new Error(
        `Sync crypto enrollment changed concurrently for ${pluginId}`,
      );
    }
    this.#pendingEnrollments.delete(pluginId);
    this.#unlocked.set(pluginId, keys);
    return this.status(pluginId);
  }

  #createOwnerKeys(
    deviceAlias: string,
    wrappingKey: Uint8Array,
    kdf: SyncWrappingKeyDescriptor,
  ): UnlockedKeys {
    const deviceSecret = randomBytes(KEY_LENGTH);
    const ownerSecret = randomBytes(KEY_LENGTH);
    const recoverySecret = randomBytes(KEY_LENGTH);
    const syncSecret = randomBytes(KEY_LENGTH);
    const publicKey = getPublicKey(deviceSecret);
    const syncPublicKey = getPublicKey(syncSecret);
    const now = Date.now();
    const membership: SyncMembershipSnapshot = {
      schemaVersion: 2,
      vaultId: bytesToHex(randomBytes(16)),
      ownerPublicKey: getPublicKey(ownerSecret),
      generation: 1,
      currentEpoch: 1,
      devices: [
        {
          publicKey,
          alias: deviceAlias,
          role: "owner",
          state: "active",
          addedAt: now,
        },
      ],
      syncIdentity: {
        publicKey: syncPublicKey,
        generation: 1,
        history: [
          {
            publicKey: syncPublicKey,
            generation: 1,
            activatedMembershipGeneration: 1,
          },
        ],
      },
    };
    const syncIdentity = membership.syncIdentity!;
    const keys: UnlockedKeys = {
      vaultId: membership.vaultId,
      deviceAlias,
      role: "owner",
      currentEpoch: 1,
      membershipGeneration: 1,
      vaultKeys: new Map([[1, randomBytes(KEY_LENGTH)]]),
      deviceSecret,
      publicKey,
      ownerSecret,
      ownerPublicKey: membership.ownerPublicKey,
      recoverySecret,
      recoveryPublicKey: getPublicKey(recoverySecret),
      syncSecret,
      syncPublicKey,
      syncIdentityGeneration: 1,
      syncIdentityHistory: structuredClone(syncIdentity.history),
      membership,
      wrappingKey: wrappingKey.slice(),
      kdf: structuredClone(kdf),
    };
    this.#sealSyncIdentity(keys, keys.membership);
    keys.membership.event = this.#signMembership(keys, keys.membership);
    return keys;
  }

  #materialToUnlocked(
    material: StoredKeyMaterial,
    wrappingKey: Uint8Array,
    kdf: SyncWrappingKeyDescriptor,
  ): UnlockedKeys {
    if (material.schemaVersion !== 2 && material.schemaVersion !== 3) {
      throw new Error("Unsupported sync key material");
    }
    const vaultKeys = new Map<number, Uint8Array>();
    for (const [epochText, value] of Object.entries(material.vaultKeys)) {
      const epoch = Number(epochText);
      const key = hexToBytes(value);
      if (
        !Number.isSafeInteger(epoch) ||
        epoch < 1 ||
        key.byteLength !== KEY_LENGTH
      ) {
        key.fill(0);
        throw new Error("Sync key material contains an invalid epoch key");
      }
      vaultKeys.set(epoch, key);
    }
    if (!vaultKeys.has(material.currentEpoch)) {
      throw new Error("Sync key material is missing its current epoch");
    }
    const deviceSecret = hexToBytes(material.deviceSecretHex);
    const ownerSecret = material.ownerSecretHex
      ? hexToBytes(material.ownerSecretHex)
      : undefined;
    const recoverySecret = material.recoverySecretHex
      ? hexToBytes(material.recoverySecretHex)
      : undefined;
    const syncSecret =
      material.schemaVersion === 3 && material.syncSecretHex
        ? hexToBytes(material.syncSecretHex)
        : undefined;
    const pendingSyncSecret =
      material.schemaVersion === 3 && material.pendingSyncSecretHex
        ? hexToBytes(material.pendingSyncSecretHex)
        : undefined;
    if (
      deviceSecret.byteLength !== KEY_LENGTH ||
      (ownerSecret && ownerSecret.byteLength !== KEY_LENGTH) ||
      (recoverySecret && recoverySecret.byteLength !== KEY_LENGTH) ||
      (syncSecret && syncSecret.byteLength !== KEY_LENGTH) ||
      (pendingSyncSecret && pendingSyncSecret.byteLength !== KEY_LENGTH)
    ) {
      throw new Error("Sync key material contains an invalid secret length");
    }
    const publicKey = getPublicKey(deviceSecret);
    if (
      (ownerSecret && getPublicKey(ownerSecret) !== material.ownerPublicKey) ||
      (recoverySecret &&
        getPublicKey(recoverySecret) !== material.recoveryPublicKey) ||
      (syncSecret &&
        getPublicKey(syncSecret) !==
          (material.schemaVersion === 3
            ? material.syncPublicKey
            : undefined)) ||
      (pendingSyncSecret &&
        getPublicKey(pendingSyncSecret) !==
          (material.schemaVersion === 3
            ? material.pendingSyncPublicKey
            : undefined))
    ) {
      throw new Error("Sync key material authority verification failed");
    }
    return {
      vaultId: material.vaultId,
      deviceAlias: requireAlias(material.deviceAlias),
      role: material.role,
      currentEpoch: material.currentEpoch,
      membershipGeneration: material.membershipGeneration,
      vaultKeys,
      deviceSecret,
      publicKey,
      ownerSecret,
      ownerPublicKey: requirePublicKey(
        material.ownerPublicKey,
        "Owner public key",
      ),
      recoverySecret,
      recoveryPublicKey: requirePublicKey(
        material.recoveryPublicKey,
        "Recovery public key",
      ),
      syncSecret,
      syncPublicKey:
        material.schemaVersion === 3 && material.syncPublicKey
          ? requirePublicKey(material.syncPublicKey, "Sync public key")
          : undefined,
      syncIdentityGeneration:
        material.schemaVersion === 3 ? material.syncIdentityGeneration : 0,
      syncIdentityHistory:
        material.schemaVersion === 3
          ? cloneSyncIdentityHistory(material.syncIdentityHistory)
          : [],
      pendingSyncSecret,
      pendingSyncPublicKey:
        material.schemaVersion === 3 && material.pendingSyncPublicKey
          ? requirePublicKey(
              material.pendingSyncPublicKey,
              "Pending Sync public key",
            )
          : undefined,
      membership: cloneMembership(material.membership),
      wrappingKey: wrappingKey.slice(),
      kdf: structuredClone(kdf),
    };
  }

  #keyMaterial(keys: UnlockedKeys): StoredKeyMaterialV3 {
    return {
      schemaVersion: 3,
      vaultId: keys.vaultId,
      deviceAlias: keys.deviceAlias,
      role: keys.role,
      currentEpoch: keys.currentEpoch,
      membershipGeneration: keys.membershipGeneration,
      vaultKeys: Object.fromEntries(
        [...keys.vaultKeys.entries()]
          .sort(([left], [right]) => left - right)
          .map(([epoch, key]) => [String(epoch), bytesToHex(key)]),
      ),
      deviceSecretHex: bytesToHex(keys.deviceSecret),
      ownerSecretHex: keys.ownerSecret
        ? bytesToHex(keys.ownerSecret)
        : undefined,
      ownerPublicKey: keys.ownerPublicKey,
      recoverySecretHex: keys.recoverySecret
        ? bytesToHex(keys.recoverySecret)
        : undefined,
      recoveryPublicKey: keys.recoveryPublicKey,
      syncSecretHex: keys.syncSecret ? bytesToHex(keys.syncSecret) : undefined,
      syncPublicKey: keys.syncPublicKey,
      syncIdentityGeneration: keys.syncIdentityGeneration,
      syncIdentityHistory: cloneSyncIdentityHistory(keys.syncIdentityHistory),
      pendingSyncSecretHex: keys.pendingSyncSecret
        ? bytesToHex(keys.pendingSyncSecret)
        : undefined,
      pendingSyncPublicKey: keys.pendingSyncPublicKey,
      membership: cloneMembership(keys.membership),
    };
  }

  #sealEnvelope(pluginId: string, keys: UnlockedKeys): CryptoEnvelopeV3 {
    const nonce = randomBytes(NONCE_LENGTH);
    const plaintext = new TextEncoder().encode(
      canonicalJson(this.#keyMaterial(keys)),
    );
    const ciphertext = xchacha20poly1305(
      keys.wrappingKey,
      nonce,
      new TextEncoder().encode(`lapis-sync-envelope:${pluginId}:v3`),
    ).encrypt(plaintext);
    plaintext.fill(0);
    return {
      version: KEY_ENVELOPE_VERSION,
      suite: "lapis-sync-v1-xchacha20poly1305-schnorr",
      kdf: structuredClone(keys.kdf),
      nonceHex: bytesToHex(nonce),
      ciphertextHex: bytesToHex(ciphertext),
      publicKey: keys.publicKey,
      vaultId: keys.vaultId,
      deviceAlias: keys.deviceAlias,
      role: keys.role,
      deviceState: this.#deviceState(keys),
      currentEpoch: keys.currentEpoch,
      membershipGeneration: keys.membershipGeneration,
      ownerPublicKey: keys.ownerPublicKey,
      recoveryPublicKey: keys.recoveryPublicKey,
      syncIdentityState: this.#syncIdentityState(keys),
      syncPublicKey: keys.syncPublicKey,
      syncIdentityGeneration: keys.syncIdentityGeneration,
      pendingSyncPublicKey: keys.pendingSyncPublicKey,
    };
  }

  #decodeKeyMaterial(
    plaintext: Uint8Array,
    wrappingKey: Uint8Array,
    kdf: SyncWrappingKeyDescriptor,
  ): UnlockedKeys {
    let parsed: StoredKeyMaterial;
    try {
      parsed = JSON.parse(
        new TextDecoder().decode(plaintext),
      ) as StoredKeyMaterial;
    } catch {
      throw new Error("Sync crypto envelope is invalid");
    }
    return this.#materialToUnlocked(parsed, wrappingKey, kdf);
  }

  #migrateLegacyKeys(
    envelope: CryptoEnvelopeV1,
    plaintext: Uint8Array,
    wrappingKey: Uint8Array,
  ): UnlockedKeys {
    if (plaintext.byteLength !== KEY_LENGTH * 2) {
      throw new Error("Sync crypto envelope is invalid");
    }
    const keys = this.#createOwnerKeys(
      "This device",
      wrappingKey,
      envelope.kdf,
    );
    keys.vaultKeys.get(1)?.fill(0);
    keys.vaultKeys.set(1, plaintext.slice(0, KEY_LENGTH));
    keys.deviceSecret.fill(0);
    keys.deviceSecret = plaintext.slice(KEY_LENGTH);
    keys.publicKey = envelope.publicKey;
    keys.membership.devices[0]!.publicKey = envelope.publicKey;
    keys.membership.event = this.#signMembership(keys, keys.membership);
    return keys;
  }

  #destroyKeys(keys: UnlockedKeys): void {
    for (const key of keys.vaultKeys.values()) key.fill(0);
    keys.deviceSecret.fill(0);
    keys.ownerSecret?.fill(0);
    keys.recoverySecret?.fill(0);
    keys.syncSecret?.fill(0);
    keys.pendingSyncSecret?.fill(0);
    keys.wrappingKey.fill(0);
  }

  #vaultKey(keys: UnlockedKeys, epoch: number): Uint8Array {
    const key = keys.vaultKeys.get(epoch);
    if (!key) throw new Error(`Sync crypto epoch ${epoch} is unavailable`);
    return key;
  }

  async #persistKeys(pluginId: string, keys: UnlockedKeys): Promise<void> {
    await this.database.setMeta(
      envelopeKey(pluginId),
      this.#sealEnvelope(pluginId, keys),
    );
  }

  #signMembership(
    keys: UnlockedKeys,
    snapshot: SyncMembershipSnapshot,
    encryptionEpoch = snapshot.currentEpoch,
  ): NostrEvent {
    if (!keys.ownerSecret)
      throw new Error("Only the owner may sign membership");
    const publicSnapshot = { ...cloneMembership(snapshot), event: undefined };
    const plaintext = new TextEncoder().encode(canonicalJson(publicSnapshot));
    const nonce = randomBytes(NONCE_LENGTH);
    const ciphertext = xchacha20poly1305(
      deriveObjectKey(
        this.#vaultKey(keys, encryptionEpoch),
        encryptionEpoch,
        "membership-payload",
      ),
      nonce,
      objectAad("membership-payload"),
    ).encrypt(plaintext);
    plaintext.fill(0);
    const envelope = new Uint8Array(5 + NONCE_LENGTH + ciphertext.byteLength);
    envelope[0] = OBJECT_ENVELOPE_VERSION;
    new DataView(envelope.buffer).setUint32(1, encryptionEpoch, false);
    envelope.set(nonce, 5);
    envelope.set(ciphertext, 5 + NONCE_LENGTH);
    return finalizeEvent(
      {
        kind: MEMBERSHIP_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["d", `lapis-sync-v1:${keys.vaultId}:membership`]],
        content: toBase64Url(envelope),
      },
      keys.ownerSecret,
    );
  }

  async #unlockWithKey(
    pluginId: string,
    envelope: CryptoEnvelope,
    wrappingKey: Uint8Array,
  ): Promise<SyncCryptoStatus> {
    let plaintext: Uint8Array;
    try {
      plaintext = xchacha20poly1305(
        wrappingKey,
        hexToBytes(envelope.nonceHex),
        new TextEncoder().encode(
          `lapis-sync-envelope:${pluginId}:v${envelope.version}`,
        ),
      ).decrypt(hexToBytes(envelope.ciphertextHex));
    } catch {
      throw new Error("Sync unlock failed");
    }
    const keys =
      envelope.version === 1
        ? this.#migrateLegacyKeys(envelope, plaintext, wrappingKey)
        : this.#decodeKeyMaterial(plaintext, wrappingKey, envelope.kdf);
    plaintext.fill(0);
    if (getPublicKey(keys.deviceSecret) !== envelope.publicKey) {
      this.#destroyKeys(keys);
      throw new Error("Sync crypto public key verification failed");
    }
    this.lock(pluginId);
    this.#unlocked.set(pluginId, keys);
    if (envelope.version < 3) {
      await this.database.setMeta(
        envelopeKey(pluginId),
        this.#sealEnvelope(pluginId, keys),
      );
    }
    return this.status(pluginId);
  }

  lock(pluginId: string): void {
    const keys = this.#unlocked.get(pluginId);
    if (keys) this.#destroyKeys(keys);
    this.#unlocked.delete(pluginId);
  }

  async status(pluginId: string): Promise<SyncCryptoStatus> {
    const unlocked = this.#unlocked.get(pluginId);
    if (unlocked) {
      return {
        state: "unlocked",
        suite: "lapis-sync-v1-xchacha20poly1305-schnorr",
        publicKey: unlocked.publicKey,
        devicePublicKey: unlocked.publicKey,
        vaultId: unlocked.vaultId,
        deviceAlias: unlocked.deviceAlias,
        role: unlocked.role,
        deviceState: this.#deviceState(unlocked),
        currentEpoch: unlocked.currentEpoch,
        membershipGeneration: unlocked.membershipGeneration,
        canManageDevices: unlocked.role === "owner",
        syncIdentity: this.#syncIdentityStatus(unlocked),
      };
    }
    const envelope = await this.database.getMeta<CryptoEnvelope>(
      envelopeKey(pluginId),
    );
    return envelope
      ? {
          state: "locked",
          suite: envelope.suite,
          publicKey: envelope.publicKey,
          devicePublicKey: envelope.publicKey,
          ...(envelope.version === 2 || envelope.version === 3
            ? {
                vaultId: envelope.vaultId,
                deviceAlias: envelope.deviceAlias,
                role: envelope.role,
                deviceState: envelope.deviceState,
                currentEpoch: envelope.currentEpoch,
                membershipGeneration: envelope.membershipGeneration,
                canManageDevices: envelope.role === "owner",
                ...(envelope.version === 3
                  ? {
                      syncIdentity: {
                        state: envelope.syncIdentityState,
                        publicKey: envelope.syncPublicKey,
                        generation: envelope.syncIdentityGeneration,
                        history: [],
                        pendingPublicKey: envelope.pendingSyncPublicKey,
                        canRotate: envelope.role === "owner",
                      } satisfies SyncIdentityPublicStatus,
                    }
                  : {
                      syncIdentity: {
                        state: "setup-required" as const,
                        generation: 0,
                        history: [],
                        canRotate: envelope.role === "owner",
                      },
                    }),
              }
            : {}),
        }
      : {
          state: "unenrolled",
          suite: "lapis-sync-v1-xchacha20poly1305-schnorr",
        };
  }

  crypto(
    pluginId: string,
    runtimeId: string,
    assertGranted: () => void = () => undefined,
    requestUnlock?: () => Promise<SyncCryptoStatus>,
    requestEnrollment?: (
      input: SyncCryptoEnrollmentRequest,
    ) => Promise<SyncCryptoStatus>,
  ): SyncCryptoCapability {
    const keys = () => {
      assertGranted();
      this.assertRuntime(pluginId, runtimeId);
      const value = this.#unlocked.get(pluginId);
      if (!value) throw new Error(`Sync crypto is locked for ${pluginId}`);
      return value;
    };
    return {
      status: async () => {
        assertGranted();
        this.assertRuntime(pluginId, runtimeId);
        return this.status(pluginId);
      },
      enrollNewVault: async ({ deviceAlias }) => {
        assertGranted();
        this.assertRuntime(pluginId, runtimeId);
        const status = await this.status(pluginId);
        if (status.state !== "unenrolled") {
          throw new Error(`Sync crypto is already enrolled for ${pluginId}`);
        }
        if (!requestEnrollment) {
          throw new Error(
            `The host has no sync enrollment flow for ${pluginId}`,
          );
        }
        return requestEnrollment({
          mode: "new-vault",
          deviceAlias: requireAlias(deviceAlias),
        });
      },
      requestUnlock: async () => {
        assertGranted();
        this.assertRuntime(pluginId, runtimeId);
        const status = await this.status(pluginId);
        if (status.state === "unenrolled") {
          throw new Error(
            `Sync enrollment is required for ${pluginId}; unlock cannot create a vault`,
          );
        }
        if (status.state === "unlocked") return status;
        if (!requestUnlock) {
          throw new Error(`The host has no sync unlock flow for ${pluginId}`);
        }
        return requestUnlock();
      },
      getDevicePublicKey: async () => keys().publicKey,
      encryptObject: async ({ epoch, type, plaintext }) => {
        this.#assertDeviceActive(keys());
        if (epoch !== keys().currentEpoch) {
          throw new Error("New sync objects must use the current key epoch");
        }
        requireCryptoSize(plaintext);
        const nonce = randomBytes(NONCE_LENGTH);
        const ciphertext = xchacha20poly1305(
          deriveObjectKey(this.#vaultKey(keys(), epoch), epoch, type),
          nonce,
          objectAad(type),
        ).encrypt(plaintext);
        const bytes = new Uint8Array(2 + NONCE_LENGTH + ciphertext.byteLength);
        bytes[0] = OBJECT_ENVELOPE_VERSION;
        bytes[1] = typeTag(type);
        bytes.set(nonce, 2);
        bytes.set(ciphertext, 2 + NONCE_LENGTH);
        return { bytes, objectHash: bytesToHex(sha256(bytes)) };
      },
      decryptObject: async ({ epoch, type, envelope }) => {
        requireCryptoSize(envelope);
        if (
          envelope.byteLength < 2 + NONCE_LENGTH + 16 ||
          envelope[0] !== OBJECT_ENVELOPE_VERSION ||
          envelope[1] !== typeTag(type)
        ) {
          throw new Error("Encrypted sync object envelope is invalid");
        }
        try {
          return xchacha20poly1305(
            deriveObjectKey(this.#vaultKey(keys(), epoch), epoch, type),
            envelope.slice(2, 2 + NONCE_LENGTH),
            objectAad(type),
          ).decrypt(envelope.slice(2 + NONCE_LENGTH));
        } catch {
          throw new Error("Encrypted sync object authentication failed");
        }
      },
      calculateContentId: async ({ epoch, plaintext }) => {
        requireCryptoSize(plaintext);
        return bytesToHex(
          hmac(
            sha256,
            deriveObjectKey(this.#vaultKey(keys(), epoch), epoch, "content-id"),
            plaintext,
          ),
        );
      },
      signEvent: async (event) => {
        this.#assertDeviceActive(keys());
        if (
          !Number.isSafeInteger(event.kind) ||
          !Number.isSafeInteger(event.created_at)
        ) {
          throw new Error(
            "Sync event kind and timestamp must be safe integers",
          );
        }
        if (event.content.length > 2 * 1024 * 1024 || event.tags.length > 256) {
          throw new Error("Sync event exceeds the signing policy");
        }
        return finalizeEvent(event, keys().deviceSecret);
      },
      signDeviceEvent: async (event) => {
        const value = keys();
        this.#assertDeviceActive(value);
        if (![78, 30_078].includes(event.kind)) {
          throw new Error(
            "Device attestations are limited to revision and HEAD kinds",
          );
        }
        this.#validateUnsignedEvent(event);
        return finalizeEvent(event, value.deviceSecret);
      },
    };
  }

  syncIdentity(
    pluginId: string,
    runtimeId: string,
    assertGranted: () => void = () => undefined,
  ): SyncIdentityCapability {
    const keys = () => {
      assertGranted();
      this.assertRuntime(pluginId, runtimeId);
      return this.#requireUnlocked(pluginId);
    };
    return {
      status: async () => this.#syncIdentityStatus(keys()),
      initialize: async ({ cutoffHeads }) => {
        const value = keys();
        this.#assertOwner(value);
        this.#assertDeviceActive(value);
        if (value.syncSecret || value.syncPublicKey) {
          throw new Error("The vault Sync Identity is already initialized");
        }
        const previousMembership = cloneMembership(value.membership);
        const previousMembershipGeneration = value.membershipGeneration;
        const secret = randomBytes(KEY_LENGTH);
        const publicKey = getPublicKey(secret);
        value.syncSecret = secret;
        value.syncPublicKey = publicKey;
        value.syncIdentityGeneration = 1;
        value.syncIdentityHistory = [
          {
            publicKey,
            generation: 1,
            activatedMembershipGeneration: value.membershipGeneration + 1,
          },
        ];
        const snapshot = cloneMembership(value.membership);
        snapshot.schemaVersion = 2;
        snapshot.legacyTransportCutoffHeads = requireCutoffHeads(cutoffHeads);
        snapshot.syncIdentity = {
          publicKey,
          generation: 1,
          history: cloneSyncIdentityHistory(value.syncIdentityHistory),
        };
        this.#sealSyncIdentity(value, snapshot);
        try {
          await this.#advanceMembership(pluginId, value, snapshot);
        } catch (error) {
          secret.fill(0);
          value.syncSecret = undefined;
          value.syncPublicKey = undefined;
          value.syncIdentityGeneration = 0;
          value.syncIdentityHistory = [];
          value.membership = previousMembership;
          value.membershipGeneration = previousMembershipGeneration;
          throw error;
        }
        return {
          status: this.#syncIdentityStatus(value),
          membershipEvent: structuredClone(value.membership.event!),
        };
      },
      signEvent: async ({ purpose, identity = "active", event }) => {
        const value = keys();
        this.#assertDeviceActive(value);
        this.#validateSyncIdentityEvent(purpose, event);
        const secret =
          identity === "pending" ? value.pendingSyncSecret : value.syncSecret;
        const expectedPublicKey =
          identity === "pending"
            ? value.pendingSyncPublicKey
            : value.syncPublicKey;
        if (!secret || !expectedPublicKey) {
          throw new Error(`The ${identity} vault Sync Identity is unavailable`);
        }
        const signed = finalizeEvent(event, secret);
        if (signed.pubkey !== expectedPublicKey) {
          throw new Error("Sync Identity public key verification failed");
        }
        return signed;
      },
      beginRotation: async () => {
        const value = keys();
        this.#assertOwner(value);
        this.#assertDeviceActive(value);
        if (!value.syncSecret || !value.syncPublicKey) {
          throw new Error(
            "Initialize the vault Sync Identity before rotating it",
          );
        }
        if (!value.pendingSyncSecret) {
          const pendingSecret = randomBytes(KEY_LENGTH);
          value.pendingSyncSecret = pendingSecret;
          value.pendingSyncPublicKey = getPublicKey(pendingSecret);
          try {
            await this.#persistKeys(pluginId, value);
          } catch (error) {
            pendingSecret.fill(0);
            value.pendingSyncSecret = undefined;
            value.pendingSyncPublicKey = undefined;
            throw error;
          }
        }
        return this.#syncIdentityStatus(value);
      },
      commitRotation: async ({ pendingPublicKey, cutoffHeads }) => {
        const value = keys();
        this.#assertOwner(value);
        this.#assertDeviceActive(value);
        if (
          !value.syncSecret ||
          !value.syncPublicKey ||
          !value.pendingSyncSecret ||
          value.pendingSyncPublicKey !==
            requirePublicKey(pendingPublicKey, "Pending Sync public key")
        ) {
          throw new Error("The pending Sync Identity does not match");
        }
        const nextMembershipGeneration = value.membershipGeneration + 1;
        const history = cloneSyncIdentityHistory(value.syncIdentityHistory);
        const active = history.find(
          (entry) => entry.generation === value.syncIdentityGeneration,
        );
        if (!active || active.publicKey !== value.syncPublicKey) {
          throw new Error("Sync Identity history is inconsistent");
        }
        active.retiredMembershipGeneration = nextMembershipGeneration;
        active.cutoffHeads = requireCutoffHeads(cutoffHeads);
        const nextGeneration = value.syncIdentityGeneration + 1;
        history.push({
          publicKey: value.pendingSyncPublicKey,
          generation: nextGeneration,
          activatedMembershipGeneration: nextMembershipGeneration,
        });
        const previousSecret = value.syncSecret;
        const previousPublicKey = value.syncPublicKey;
        const previousGeneration = value.syncIdentityGeneration;
        const previousHistory = cloneSyncIdentityHistory(
          value.syncIdentityHistory,
        );
        const previousMembership = cloneMembership(value.membership);
        const previousMembershipGeneration = value.membershipGeneration;
        const pendingSecret = value.pendingSyncSecret;
        const pendingKey = value.pendingSyncPublicKey;
        value.syncSecret = pendingSecret;
        value.syncPublicKey = pendingKey;
        value.syncIdentityGeneration = nextGeneration;
        value.syncIdentityHistory = history;
        value.pendingSyncSecret = undefined;
        value.pendingSyncPublicKey = undefined;
        const snapshot = cloneMembership(value.membership);
        snapshot.schemaVersion = 2;
        snapshot.syncIdentity = {
          publicKey: value.syncPublicKey,
          generation: nextGeneration,
          history: cloneSyncIdentityHistory(history),
        };
        this.#sealSyncIdentity(value, snapshot);
        try {
          await this.#advanceMembership(pluginId, value, snapshot);
        } catch (error) {
          value.syncSecret = previousSecret;
          value.syncPublicKey = previousPublicKey;
          value.syncIdentityGeneration = previousGeneration;
          value.syncIdentityHistory = previousHistory;
          value.pendingSyncSecret = pendingSecret;
          value.pendingSyncPublicKey = pendingKey;
          value.membership = previousMembership;
          value.membershipGeneration = previousMembershipGeneration;
          throw error;
        }
        previousSecret.fill(0);
        return {
          status: this.#syncIdentityStatus(value),
          membershipEvent: structuredClone(value.membership.event!),
        };
      },
      cancelRotation: async () => {
        const value = keys();
        this.#assertOwner(value);
        const pendingSecret = value.pendingSyncSecret;
        const pendingPublicKey = value.pendingSyncPublicKey;
        value.pendingSyncSecret = undefined;
        value.pendingSyncPublicKey = undefined;
        try {
          await this.#persistKeys(pluginId, value);
        } catch (error) {
          value.pendingSyncSecret = pendingSecret;
          value.pendingSyncPublicKey = pendingPublicKey;
          throw error;
        }
        pendingSecret?.fill(0);
        return this.#syncIdentityStatus(value);
      },
    };
  }

  pairing(
    pluginId: string,
    runtimeId: string,
    assertGranted: () => void = () => undefined,
    requestEnrollment?: (
      input: SyncCryptoEnrollmentRequest,
    ) => Promise<SyncCryptoStatus>,
  ): SyncPairingCapability {
    const assertActive = () => {
      assertGranted();
      this.assertRuntime(pluginId, runtimeId);
    };
    const getSession = (sessionId: string): PairingSession => {
      assertActive();
      const session = this.#pairingSessions.get(`${pluginId}:${sessionId}`);
      if (!session) throw new Error("Pairing session is unavailable");
      if (Date.now() >= session.expiresAt && session.state !== "complete") {
        this.#expirePairingSession(session);
        throw new Error("Pairing session expired");
      }
      return session;
    };
    const result = (
      session: PairingSession,
      outboundEvents: NostrEvent[] = [],
      extras: Pick<
        SyncPairingActionResult,
        "invitationUri" | "membershipEvent" | "metadata"
      > = {},
    ): SyncPairingActionResult => ({
      session: this.#pairingSnapshot(session),
      outboundEvents,
      relayUrls: [...session.relays],
      ...extras,
    });

    return {
      beginOwner: async ({ relayUrls, cutoffHeads = {}, metadata }) => {
        assertActive();
        const keys = this.#requireUnlocked(pluginId);
        if (keys.role !== "owner" || !keys.ownerSecret) {
          throw new Error("Only the owner device may begin pairing");
        }
        const ephemeralSecret = randomBytes(KEY_LENGTH);
        const sessionSecret = toBase64Url(randomBytes(KEY_LENGTH));
        const sessionId = pairingSessionId(sessionSecret);
        const expiresAt = Date.now() + PAIRING_TTL_MS;
        const relays = requireRelayUrls(relayUrls);
        const session: PairingSession = {
          pluginId,
          sessionId,
          role: "owner",
          state: "waiting-for-peer",
          expiresAt,
          ephemeralSecret,
          ephemeralPublicKey: getPublicKey(ephemeralSecret),
          sessionSecret,
          relays,
          sequence: 0,
          lastReceivedSequence: 0,
          localConfirmed: false,
          peerConfirmed: false,
          cutoffHeads: { ...cutoffHeads },
          metadata: clonePairingMetadata(metadata),
          seenEventIds: new Set(),
        };
        this.#pairingSessions.set(`${pluginId}:${sessionId}`, session);
        const invitation: PairingInvitationPayload = {
          v: 1,
          p: session.ephemeralPublicKey,
          s: sessionSecret,
          e: expiresAt,
          r: relays,
        };
        const data = toBase64Url(
          new TextEncoder().encode(canonicalJson(invitation)),
        );
        const invitationUri = `lapis://sync-pair?v=1&data=${data}`;
        if (invitationUri.length > 2_048) {
          this.#expirePairingSession(session);
          throw new Error("Pairing invitation exceeds the app URL limit");
        }
        return result(session, [], { invitationUri });
      },
      acceptInvite: async ({ invitationUri, deviceAlias }) => {
        assertActive();
        if ((await this.status(pluginId)).state !== "unenrolled") {
          throw new Error(
            "Pairing import requires an unenrolled sync identity",
          );
        }
        const invitation = this.#parsePairingInvitation(invitationUri);
        if (Date.now() >= invitation.e)
          throw new Error("Pairing invitation expired");
        const ephemeralSecret = randomBytes(KEY_LENGTH);
        const pendingDeviceSecret = randomBytes(KEY_LENGTH);
        const sessionId = pairingSessionId(invitation.s);
        const session: PairingSession = {
          pluginId,
          sessionId,
          role: "joining",
          state: "waiting-for-sas",
          expiresAt: Math.min(invitation.e, Date.now() + PAIRING_TTL_MS),
          ephemeralSecret,
          ephemeralPublicKey: getPublicKey(ephemeralSecret),
          sessionSecret: invitation.s,
          relays: requireRelayUrls(invitation.r),
          sequence: 0,
          lastReceivedSequence: 0,
          peerEphemeralPublicKey: requirePublicKey(
            invitation.p,
            "Pairing public key",
          ),
          peerAlias: undefined,
          localConfirmed: false,
          peerConfirmed: false,
          cutoffHeads: {},
          pendingDeviceSecret,
          seenEventIds: new Set(),
        };
        this.#pairingSessions.set(`${pluginId}:${sessionId}`, session);
        const event = this.#createPairingEvent(session, {
          type: "hello",
          devicePublicKey: getPublicKey(pendingDeviceSecret),
          deviceAlias: requireAlias(deviceAlias),
        });
        return result(session, [event]);
      },
      ingest: async ({ sessionId, event }) => {
        const session = getSession(sessionId);
        const message = this.#readPairingEvent(session, event);
        const outbound: NostrEvent[] = [];
        let membershipEvent: NostrEvent | undefined;
        if (message.type === "abort") {
          this.#expirePairingSession(session, "cancelled");
          return result(session);
        }
        if (message.type === "hello") {
          if (
            session.role !== "owner" ||
            session.state !== "waiting-for-peer"
          ) {
            throw new Error("Unexpected pairing hello");
          }
          session.peerEphemeralPublicKey = event.pubkey;
          session.peerDevicePublicKey = requirePublicKey(
            message.devicePublicKey ?? "",
          );
          session.peerAlias = requireAlias(message.deviceAlias ?? "");
          session.sas = pairingSas(
            session.sessionId,
            session.ephemeralPublicKey,
            event.pubkey,
          );
          session.state = "waiting-for-confirmation";
          outbound.push(this.#createPairingEvent(session, { type: "ack" }));
        } else if (message.type === "ack") {
          if (
            session.role !== "joining" ||
            session.state !== "waiting-for-sas"
          ) {
            throw new Error("Unexpected pairing acknowledgement");
          }
          session.sas = pairingSas(
            session.sessionId,
            session.ephemeralPublicKey,
            event.pubkey,
          );
          session.state = "waiting-for-confirmation";
        } else if (message.type === "confirm") {
          session.peerConfirmed = true;
          if (session.role === "owner" && session.localConfirmed) {
            const transfer = await this.#preparePairingTransfer(
              pluginId,
              session,
            );
            membershipEvent = transfer.membership.event;
            outbound.push(
              this.#createPairingEvent(session, {
                type: "transfer",
                payload: transfer,
              }),
            );
            session.state = "transferring";
          }
        } else if (message.type === "transfer") {
          if (
            session.role !== "joining" ||
            !session.localConfirmed ||
            !session.peerConfirmed ||
            !session.pendingDeviceSecret ||
            !message.payload
          ) {
            throw new Error("Unexpected pairing transfer");
          }
          const transfer = message.payload;
          transfer.metadata = clonePairingMetadata(transfer.metadata);
          const member = transfer.membership.devices.find(
            (device) =>
              device.publicKey === getPublicKey(session.pendingDeviceSecret!),
          );
          if (!member || member.state !== "active") {
            throw new Error("Pairing transfer does not authorise this device");
          }
          const material: StoredKeyMaterialV3 = {
            schemaVersion: 3,
            vaultId: transfer.vaultId,
            deviceAlias: member.alias,
            role: "member",
            currentEpoch: transfer.currentEpoch,
            membershipGeneration: transfer.membership.generation,
            vaultKeys: { ...transfer.vaultKeys },
            deviceSecretHex: bytesToHex(session.pendingDeviceSecret),
            ownerPublicKey: transfer.ownerPublicKey,
            recoveryPublicKey: transfer.recoveryPublicKey,
            syncSecretHex: transfer.syncSecretHex,
            syncPublicKey: transfer.syncPublicKey,
            syncIdentityGeneration: transfer.syncIdentityGeneration,
            syncIdentityHistory: cloneSyncIdentityHistory(
              transfer.syncIdentityHistory,
            ),
            membership: cloneMembership(transfer.membership),
          };
          session.pendingTransfer = transfer;
          session.state = "ready-to-enroll";
          this.#pendingEnrollments.set(pluginId, {
            request: {
              mode: "paired-device",
              deviceAlias: member.alias,
              sessionId: session.sessionId,
            },
            material,
          });
        } else if (message.type === "complete") {
          if (session.role !== "owner" || session.state !== "transferring") {
            throw new Error("Unexpected pairing completion");
          }
          session.state = "complete";
          this.#destroyPairingSecrets(session);
        } else {
          throw new Error(`Unexpected pairing message ${message.type}`);
        }
        return result(session, outbound, {
          membershipEvent,
          metadata:
            session.role === "joining"
              ? session.pendingTransfer?.metadata
              : undefined,
        });
      },
      confirm: async (sessionId, sas) => {
        const session = getSession(sessionId);
        if (session.state === "ready-to-enroll") {
          if (!requestEnrollment) {
            throw new Error(
              `The host has no sync enrollment flow for ${pluginId}`,
            );
          }
          const status = await requestEnrollment({
            mode: "paired-device",
            deviceAlias: session.peerAlias,
            sessionId,
          });
          if (status.state !== "unlocked") {
            throw new Error(
              "The host did not complete paired-device enrollment",
            );
          }
          session.pendingDeviceSecret?.fill(0);
          session.pendingDeviceSecret = undefined;
          session.state = "complete";
          const completeEvent = this.#createPairingEvent(session, {
            type: "complete",
          });
          this.#destroyPairingSecrets(session);
          return result(session, [completeEvent], {
            metadata: session.pendingTransfer?.metadata,
          });
        }
        if (session.state !== "waiting-for-confirmation") {
          throw new Error("Pairing session is not waiting for confirmation");
        }
        if (!session.sas || sas !== session.sas) {
          throw new Error("Pairing SAS does not match this session");
        }
        session.localConfirmed = true;
        const outbound = [
          this.#createPairingEvent(session, { type: "confirm" }),
        ];
        let membershipEvent: NostrEvent | undefined;
        if (session.role === "owner" && session.peerConfirmed) {
          const transfer = await this.#preparePairingTransfer(
            pluginId,
            session,
          );
          membershipEvent = transfer.membership.event;
          outbound.push(
            this.#createPairingEvent(session, {
              type: "transfer",
              payload: transfer,
            }),
          );
          session.state = "transferring";
        }
        return result(session, outbound, { membershipEvent });
      },
      cancel: async (sessionId) => {
        const session = getSession(sessionId);
        this.#expirePairingSession(session, "cancelled");
        return this.#pairingSnapshot(session);
      },
      createRelayProbe: async () => {
        assertActive();
        const sender = randomBytes(KEY_LENGTH);
        const recipient = randomBytes(KEY_LENGTH);
        try {
          const recipientPublicKey = getPublicKey(recipient);
          const content = nip44.encrypt(
            canonicalJson({ type: "lapis-pairing-relay-probe", v: 1 }),
            nip44.utils.getConversationKey(sender, recipientPublicKey),
          );
          return finalizeEvent(
            {
              kind: PAIRING_KIND,
              created_at: Math.floor(Date.now() / 1000),
              tags: [
                ["p", recipientPublicKey],
                ["d", bytesToHex(randomBytes(16))],
                ["expiration", String(Math.floor(Date.now() / 1000) + 120)],
              ],
              content,
            },
            sender,
          );
        } finally {
          sender.fill(0);
          recipient.fill(0);
        }
      },
    };
  }

  membership(
    pluginId: string,
    runtimeId: string,
    assertGranted: () => void = () => undefined,
  ): SyncMembershipCapability {
    const keys = () => {
      assertGranted();
      this.assertRuntime(pluginId, runtimeId);
      return this.#requireUnlocked(pluginId);
    };
    return {
      getSnapshot: async () => cloneMembership(keys().membership),
      ingest: async (event) => {
        const value = keys();
        const snapshot = this.#decryptMembership(value, event);
        if (snapshot.vaultId !== value.vaultId) {
          throw new Error("Membership event belongs to another sync vault");
        }
        if (
          snapshot.ownerPublicKey !== value.ownerPublicKey ||
          event.pubkey !== value.ownerPublicKey
        ) {
          throw new Error("Membership event is not signed by the vault owner");
        }
        if (snapshot.generation <= value.membershipGeneration) {
          if (snapshot.event?.id === value.membership.event?.id) {
            return cloneMembership(value.membership);
          }
          throw new Error("Membership generation is stale or replayed");
        }
        const recoveryPending = this.#deviceState(value) === "recovery-pending";
        if (
          !recoveryPending &&
          (snapshot.generation !== value.membershipGeneration + 1 ||
            snapshot.previousEventId !== value.membership.event?.id)
        ) {
          throw new Error("Membership generation chain is discontinuous");
        }
        const own = snapshot.devices.find(
          (device) => device.publicKey === value.publicKey,
        );
        value.membership = snapshot;
        value.membershipGeneration = snapshot.generation;
        value.currentEpoch = snapshot.currentEpoch;
        if (own) {
          value.deviceAlias = own.alias;
          value.role = own.role;
        }
        await this.#persistKeys(pluginId, value);
        return cloneMembership(snapshot);
      },
      renameDevice: async ({ publicKey, alias }) => {
        const value = keys();
        this.#assertOwner(value);
        const snapshot = cloneMembership(value.membership);
        const device = snapshot.devices.find(
          (candidate) => candidate.publicKey === requirePublicKey(publicKey),
        );
        if (!device || device.state !== "active") {
          throw new Error("Active sync device was not found");
        }
        device.alias = requireAlias(alias);
        if (value.syncSecret) this.#sealSyncIdentity(value, snapshot);
        await this.#advanceMembership(pluginId, value, snapshot);
        return cloneMembership(value.membership);
      },
      revokeDevice: async ({ publicKey, cutoffHeads }) => {
        const value = keys();
        this.#assertOwner(value);
        const targetKey = requirePublicKey(publicKey);
        if (targetKey === value.publicKey) {
          throw new Error("The active owner device cannot revoke itself");
        }
        const snapshot = cloneMembership(value.membership);
        const device = snapshot.devices.find(
          (candidate) => candidate.publicKey === targetKey,
        );
        if (!device || device.state !== "active") {
          throw new Error("Active sync device was not found");
        }
        device.state = "revoked";
        device.revokedAt = Date.now();
        for (const member of snapshot.devices) {
          if (cutoffHeads[member.publicKey])
            member.cutoffHead = cutoffHeads[member.publicKey];
        }
        const encryptionEpoch = value.currentEpoch;
        value.currentEpoch += 1;
        value.vaultKeys.set(value.currentEpoch, randomBytes(KEY_LENGTH));
        snapshot.currentEpoch = value.currentEpoch;
        this.#sealMembershipEpoch(value, snapshot);
        if (value.syncSecret) this.#sealSyncIdentity(value, snapshot);
        await this.#advanceMembership(
          pluginId,
          value,
          snapshot,
          encryptionEpoch,
        );
        return cloneMembership(value.membership);
      },
      recoverOwner: async ({ cutoffHeads }) => {
        const value = keys();
        this.#assertOwner(value);
        if (this.#deviceState(value) !== "recovery-pending") {
          throw new Error("Owner recovery is not pending on this device");
        }
        const snapshot = cloneMembership(value.membership);
        for (const device of snapshot.devices) {
          if (cutoffHeads[device.publicKey]) {
            device.cutoffHead = cutoffHeads[device.publicKey];
          }
          if (device.role === "owner" && device.state === "active") {
            device.state = "revoked";
            device.revokedAt = Date.now();
          }
        }
        snapshot.devices.push({
          publicKey: value.publicKey,
          alias: value.deviceAlias,
          role: "owner",
          state: "active",
          addedAt: Date.now(),
        });
        const encryptionEpoch = value.currentEpoch;
        value.currentEpoch += 1;
        value.vaultKeys.set(value.currentEpoch, randomBytes(KEY_LENGTH));
        snapshot.currentEpoch = value.currentEpoch;
        this.#sealMembershipEpoch(value, snapshot);
        if (value.syncSecret) this.#sealSyncIdentity(value, snapshot);
        await this.#advanceMembership(
          pluginId,
          value,
          snapshot,
          encryptionEpoch,
        );
        return cloneMembership(value.membership);
      },
    };
  }

  recovery(
    pluginId: string,
    runtimeId: string,
    assertGranted: () => void = () => undefined,
    requestPassphrase?: (mode: "export" | "import") => Promise<string | null>,
    requestEnrollment?: (
      input: SyncCryptoEnrollmentRequest,
    ) => Promise<SyncCryptoStatus>,
  ): SyncRecoveryCapability {
    const assertActive = () => {
      assertGranted();
      this.assertRuntime(pluginId, runtimeId);
    };
    const passphrase = async (mode: "export" | "import") => {
      if (!requestPassphrase) {
        throw new Error(
          `The host has no sync recovery ${mode} flow for ${pluginId}`,
        );
      }
      const value = await requestPassphrase(mode);
      if (value == null) throw new Error(`Sync recovery ${mode} was cancelled`);
      if (value.length < 10) {
        throw new Error(
          "Recovery passphrase must contain at least 10 characters",
        );
      }
      return value;
    };
    return {
      exportBundle: async ({ metadata } = {}) => {
        assertActive();
        const keys = this.#requireUnlocked(pluginId);
        this.#assertOwner(keys);
        if (!keys.recoverySecret) {
          throw new Error("The owner recovery authority is unavailable");
        }
        const metadataBytes = new TextEncoder().encode(canonicalJson(metadata));
        if (metadataBytes.byteLength > MAX_RECOVERY_METADATA_BYTES) {
          throw new Error("Recovery metadata exceeds the host limit");
        }
        metadataBytes.fill(0);
        const secret = await passphrase("export");
        const salt = randomBytes(16);
        const wrappingKey = await argon2idAsync(
          new TextEncoder().encode(secret),
          salt,
          {
            t: this.#argon2.timeCost,
            m: this.#argon2.memoryKiB,
            p: this.#argon2.parallelism,
            dkLen: KEY_LENGTH,
          },
        );
        try {
          const material = this.#keyMaterial(keys);
          material.deviceSecretHex = "";
          const payload: RecoveryBundlePayload = {
            schemaVersion: 1,
            exportedAt: Date.now(),
            keyMaterial: material,
            metadata,
          };
          const plaintext = new TextEncoder().encode(canonicalJson(payload));
          const nonce = randomBytes(NONCE_LENGTH);
          const ciphertext = xchacha20poly1305(
            wrappingKey,
            nonce,
            new TextEncoder().encode("lapis-sync-recovery:v1"),
          ).encrypt(plaintext);
          plaintext.fill(0);
          const envelope: RecoveryBundleEnvelope = {
            version: 1,
            kdf: {
              name: "argon2id",
              timeCost: this.#argon2.timeCost,
              memoryKiB: this.#argon2.memoryKiB,
              parallelism: this.#argon2.parallelism,
              dkLen: 32,
              saltHex: bytesToHex(salt),
            },
            nonceHex: bytesToHex(nonce),
            ciphertextHex: bytesToHex(ciphertext),
          };
          return new TextEncoder().encode(canonicalJson(envelope));
        } finally {
          wrappingKey.fill(0);
        }
      },
      importBundle: async ({ bundle, replaceExisting = false }) => {
        assertActive();
        if (!requestEnrollment) {
          throw new Error(
            `The host has no sync enrollment flow for ${pluginId}`,
          );
        }
        requireCryptoSize(bundle);
        const current = await this.status(pluginId);
        if (current.state !== "unenrolled" && !replaceExisting) {
          throw new Error(
            "Recovery import requires an unenrolled identity or explicit replacement",
          );
        }
        let envelope: RecoveryBundleEnvelope;
        try {
          envelope = JSON.parse(
            new TextDecoder().decode(bundle),
          ) as RecoveryBundleEnvelope;
        } catch {
          throw new Error("Recovery bundle is invalid");
        }
        if (
          envelope.version !== 1 ||
          envelope.kdf?.name !== "argon2id" ||
          envelope.kdf.dkLen !== 32
        ) {
          throw new Error("Unsupported recovery bundle");
        }
        const secret = await passphrase("import");
        const wrappingKey = await argon2idAsync(
          new TextEncoder().encode(secret),
          hexToBytes(envelope.kdf.saltHex),
          {
            t: envelope.kdf.timeCost,
            m: envelope.kdf.memoryKiB,
            p: envelope.kdf.parallelism,
            dkLen: envelope.kdf.dkLen,
          },
        );
        let payload: RecoveryBundlePayload;
        try {
          const plaintext = xchacha20poly1305(
            wrappingKey,
            hexToBytes(envelope.nonceHex),
            new TextEncoder().encode("lapis-sync-recovery:v1"),
          ).decrypt(hexToBytes(envelope.ciphertextHex));
          try {
            payload = JSON.parse(
              new TextDecoder().decode(plaintext),
            ) as RecoveryBundlePayload;
          } finally {
            plaintext.fill(0);
          }
        } catch {
          throw new Error("Recovery bundle authentication failed");
        } finally {
          wrappingKey.fill(0);
        }
        if (
          payload.schemaVersion !== 1 ||
          ![2, 3].includes(payload.keyMaterial.schemaVersion) ||
          !payload.keyMaterial.ownerSecretHex ||
          !payload.keyMaterial.recoverySecretHex
        ) {
          throw new Error("Recovery bundle key material is incomplete");
        }
        const metadataBytes = new TextEncoder().encode(
          canonicalJson(payload.metadata),
        );
        if (metadataBytes.byteLength > MAX_RECOVERY_METADATA_BYTES) {
          throw new Error("Recovery metadata exceeds the host limit");
        }
        metadataBytes.fill(0);
        const material = structuredClone(payload.keyMaterial);
        const newDeviceSecret = randomBytes(KEY_LENGTH);
        const newPublicKey = getPublicKey(newDeviceSecret);
        material.deviceSecretHex = bytesToHex(newDeviceSecret);
        newDeviceSecret.fill(0);
        material.deviceAlias = "Recovered owner";
        material.role = "owner";
        // Recovery import deliberately leaves the fresh owner identity outside
        // current membership. The plugin first reconciles the latest
        // owner-signed snapshot, then calls membership.recoverOwner to rotate.
        if (
          material.membership.devices.some(
            (device) => device.publicKey === newPublicKey,
          )
        ) {
          throw new Error("Recovery generated a duplicate device identity");
        }

        if (current.state !== "unenrolled") {
          this.lock(pluginId);
          await this.database.transactMeta({
            mutations: [{ key: envelopeKey(pluginId), delete: true }],
          });
        }
        this.#pendingEnrollments.set(pluginId, {
          request: { mode: "recovery", deviceAlias: material.deviceAlias },
          material,
        });
        const status = await requestEnrollment({
          mode: "recovery",
          deviceAlias: material.deviceAlias,
        });
        if (status.state !== "unlocked") {
          throw new Error("The host did not complete recovery enrollment");
        }
        return { status, metadata: payload.metadata };
      },
    };
  }

  #requireUnlocked(pluginId: string): UnlockedKeys {
    const keys = this.#unlocked.get(pluginId);
    if (!keys) throw new Error(`Sync crypto is locked for ${pluginId}`);
    return keys;
  }

  #assertOwner(keys: UnlockedKeys): void {
    if (keys.role !== "owner" || !keys.ownerSecret) {
      throw new Error("Only the owner device may manage sync membership");
    }
  }

  #syncIdentityState(keys: UnlockedKeys): SyncIdentityState {
    if (!keys.syncSecret || !keys.syncPublicKey) return "setup-required";
    return keys.pendingSyncSecret ? "rotation-pending" : "active";
  }

  #syncIdentityStatus(keys: UnlockedKeys): SyncIdentityPublicStatus {
    return {
      state: this.#syncIdentityState(keys),
      publicKey: keys.syncPublicKey,
      generation: keys.syncIdentityGeneration,
      history: cloneSyncIdentityHistory(keys.syncIdentityHistory),
      pendingPublicKey: keys.pendingSyncPublicKey,
      canRotate: keys.role === "owner" && this.#deviceState(keys) === "active",
    };
  }

  #validateUnsignedEvent(event: UnsignedSyncEvent): void {
    if (
      !Number.isSafeInteger(event.kind) ||
      !Number.isSafeInteger(event.created_at)
    ) {
      throw new Error("Sync event kind and timestamp must be safe integers");
    }
    if (event.content.length > 2 * 1024 * 1024 || event.tags.length > 256) {
      throw new Error("Sync event exceeds the signing policy");
    }
    for (const tag of event.tags) {
      if (!Array.isArray(tag) || tag.length < 1 || tag.length > 8) {
        throw new Error("Sync event tags are invalid");
      }
      for (const value of tag) {
        if (typeof value !== "string" || value.length > 2_048) {
          throw new Error("Sync event tag values are invalid");
        }
      }
    }
  }

  #validateSyncIdentityEvent(
    purpose: SyncIdentitySigningPurpose,
    event: UnsignedSyncEvent,
  ): void {
    this.#validateUnsignedEvent(event);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(event.created_at - now) > 10 * 60) {
      throw new Error("Sync Identity events must use a current timestamp");
    }
    const tag = (name: string) =>
      event.tags.find(([candidate]) => candidate === name)?.[1];
    if (purpose === "transport") {
      if (![78, 30_078, MEMBERSHIP_KIND].includes(event.kind)) {
        throw new Error("Sync transport signing kind is not allowed");
      }
      if (!tag("d")) throw new Error("Sync transport events require a d tag");
      return;
    }
    if (purpose === "connection-probe") {
      if (![78, 30_078, MEMBERSHIP_KIND].includes(event.kind) || !tag("d")) {
        throw new Error("Sync connection probe is invalid");
      }
      if (!tag("expiration")) {
        throw new Error("Sync connection probes require expiration");
      }
      return;
    }
    if (purpose === "relay-auth") {
      if (
        event.kind !== 22_242 ||
        event.content !== "" ||
        !tag("relay") ||
        !tag("challenge")
      ) {
        throw new Error("NIP-42 authentication event is invalid");
      }
      return;
    }
    if (
      event.kind !== 24_242 ||
      !tag("t") ||
      !tag("expiration") ||
      !["get", "upload", "list", "delete", "media"].includes(tag("t")!)
    ) {
      throw new Error("BUD-11 authorization event is invalid");
    }
  }

  #deviceState(keys: UnlockedKeys): "active" | "revoked" | "recovery-pending" {
    const own = keys.membership.devices.find(
      (device) => device.publicKey === keys.publicKey,
    );
    return (
      own?.state ?? (keys.role === "owner" ? "recovery-pending" : "revoked")
    );
  }

  #assertDeviceActive(keys: UnlockedKeys): void {
    const own = keys.membership.devices.find(
      (device) => device.publicKey === keys.publicKey,
    );
    if (!own || own.state !== "active") {
      throw new Error("This sync device is revoked");
    }
  }

  #pairingSnapshot(session: PairingSession): SyncPairingSessionSnapshot {
    return {
      sessionId: session.sessionId,
      role: session.role,
      state: session.state,
      expiresAt: session.expiresAt,
      sas: session.sas,
      peerPublicKey: session.peerDevicePublicKey,
      peerAlias: session.peerAlias,
    };
  }

  #expirePairingSession(
    session: PairingSession,
    state: "cancelled" | "expired" = "expired",
  ): void {
    session.state = state;
    this.#destroyPairingSecrets(session);
    this.#pendingEnrollments.delete(session.pluginId);
  }

  #destroyPairingSecrets(session: PairingSession): void {
    session.ephemeralSecret.fill(0);
    session.pendingDeviceSecret?.fill(0);
    session.pendingDeviceSecret = undefined;
  }

  #parsePairingInvitation(invitationUri: string): PairingInvitationPayload {
    if (invitationUri.length > 2_048) {
      throw new Error("Pairing invitation exceeds the app URL limit");
    }
    let url: URL;
    try {
      url = new URL(invitationUri);
    } catch {
      throw new Error("Pairing invitation is not a valid URL");
    }
    if (url.protocol !== "lapis:" || url.hostname !== "sync-pair") {
      throw new Error("Pairing invitation must use lapis://sync-pair");
    }
    if (url.searchParams.get("v") !== "1") {
      throw new Error("Unsupported pairing invitation version");
    }
    const data = url.searchParams.get("data");
    if (!data) throw new Error("Pairing invitation data is missing");
    let invitation: PairingInvitationPayload;
    try {
      invitation = JSON.parse(
        new TextDecoder().decode(fromBase64Url(data)),
      ) as PairingInvitationPayload;
    } catch {
      throw new Error("Pairing invitation data is invalid");
    }
    if (
      invitation.v !== 1 ||
      !Number.isSafeInteger(invitation.e) ||
      typeof invitation.s !== "string" ||
      invitation.s.length < 32 ||
      !Array.isArray(invitation.r)
    ) {
      throw new Error("Pairing invitation data is invalid");
    }
    requirePublicKey(invitation.p, "Pairing public key");
    requireRelayUrls(invitation.r);
    return invitation;
  }

  #createPairingEvent(
    session: PairingSession,
    input: Pick<
      PairingMessage,
      "type" | "devicePublicKey" | "deviceAlias" | "payload"
    >,
  ): NostrEvent {
    const peerPublicKey = session.peerEphemeralPublicKey;
    if (!peerPublicKey) throw new Error("Pairing peer is not established");
    const message: PairingMessage = {
      v: 1,
      sessionId: session.sessionId,
      sequence: ++session.sequence,
      type: input.type,
      sessionSecret: session.sessionSecret,
      devicePublicKey: input.devicePublicKey,
      deviceAlias: input.deviceAlias,
      payload: input.payload,
    };
    const content = nip44.encrypt(
      canonicalJson(message),
      nip44.utils.getConversationKey(session.ephemeralSecret, peerPublicKey),
    );
    if (content.length > MAX_PAIRING_EVENT_BYTES) {
      throw new Error("Pairing event exceeds the host limit");
    }
    return finalizeEvent(
      {
        kind: PAIRING_KIND,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["p", peerPublicKey],
          ["d", session.sessionId],
        ],
        content,
      },
      session.ephemeralSecret,
    );
  }

  #readPairingEvent(
    session: PairingSession,
    event: NostrEvent,
  ): PairingMessage {
    if (
      event.kind !== PAIRING_KIND ||
      event.content.length > MAX_PAIRING_EVENT_BYTES ||
      !verifyEvent(event)
    ) {
      throw new Error("Pairing event is invalid");
    }
    if (session.seenEventIds.has(event.id)) {
      throw new Error("Pairing event was replayed");
    }
    const recipient = event.tags.find(([name]) => name === "p")?.[1];
    const sessionTag = event.tags.find(([name]) => name === "d")?.[1];
    if (
      recipient !== session.ephemeralPublicKey ||
      sessionTag !== session.sessionId ||
      (session.peerEphemeralPublicKey &&
        event.pubkey !== session.peerEphemeralPublicKey)
    ) {
      throw new Error("Pairing event recipient or peer does not match");
    }
    let message: PairingMessage;
    try {
      message = JSON.parse(
        nip44.decrypt(
          event.content,
          nip44.utils.getConversationKey(session.ephemeralSecret, event.pubkey),
        ),
      ) as PairingMessage;
    } catch {
      throw new Error("Pairing event authentication failed");
    }
    if (
      message.v !== 1 ||
      message.sessionId !== session.sessionId ||
      message.sessionSecret !== session.sessionSecret ||
      message.sequence !== session.lastReceivedSequence + 1
    ) {
      throw new Error("Pairing event sequence or session proof is invalid");
    }
    session.lastReceivedSequence = message.sequence;
    session.seenEventIds.add(event.id);
    return message;
  }

  async #preparePairingTransfer(
    pluginId: string,
    session: PairingSession,
  ): Promise<StoredPairingTransfer> {
    const keys = this.#requireUnlocked(pluginId);
    this.#assertOwner(keys);
    if (!keys.syncSecret || !keys.syncPublicKey) {
      throw new Error(
        "Initialize the vault Sync Identity before pairing a device",
      );
    }
    if (!session.peerDevicePublicKey || !session.peerAlias) {
      throw new Error("Pairing peer identity is incomplete");
    }
    const snapshot = cloneMembership(keys.membership);
    if (
      snapshot.devices.some(
        (device) => device.publicKey === session.peerDevicePublicKey,
      )
    ) {
      throw new Error("Pairing device is already present in membership");
    }
    for (const device of snapshot.devices) {
      if (session.cutoffHeads[device.publicKey]) {
        device.cutoffHead = session.cutoffHeads[device.publicKey];
      }
    }
    snapshot.devices.push({
      publicKey: session.peerDevicePublicKey,
      alias: session.peerAlias,
      role: "member",
      state: "active",
      addedAt: Date.now(),
    });
    this.#sealSyncIdentity(keys, snapshot);
    await this.#advanceMembership(pluginId, keys, snapshot);
    return {
      vaultId: keys.vaultId,
      vaultKeys: Object.fromEntries(
        [...keys.vaultKeys.entries()].map(([epoch, key]) => [
          String(epoch),
          bytesToHex(key),
        ]),
      ),
      currentEpoch: keys.currentEpoch,
      ownerPublicKey: keys.ownerPublicKey,
      recoveryPublicKey: keys.recoveryPublicKey,
      syncSecretHex: bytesToHex(keys.syncSecret),
      syncPublicKey: keys.syncPublicKey,
      syncIdentityGeneration: keys.syncIdentityGeneration,
      syncIdentityHistory: cloneSyncIdentityHistory(keys.syncIdentityHistory),
      membership: cloneMembership(keys.membership),
      metadata: clonePairingMetadata(session.metadata),
    };
  }

  async #advanceMembership(
    pluginId: string,
    keys: UnlockedKeys,
    snapshot: SyncMembershipSnapshot,
    encryptionEpoch = snapshot.currentEpoch,
  ): Promise<void> {
    this.#assertOwner(keys);
    snapshot.previousEventId = keys.membership.event?.id;
    snapshot.generation = keys.membershipGeneration + 1;
    snapshot.currentEpoch = keys.currentEpoch;
    snapshot.event = this.#signMembership(keys, snapshot, encryptionEpoch);
    keys.membership = snapshot;
    keys.membershipGeneration = snapshot.generation;
    const own = snapshot.devices.find(
      (device) => device.publicKey === keys.publicKey,
    );
    if (own) keys.deviceAlias = own.alias;
    await this.#persistKeys(pluginId, keys);
  }

  #sealMembershipEpoch(
    keys: UnlockedKeys,
    snapshot: SyncMembershipSnapshot,
  ): void {
    this.#assertOwner(keys);
    const epochPayload = canonicalJson({
      schemaVersion: 1,
      vaultId: keys.vaultId,
      epoch: keys.currentEpoch,
      keyHex: bytesToHex(this.#vaultKey(keys, keys.currentEpoch)),
    });
    snapshot.epochEnvelopes = Object.fromEntries(
      snapshot.devices
        .filter((member) => member.state === "active")
        .map((member) => [
          member.publicKey,
          nip44.encrypt(
            epochPayload,
            nip44.utils.getConversationKey(keys.ownerSecret!, member.publicKey),
          ),
        ]),
    );
    snapshot.recoveryEpochEnvelope = nip44.encrypt(
      epochPayload,
      nip44.utils.getConversationKey(keys.ownerSecret!, keys.recoveryPublicKey),
    );
  }

  #sealSyncIdentity(
    keys: UnlockedKeys,
    snapshot: SyncMembershipSnapshot,
  ): void {
    this.#assertOwner(keys);
    if (!keys.syncSecret || !keys.syncPublicKey) {
      throw new Error("The vault Sync Identity is unavailable");
    }
    const payload = canonicalJson({
      schemaVersion: 1,
      vaultId: keys.vaultId,
      generation: keys.syncIdentityGeneration,
      publicKey: keys.syncPublicKey,
      secretHex: bytesToHex(keys.syncSecret),
    });
    snapshot.syncIdentityEnvelopes = Object.fromEntries(
      snapshot.devices
        .filter((member) => member.state === "active")
        .map((member) => [
          member.publicKey,
          nip44.encrypt(
            payload,
            nip44.utils.getConversationKey(keys.ownerSecret!, member.publicKey),
          ),
        ]),
    );
    snapshot.recoverySyncIdentityEnvelope = nip44.encrypt(
      payload,
      nip44.utils.getConversationKey(keys.ownerSecret!, keys.recoveryPublicKey),
    );
  }

  #decryptMembership(
    keys: UnlockedKeys,
    event: NostrEvent,
  ): SyncMembershipSnapshot {
    if (
      event.kind !== MEMBERSHIP_KIND ||
      event.content.length > 2 * 1024 * 1024 ||
      !verifyEvent(event) ||
      event.pubkey !== keys.ownerPublicKey
    ) {
      throw new Error("Membership event is invalid");
    }
    const expectedTag = `lapis-sync-v1:${keys.vaultId}:membership`;
    if (event.tags.find(([name]) => name === "d")?.[1] !== expectedTag) {
      throw new Error("Membership event address is invalid");
    }
    const envelope = fromBase64Url(event.content);
    if (
      envelope.byteLength < 5 + NONCE_LENGTH + 16 ||
      envelope[0] !== OBJECT_ENVELOPE_VERSION
    ) {
      throw new Error("Membership event envelope is invalid");
    }
    const encryptionEpoch = new DataView(
      envelope.buffer,
      envelope.byteOffset,
      envelope.byteLength,
    ).getUint32(1, false);
    const encryptionKey = this.#vaultKey(keys, encryptionEpoch);
    let snapshot: SyncMembershipSnapshot;
    try {
      const plaintext = xchacha20poly1305(
        deriveObjectKey(encryptionKey, encryptionEpoch, "membership-payload"),
        envelope.slice(5, 5 + NONCE_LENGTH),
        objectAad("membership-payload"),
      ).decrypt(envelope.slice(5 + NONCE_LENGTH));
      try {
        snapshot = JSON.parse(
          new TextDecoder().decode(plaintext),
        ) as SyncMembershipSnapshot;
      } finally {
        plaintext.fill(0);
      }
    } catch {
      throw new Error("Membership event authentication failed");
    }
    if (
      ![1, 2].includes(snapshot.schemaVersion) ||
      snapshot.vaultId !== keys.vaultId ||
      snapshot.ownerPublicKey !== keys.ownerPublicKey ||
      !Number.isSafeInteger(snapshot.generation) ||
      !Number.isSafeInteger(snapshot.currentEpoch) ||
      !Array.isArray(snapshot.devices) ||
      snapshot.devices.length > 256
    ) {
      throw new Error("Membership event payload is invalid");
    }
    if (snapshot.schemaVersion === 2) {
      if (
        !snapshot.syncIdentity ||
        !Number.isSafeInteger(snapshot.syncIdentity.generation) ||
        snapshot.syncIdentity.generation < 1 ||
        requirePublicKey(
          snapshot.syncIdentity.publicKey,
          "Membership Sync public key",
        ) !== snapshot.syncIdentity.publicKey ||
        !Array.isArray(snapshot.syncIdentity.history) ||
        snapshot.syncIdentity.history.length > 32
      ) {
        throw new Error("Membership Sync Identity is invalid");
      }
    }
    if (!keys.vaultKeys.has(snapshot.currentEpoch)) {
      const deviceEnvelope = snapshot.epochEnvelopes?.[keys.publicKey];
      const own = snapshot.devices.find(
        (device) => device.publicKey === keys.publicKey,
      );
      const useRecoveryEnvelope =
        !deviceEnvelope &&
        !own &&
        keys.role === "owner" &&
        keys.recoverySecret &&
        snapshot.recoveryEpochEnvelope;
      const sealed = deviceEnvelope ?? useRecoveryEnvelope;
      if (!sealed && own?.state === "revoked") {
        snapshot.event = structuredClone(event);
        return snapshot;
      }
      if (!sealed) {
        throw new Error(
          "Membership update does not include this active device epoch",
        );
      }
      let epochPayload: { vaultId: string; epoch: number; keyHex: string };
      try {
        epochPayload = JSON.parse(
          nip44.decrypt(
            sealed,
            nip44.utils.getConversationKey(
              useRecoveryEnvelope ? keys.recoverySecret! : keys.deviceSecret,
              keys.ownerPublicKey,
            ),
          ),
        ) as { vaultId: string; epoch: number; keyHex: string };
      } catch {
        throw new Error("Membership epoch envelope authentication failed");
      }
      const epochKey = hexToBytes(epochPayload.keyHex);
      if (
        epochPayload.vaultId !== keys.vaultId ||
        epochPayload.epoch !== snapshot.currentEpoch ||
        epochKey.byteLength !== KEY_LENGTH
      ) {
        epochKey.fill(0);
        throw new Error("Membership epoch envelope is invalid");
      }
      keys.vaultKeys.set(snapshot.currentEpoch, epochKey);
    }
    this.#applyMembershipSyncIdentity(keys, snapshot);
    snapshot.event = structuredClone(event);
    return snapshot;
  }

  #applyMembershipSyncIdentity(
    keys: UnlockedKeys,
    snapshot: SyncMembershipSnapshot,
  ): void {
    if (snapshot.schemaVersion !== 2 || !snapshot.syncIdentity) return;
    const sync = snapshot.syncIdentity;
    if (
      keys.syncPublicKey === sync.publicKey &&
      keys.syncSecret &&
      getPublicKey(keys.syncSecret) === sync.publicKey
    ) {
      keys.syncIdentityGeneration = sync.generation;
      keys.syncIdentityHistory = cloneSyncIdentityHistory(sync.history);
      return;
    }
    const own = snapshot.devices.find(
      (device) => device.publicKey === keys.publicKey,
    );
    const deviceEnvelope = snapshot.syncIdentityEnvelopes?.[keys.publicKey];
    const useRecoveryEnvelope =
      !deviceEnvelope &&
      !own &&
      keys.role === "owner" &&
      keys.recoverySecret &&
      snapshot.recoverySyncIdentityEnvelope;
    const sealed = deviceEnvelope ?? useRecoveryEnvelope;
    if (!sealed) {
      if (own?.state === "revoked") return;
      throw new Error(
        "Membership update does not include this active device Sync Identity",
      );
    }
    let payload: {
      schemaVersion: number;
      vaultId: string;
      generation: number;
      publicKey: string;
      secretHex: string;
    };
    try {
      payload = JSON.parse(
        nip44.decrypt(
          sealed,
          nip44.utils.getConversationKey(
            useRecoveryEnvelope ? keys.recoverySecret! : keys.deviceSecret,
            keys.ownerPublicKey,
          ),
        ),
      ) as typeof payload;
    } catch {
      throw new Error(
        "Membership Sync Identity envelope authentication failed",
      );
    }
    const secret = hexToBytes(payload.secretHex);
    if (
      payload.schemaVersion !== 1 ||
      payload.vaultId !== keys.vaultId ||
      payload.generation !== sync.generation ||
      payload.publicKey !== sync.publicKey ||
      secret.byteLength !== KEY_LENGTH ||
      getPublicKey(secret) !== sync.publicKey
    ) {
      secret.fill(0);
      throw new Error("Membership Sync Identity envelope is invalid");
    }
    keys.syncSecret?.fill(0);
    keys.syncSecret = secret;
    keys.syncPublicKey = sync.publicKey;
    keys.syncIdentityGeneration = sync.generation;
    keys.syncIdentityHistory = cloneSyncIdentityHistory(sync.history);
    keys.pendingSyncSecret?.fill(0);
    keys.pendingSyncSecret = undefined;
    keys.pendingSyncPublicKey = undefined;
  }

  async grantNetworkOrigin(
    pluginId: string,
    origin: string,
    options: { allowPrivateNetwork?: boolean } = {},
  ): Promise<void> {
    const normalized = normalizeOrigin(origin);
    const url = new URL(normalized);
    const privateNetwork =
      isLoopback(url.hostname) || isPrivateIpv4(url.hostname);
    if (privateNetwork && !options.allowPrivateNetwork) {
      throw new Error("Private or loopback network grants must be explicit");
    }
    if (
      (url.protocol === "http:" || url.protocol === "ws:") &&
      !isLoopback(url.hostname)
    ) {
      throw new Error(
        "Insecure network grants are allowed only for loopback development",
      );
    }
    const grants =
      (await this.database.getMeta<NetworkGrant[]>(
        networkGrantKey(pluginId),
      )) ?? [];
    const next = [
      ...grants.filter((grant) => grant.origin !== normalized),
      {
        origin: normalized,
        allowPrivateNetwork: options.allowPrivateNetwork ?? false,
        grantedAt: Date.now(),
      },
    ].sort((left, right) => left.origin.localeCompare(right.origin));
    await this.database.setMeta(networkGrantKey(pluginId), next);
  }

  async hasNetworkOriginGrant(
    pluginId: string,
    origin: string,
  ): Promise<boolean> {
    const normalized = normalizeOrigin(origin);
    const grants =
      (await this.database.getMeta<NetworkGrant[]>(
        networkGrantKey(pluginId),
      )) ?? [];
    const grant = grants.find((candidate) => candidate.origin === normalized);
    if (!grant) return false;
    try {
      validateGrantedUrl(new URL(normalized), grant);
      return true;
    } catch {
      return false;
    }
  }

  async revokeNetworkOrigin(pluginId: string, origin: string): Promise<void> {
    const normalized = normalizeOrigin(origin);
    const grants =
      (await this.database.getMeta<NetworkGrant[]>(
        networkGrantKey(pluginId),
      )) ?? [];
    await this.database.setMeta(
      networkGrantKey(pluginId),
      grants.filter((grant) => grant.origin !== normalized),
    );
    for (const socket of this.#sockets.get(pluginId) ?? []) {
      if (new URL(socket.url).origin === normalized)
        socket.close(1008, "Network grant revoked");
    }
  }

  revokePlugin(pluginId: string): void {
    this.lock(pluginId);
    for (const [key, session] of this.#pairingSessions) {
      if (session.pluginId !== pluginId) continue;
      this.#expirePairingSession(session, "cancelled");
      this.#pairingSessions.delete(key);
    }
    for (const request of this.#requests.get(pluginId) ?? []) {
      request.abort(
        new DOMException("Plugin capability revoked", "AbortError"),
      );
      request.dispose();
    }
    this.#requests.delete(pluginId);
    for (const socket of this.#sockets.get(pluginId) ?? []) {
      socket.close(1008, "Plugin capability revoked");
    }
    this.#sockets.delete(pluginId);
  }

  network(
    pluginId: string,
    runtimeId: string,
    assertGranted: () => void = () => undefined,
    requestOriginGrant?: (
      origin: string,
      options?: { allowPrivateNetwork?: boolean },
    ) => Promise<void>,
  ): PluginNetworkCapability {
    const findGrant = async (url: URL): Promise<NetworkGrant> => {
      assertGranted();
      this.assertRuntime(pluginId, runtimeId);
      const grants =
        (await this.database.getMeta<NetworkGrant[]>(
          networkGrantKey(pluginId),
        )) ?? [];
      const grant = grants.find((candidate) => candidate.origin === url.origin);
      if (!grant)
        throw new Error(`Network origin is not granted: ${url.origin}`);
      validateGrantedUrl(url, grant);
      return grant;
    };
    return {
      requestOriginGrant: async (origin, options) => {
        assertGranted();
        this.assertRuntime(pluginId, runtimeId);
        if (!requestOriginGrant) {
          throw new Error(`The host has no network grant flow for ${pluginId}`);
        }
        await requestOriginGrant(origin, options);
      },
      request: async (request) => {
        let url = new URL(request.url);
        await findGrant(url);
        const abort = combineAbort(request.signal, request.timeoutMs ?? 30_000);
        const requests =
          this.#requests.get(pluginId) ??
          new Set<ReturnType<typeof combineAbort>>();
        requests.add(abort);
        this.#requests.set(pluginId, requests);
        let disposed = false;
        const disposeRequest = () => {
          if (disposed) return;
          disposed = true;
          abort.dispose();
          requests.delete(abort);
          if (requests.size === 0) this.#requests.delete(pluginId);
        };
        abort.signal.addEventListener("abort", disposeRequest, { once: true });
        try {
          let response: Response | undefined;
          for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
            response = await this.#fetch(url, {
              method: request.method ?? "GET",
              headers: request.headers,
              body: request.body,
              credentials: "omit",
              redirect: "manual",
              signal: abort.signal,
              ...(request.body instanceof ReadableStream
                ? ({ duplex: "half" } as RequestInit & { duplex: "half" })
                : {}),
            });
            if (![301, 302, 303, 307, 308].includes(response.status)) break;
            const location = response.headers.get("location");
            if (!location) break;
            if (redirect === MAX_REDIRECTS)
              throw new Error("Network redirect limit exceeded");
            await response.body?.cancel();
            url = new URL(location, url);
            await findGrant(url);
          }
          if (!response)
            throw new Error("Network request did not produce a response");
          const headers = Object.fromEntries(response.headers.entries());
          const body = response.body
            ? keepRequestAlive(response.body, disposeRequest)
            : null;
          if (!body) disposeRequest();
          return {
            url: response.url || url.href,
            status: response.status,
            statusText: response.statusText,
            headers,
            body,
            arrayBuffer: () => new Response(body).arrayBuffer(),
            text: () => new Response(body).text(),
          };
        } catch (error) {
          disposeRequest();
          throw error;
        }
      },
      connectWebSocket: async (input, protocols) => {
        const url = new URL(input);
        await findGrant(url);
        if (!this.#WebSocket)
          throw new Error("WebSocket is unavailable in this host");
        const socket = new this.#WebSocket(url, protocols);
        const sockets = this.#sockets.get(pluginId) ?? new Set<WebSocket>();
        sockets.add(socket);
        this.#sockets.set(pluginId, sockets);
        socket.addEventListener("close", () => sockets.delete(socket), {
          once: true,
        });
        const ready = new Promise<void>((resolve, reject) => {
          socket.addEventListener("open", () => resolve(), { once: true });
          socket.addEventListener(
            "error",
            () => reject(new Error("WebSocket connection failed")),
            {
              once: true,
            },
          );
        });
        return {
          get url() {
            return socket.url;
          },
          get readyState() {
            return socket.readyState;
          },
          ready,
          addEventListener: (type, listener) =>
            socket.addEventListener(type, listener),
          removeEventListener: (type, listener) =>
            socket.removeEventListener(type, listener),
          send: (data) => {
            assertGranted();
            this.assertRuntime(pluginId, runtimeId);
            socket.send(data);
          },
          close: (code, reason) => socket.close(code, reason),
        };
      },
    };
  }
}
