import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  SyncHostSecurityService,
  type SyncCryptoEnrollmentRequest,
  type SyncCryptoStatus,
  type SyncHostSecurityOptions,
} from "@lapis-notes/api/sync-security-host";
import { NativeSyncSecurityStore } from "@lapis-notes/deno-host-services/sync-security-store";
import { DenoSyncLocalSession } from "./sync-local.ts";
import {
  isSyncLocalOperation,
  SYNC_LOCAL_WIRE_CHARS,
} from "../src/sync-local-protocol.ts";
import {
  decodeSyncValue,
  encodeSyncValue,
  isSyncSecurityOperation,
} from "../src/sync-security-protocol.ts";
import {
  getDesktopSyncWrappingKey,
  type DesktopSyncWrappingKeyResult,
} from "./sync-secure-store.ts";

export const DENO_SYNC_SECURITY_COMMANDS = new Set([
  "desktop_sync_security_open",
  "desktop_sync_security_call",
  "desktop_sync_security_close",
  "desktop_sync_local_call",
]);

interface Session {
  vaultId: string;
  runtimeId: string;
  lease: object;
  token: string;
  active: boolean;
  tail: Promise<void>;
  security?: SyncHostSecurityService;
  store?: NativeSyncSecurityStore;
  local?: DenoSyncLocalSession;
  closing?: Promise<void>;
}
interface Options {
  userDataPath: string;
  getProfileLease(vaultId: string): object | undefined;
  getProfileRoot?(
    vaultId: string,
  ): { rootPath: string; rootBinding: string } | undefined;
  getWrappingKey?: (
    vaultId: string,
    create: boolean,
  ) => Promise<DesktopSyncWrappingKeyResult>;
  securityOptions?: SyncHostSecurityOptions;
}
function identifier(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9._:-]{1,160}$/u.test(value))
    throw new Error(`Invalid Sync ${label}`);
  return value;
}

/** One admitted native Sync writer per desktop profile. Private keys never cross RPC. */
export class DenoSyncSecurityHost {
  readonly #sessions = new Map<string, Session>();
  readonly #profiles = new Map<string, Session>();
  #closed = false;
  #closing: Promise<void> | undefined;
  constructor(private readonly options: Options) {}

  async handle(
    command: string,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    if (command === "desktop_sync_security_open") return this.#open(payload);
    const token = identifier(payload.sessionToken, "session token");
    const session = this.#sessions.get(token);
    if (command === "desktop_sync_security_close") {
      const closing =
        session ??
        [...this.#profiles.values()].find((profile) => profile.token === token);
      return closing ? this.#close(closing) : undefined;
    }
    if (!session) throw new Error("Native Sync session is unavailable");
    if (command === "desktop_sync_local_call")
      return this.#localCall(session, payload);
    if (command !== "desktop_sync_security_call")
      throw new Error("Unsupported native Sync command");
    this.#assertSession(session);
    const { group, method } = payload;
    if (!isSyncSecurityOperation(group, method))
      throw new Error("Unsupported native Sync security operation");
    const args = decodeSyncValue(payload.args);
    if (!Array.isArray(args) || args.length > 2)
      throw new Error("Invalid native Sync arguments");
    if (
      payload.passphrase !== undefined &&
      (typeof payload.passphrase !== "string" ||
        payload.passphrase.length > 1024)
    )
      throw new Error("Invalid native Sync recovery interaction");
    const passphrase =
      typeof payload.passphrase === "string" ? payload.passphrase : null;
    const result = session.tail.then(async () => {
      this.#assertSession(session);
      try {
        const security = await this.#load(session);
        this.#assertSession(session);
        const assertActive = () => this.#assertSession(session);
        const enroll = (request: SyncCryptoEnrollmentRequest) =>
          this.#unlock(session, request);
        const capabilities = {
          crypto: security.crypto(
            "sync",
            session.runtimeId,
            assertActive,
            () => this.#unlock(session),
            enroll,
          ),
          syncIdentity: security.syncIdentity(
            "sync",
            session.runtimeId,
            assertActive,
          ),
          pairing: security.pairing(
            "sync",
            session.runtimeId,
            assertActive,
            enroll,
          ),
          membership: security.membership(
            "sync",
            session.runtimeId,
            assertActive,
          ),
          recovery: security.recovery(
            "sync",
            session.runtimeId,
            assertActive,
            async () => passphrase,
            enroll,
          ),
        };
        const target = capabilities[group] as unknown as Record<
          string,
          (...args: unknown[]) => Promise<unknown>
        >;
        const value = await target[method as string]!.apply(target, args);
        this.#assertSession(session);
        return encodeSyncValue(value);
      } catch {
        throw new Error("Native Sync security operation failed");
      }
    });
    session.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  #localCall(
    session: Session,
    payload: Record<string, unknown>,
  ): Promise<unknown> {
    this.#assertSession(session);
    if (
      Object.keys(payload).some(
        (key) => !["sessionToken", "operation", "args"].includes(key),
      ) ||
      !isSyncLocalOperation(payload.operation) ||
      typeof payload.args !== "string" ||
      payload.args.length > SYNC_LOCAL_WIRE_CHARS
    )
      return Promise.reject(new Error("Invalid native Sync data request"));
    const operation = payload.operation,
      args = decodeSyncValue(payload.args);
    if (!Array.isArray(args))
      return Promise.reject(new Error("Invalid native Sync data arguments"));
    const result = session.tail.then(async () => {
      this.#assertSession(session);
      try {
        if (!session.local) {
          const root = this.options.getProfileRoot?.(session.vaultId);
          if (!root)
            throw new Error("Native Sync profile has no admitted file root");
          const security = await this.#load(session);
          this.#assertSession(session);
          const digest = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(
              JSON.stringify(["desktop-sync-data", session.vaultId]),
            ),
          );
          const filename = Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join("");
          this.#assertSession(session);
          session.local = new DenoSyncLocalSession({
            ...root,
            runtimeId: session.runtimeId,
            storagePath: join(this.options.userDataPath, "sync-data", filename),
            crypto: security.crypto("sync", session.runtimeId, () =>
              this.#assertSession(session),
            ),
            assertActive: () => this.#assertSession(session),
          });
        }
        const value = await session.local.call(operation, args);
        this.#assertSession(session);
        const wire = encodeSyncValue(value);
        if (wire.length > SYNC_LOCAL_WIRE_CHARS)
          throw new Error("Native Sync data result exceeds transfer limit");
        return wire;
      } catch {
        throw new Error("Native Sync data operation failed");
      }
    });
    session.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  async #open(
    payload: Record<string, unknown>,
  ): Promise<{ sessionToken: string }> {
    if (this.#closed) throw new Error("Native Sync security host is closed");
    if (payload.pluginId !== "sync")
      throw new Error("Native Sync security is unavailable for this plugin");
    const vaultId = identifier(payload.vaultId, "profile");
    const runtimeId = identifier(payload.runtimeId, "runtime");
    const lease = this.options.getProfileLease(vaultId);
    if (!lease) throw new Error("Native Sync profile is not admitted");
    let current = this.#profiles.get(vaultId);
    if (current && (current.closing || current.lease !== lease)) {
      await this.#close(current);
      if (this.#closed || this.options.getProfileLease(vaultId) !== lease)
        throw new Error("Native Sync profile is no longer admitted");
      current = this.#profiles.get(vaultId);
    }
    if (current) {
      if (current.runtimeId !== runtimeId)
        throw new Error("Another Sync runtime owns this native profile");
      return { sessionToken: current.token };
    }
    const session: Session = {
      vaultId,
      runtimeId,
      lease,
      token: crypto.randomUUID(),
      active: true,
      tail: Promise.resolve(),
    };
    this.#profiles.set(vaultId, session);
    this.#sessions.set(session.token, session);
    return { sessionToken: session.token };
  }

  #assertSession(session: Session): void {
    if (
      this.#closed ||
      !session.active ||
      this.#sessions.get(session.token) !== session ||
      this.options.getProfileLease(session.vaultId) !== session.lease
    )
      throw new Error("Native Sync profile session is revoked");
  }

  async #load(session: Session): Promise<SyncHostSecurityService> {
    if (session.security) return session.security;
    const directory = join(this.options.userDataPath, "sync-security");
    await mkdir(directory, { recursive: true, mode: 0o700 });
    const digest = new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(
          JSON.stringify(["desktop-sync-security", session.vaultId]),
        ),
      ),
    );
    const filename = Array.from(digest, (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    const store = await NativeSyncSecurityStore.open(
      join(directory, `${filename}.sqlite`),
      `desktop:sync:${session.vaultId}`,
    );
    session.store = store;
    session.security = new SyncHostSecurityService(
      store,
      () => this.#assertSession(session),
      this.options.securityOptions,
    );
    return session.security;
  }

  async #unlock(
    session: Session,
    enrollment?: SyncCryptoEnrollmentRequest,
  ): Promise<SyncCryptoStatus> {
    this.#assertSession(session);
    const security = session.security!;
    const status = await security.status("sync");
    if (status.state === "unlocked") return status;
    if (status.state === "unenrolled" && !enrollment)
      throw new Error("Native Sync enrollment is required");
    const result = await (
      this.options.getWrappingKey ??
      ((vaultId, create) =>
        getDesktopSyncWrappingKey({ vaultId, pluginId: "sync", create }))
    )(session.vaultId, status.state === "unenrolled");
    const wrappingKey = Uint8Array.from(
      atob(result.wrappingKeyBase64),
      (character) => character.charCodeAt(0),
    );
    try {
      this.#assertSession(session);
      if (
        result.provider !== "os-credential-store" ||
        wrappingKey.byteLength !== 32 ||
        typeof result.keyId !== "string" ||
        !result.keyId
      )
        throw new Error("Invalid native Sync wrapping material");
      return status.state === "unenrolled"
        ? await security.enrollWithWrappingKey(
            "sync",
            wrappingKey,
            {
              name: "external",
              provider: "os-credential-store",
              keyId: result.keyId,
            },
            enrollment,
          )
        : await security.unlockWithWrappingKey("sync", wrappingKey);
    } finally {
      wrappingKey.fill(0);
    }
  }

  #close(session: Session): Promise<void> {
    if (session.closing) return session.closing;
    session.active = false;
    this.#sessions.delete(session.token);
    session.local?.stop();
    session.closing = session.tail
      .then(async () => {
        try {
          await session.local?.close();
        } finally {
          try {
            session.security?.revokePlugin("sync");
          } finally {
            await session.store?.close();
          }
        }
        if (this.#profiles.get(session.vaultId) === session)
          this.#profiles.delete(session.vaultId);
      })
      .catch(() => {
        throw new Error("Native Sync session cleanup failed");
      });
    return session.closing;
  }

  async closeInactiveProfiles(): Promise<void> {
    const results = await Promise.allSettled(
      [...this.#profiles.values()]
        .filter(
          (session) =>
            this.options.getProfileLease(session.vaultId) !== session.lease,
        )
        .map((session) => this.#close(session)),
    );
    const failure = results.find((result) => result.status === "rejected");
    if (failure?.status === "rejected")
      throw new Error("Native Sync profile cleanup failed");
  }

  closeAll(): Promise<void> {
    if (this.#closing) return this.#closing;
    this.#closed = true;
    this.#closing = Promise.allSettled(
      [...this.#profiles.values()].map((session) => this.#close(session)),
    ).then((results) => {
      if (results.some((result) => result.status === "rejected"))
        throw new Error("Native Sync shutdown failed");
    });
    return this.#closing;
  }
}
