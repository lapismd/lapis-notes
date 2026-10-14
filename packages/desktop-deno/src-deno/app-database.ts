import { isAbsolute, join } from "node:path";
import { inspectNativeSyncRoot } from "@lapis-notes/deno-host-services/sync-vault-root";
import type { AppDatabaseDescriptor } from "../../api/src/lib/storage/app-database.ts";
import { isDesktopAppDatabaseMethod } from "../src/desktop-app-database-protocol.ts";
import type {
  AppDatabaseWorkerRequest,
  AppDatabaseWorkerRequestInput,
  AppDatabaseWorkerResponse,
} from "./app-database-worker-protocol.ts";
import {
  deserializeAppDatabaseWorkerError,
  nativeDatabaseDescriptor,
} from "./app-database-worker-protocol.ts";

type RendererEventEmitter = (event: {
  channel: string;
  payload: unknown;
}) => Promise<void>;

type AppDatabaseWorkerLike = {
  onmessage: ((event: MessageEvent<AppDatabaseWorkerResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: AppDatabaseWorkerRequest): void;
  terminate(): void;
};

type PendingWorkerRequest = {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
};

type DenoAppDatabaseHostOptions = {
  onProfilesInvalidated?: () => void;
  createWorker?: () => AppDatabaseWorkerLike;
  workerReadyTimeoutMs?: number;
  resolveDatabasePath?: (
    userDataDir: string,
    vaultId: string,
  ) => Promise<string>;
};

function stableVaultHash(value: string): string {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stringPayload(
  payload: Record<string, unknown>,
  field: string,
): string {
  const value = payload[field];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Desktop app database payload missing ${field}`);
  }
  return value;
}

async function databasePath(
  userDataDir: string,
  vaultId: string,
): Promise<string> {
  const directory = join(userDataDir, "databases");
  await Deno.mkdir(directory, { recursive: true });
  return join(directory, `lapis-app-${stableVaultHash(vaultId)}.turso`);
}

interface NativeProfile {
  vaultId: string;
  ready: boolean;
  opening?: Promise<AppDatabaseDescriptor>;
  rootInput?: string;
  rootPath?: string;
  rootBinding?: string;
}

export class DenoAppDatabaseHost {
  readonly #profiles = new Map<string, NativeProfile>();
  readonly #pending = new Map<number, PendingWorkerRequest>();
  #worker: AppDatabaseWorkerLike | null = null;
  #requestId = 0;
  #workerReady = false;
  #readyTimer: ReturnType<typeof setTimeout> | undefined;
  readonly #queued = new Map<number, AppDatabaseWorkerRequest>();

  constructor(
    private readonly userDataDir: string,
    private readonly emitRendererEvent: RendererEventEmitter,
    private readonly options: DenoAppDatabaseHostOptions = {},
  ) {}

  async open(payload: Record<string, unknown>): Promise<AppDatabaseDescriptor> {
    const databaseId = stringPayload(payload, "databaseId");
    const vaultId = stringPayload(payload, "vaultId");
    const rootInput = payload.rootPath;
    if (
      rootInput !== undefined &&
      (typeof rootInput !== "string" ||
        !isAbsolute(rootInput) ||
        rootInput.length > 8192 ||
        rootInput.includes("\0"))
    )
      throw new Error("Invalid desktop profile root");
    const existing = this.#profiles.get(databaseId);
    if (existing) {
      if (
        existing.vaultId !== vaultId ||
        existing.rootInput !== rootInput ||
        !existing.opening
      )
        throw new Error("Desktop database is already bound to another vault");
      return existing.opening;
    }
    if (
      [...this.#profiles.values()].some(
        (profile) =>
          profile.vaultId === vaultId && profile.rootInput !== rootInput,
      )
    )
      throw new Error("Desktop profile is already bound to another root");
    const profile: NativeProfile = { vaultId, ready: false, rootInput };
    this.#profiles.set(databaseId, profile);
    profile.opening = this.#openProfile(databaseId, profile);
    return profile.opening;
  }

  async #openProfile(
    databaseId: string,
    profile: NativeProfile,
  ): Promise<AppDatabaseDescriptor> {
    const vaultId = profile.vaultId;
    try {
      if (profile.rootInput !== undefined) {
        // Ordinary indexing also supports roots that cannot receive guarded Sync access.
        const bound = await inspectNativeSyncRoot(profile.rootInput).catch(
          () => undefined,
        );
        if (
          bound &&
          [...this.#profiles.values()].some(
            (other) =>
              other !== profile &&
              other.vaultId === vaultId &&
              other.rootBinding &&
              other.rootBinding !== bound.binding,
          )
        )
          throw new Error("Desktop profile physical root binding changed");
        profile.rootPath = bound?.root;
        profile.rootBinding = bound?.binding;
      }
      const path = await (this.options.resolveDatabasePath ?? databasePath)(
        this.userDataDir,
        vaultId,
      );
      if (this.#profiles.get(databaseId) !== profile)
        throw new Error("Desktop profile open was superseded");
      const descriptor = nativeDatabaseDescriptor(
        await this.#request({ type: "open", databaseId, vaultId, path }),
      );
      if (this.#profiles.get(databaseId) !== profile)
        throw new Error("Desktop profile open was superseded");
      profile.ready = true;
      return descriptor;
    } catch (error) {
      if (this.#profiles.get(databaseId) === profile)
        this.#invalidateProfile(databaseId);
      throw error;
    }
  }

  /** Native-only admission lease; object identity changes across close/reopen. */
  getProfileLease(vaultId: string): object | undefined {
    return [...this.#profiles.values()].find(
      (profile) => profile.ready && profile.vaultId === vaultId,
    );
  }

  /** Root admission is native-only and only exists after the database opens successfully. */
  getProfileRoot(
    vaultId: string,
  ): { rootPath: string; rootBinding: string } | undefined {
    const profile = [...this.#profiles.values()].find(
      (profile) => profile.ready && profile.vaultId === vaultId,
    );
    return profile?.rootPath && profile.rootBinding
      ? { rootPath: profile.rootPath, rootBinding: profile.rootBinding }
      : undefined;
  }

  #invalidateProfile(databaseId?: string): void {
    const changed =
      databaseId === undefined
        ? this.#profiles.size > 0
        : this.#profiles.has(databaseId);
    if (databaseId === undefined) this.#profiles.clear();
    else this.#profiles.delete(databaseId);
    if (changed) this.options.onProfilesInvalidated?.();
  }

  async close(payload: Record<string, unknown>): Promise<void> {
    const databaseId = stringPayload(payload, "databaseId");
    this.#invalidateProfile(databaseId);
    await this.#request({ type: "close", databaseId });
  }

  async invoke(payload: Record<string, unknown>): Promise<unknown> {
    const databaseId = stringPayload(payload, "databaseId");
    const method = payload.method;
    if (!isDesktopAppDatabaseMethod(method)) {
      throw new Error(
        `Unsupported desktop app database method: ${String(method)}`,
      );
    }
    const args = payload.args;
    if (!Array.isArray(args) || args.length > 4) {
      throw new Error("Invalid desktop app database arguments");
    }
    return this.#request({
      type: "invoke",
      databaseId,
      method,
      args,
    });
  }

  async closeAll(): Promise<void> {
    this.#invalidateProfile();
    const worker = this.#worker;
    if (!worker) return;
    try {
      if (this.#workerReady) await this.#request({ type: "close-all" });
    } finally {
      this.#stopWorker(worker, new Error("Desktop app database worker closed"));
    }
  }

  #request(request: AppDatabaseWorkerRequestInput): Promise<unknown> {
    const worker = this.#ensureWorker();
    const id = ++this.#requestId;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
      const message = { ...request, id } as AppDatabaseWorkerRequest;
      if (this.#workerReady) this.#send(worker, message);
      else this.#queued.set(id, message);
    });
  }

  #ensureWorker(): AppDatabaseWorkerLike {
    if (this.#worker) return this.#worker;
    const worker =
      this.options.createWorker?.() ??
      new Worker(new URL("./app-database-worker.ts", import.meta.url).href, {
        type: "module",
        name: "lapis-app-database",
      });
    this.#worker = worker;
    this.#workerReady = false;
    worker.onmessage = (event) => {
      if (this.#worker === worker) this.#handleWorkerMessage(event.data);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      this.#stopWorker(
        worker,
        new Error(event.message || "Desktop app database worker failed"),
      );
    };
    worker.onmessageerror = () => {
      this.#stopWorker(
        worker,
        new Error("Desktop app database worker returned an invalid message"),
      );
    };
    this.#readyTimer = setTimeout(() => {
      this.#stopWorker(
        worker,
        new Error("Desktop app database worker did not become ready"),
      );
    }, this.options.workerReadyTimeoutMs ?? 30_000);
    return worker;
  }

  #send(
    worker: AppDatabaseWorkerLike,
    request: AppDatabaseWorkerRequest,
  ): void {
    try {
      worker.postMessage(request);
    } catch (error) {
      const pending = this.#pending.get(request.id);
      this.#pending.delete(request.id);
      pending?.reject(error);
    }
  }

  #stopWorker(worker: AppDatabaseWorkerLike, error: Error): void {
    if (this.#worker !== worker) return;
    clearTimeout(this.#readyTimer);
    this.#readyTimer = undefined;
    this.#workerReady = false;
    this.#worker = null;
    this.#queued.clear();
    this.#invalidateProfile();
    worker.terminate();
    this.#rejectPending(error);
  }

  #handleWorkerMessage(response: AppDatabaseWorkerResponse): void {
    if (response.type === "ready") {
      if (this.#workerReady || !this.#worker) return;
      clearTimeout(this.#readyTimer);
      this.#readyTimer = undefined;
      this.#workerReady = true;
      for (const request of this.#queued.values())
        this.#send(this.#worker, request);
      this.#queued.clear();
      return;
    }
    if (response.type === "change") {
      void this.emitRendererEvent({
        channel: "desktop_app_database_change",
        payload: {
          databaseId: response.databaseId,
          vaultId: response.vaultId,
          change: response.change,
        },
      });
      return;
    }
    const pending = this.#pending.get(response.id);
    if (!pending) return;
    this.#pending.delete(response.id);
    if (response.ok) pending.resolve(response.value);
    else pending.reject(deserializeAppDatabaseWorkerError(response.error));
  }

  #rejectPending(error: Error): void {
    for (const pending of this.#pending.values()) pending.reject(error);
    this.#pending.clear();
  }
}
