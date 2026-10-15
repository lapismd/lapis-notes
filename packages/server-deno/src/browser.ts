import { appStatePath } from "@lapis-notes/api/path";
import type {
  AppDatabase,
  AppDatabaseChangeListener,
  AppDatabaseChangeSet,
  AppDatabaseProvider,
  RemoteAppDatabaseMethod,
} from "@lapis-notes/api/app-database";
import {
  createTRPCClient,
  httpBatchLink,
  httpSubscriptionLink,
  splitLink,
} from "@trpc/client";
import {
  REMOTE_APP_DATABASE_CONTRACT,
  REMOTE_APP_DATABASE_METHODS,
} from "@lapis-notes/api/app-database";
import type { VaultAdapter } from "@lapis-notes/api/vault";
import {
  ServerHostError,
  VaultConflictError,
  type ServerHostErrorCode,
  type ServerVaultProfile,
} from "@lapis-notes/api/server-host";
import {
  createWebPluginAssetUrl,
  getInstalledPluginAssetHash,
  getInstalledPluginAssetVersion,
  type InstalledPluginRecord,
  type PluginAssetServer,
} from "@lapis-notes/api/plugin-assets";

import { isOfficialPluginBundleSource } from "./plugin-bundle-source";

type Subscription = { unsubscribe(): void };
type FetchLike = typeof fetch;

export interface ServerPluginDistributionFetchOptions {
  vaultId: string;
  baseUrl?: string;
  fetch?: FetchLike;
}

export type LapisServerClientOptions = {
  baseUrl?: string;
  csrfToken?: () => string | undefined;
};

export type LapisServerBrowserClient = {
  system: {
    info: { query(): Promise<{ buildId: string; protocolMajor: number }> };
  };
  auth: {
    login: {
      mutate(input: {
        username: string;
        password: string;
      }): Promise<{ csrfToken: string }>;
    };
    current: { query(): Promise<{ csrfToken: string }> };
    logout: { mutate(): Promise<{ ok: true }> };
  };
  vault: {
    list: {
      query(input: { includeArchived: boolean }): Promise<
        Array<{
          id: string;
          name: string;
          role: "owner" | "editor" | "viewer";
          archivedAt?: number;
        }>
      >;
    };
    create: { mutate(input: { name: string }): Promise<{ vaultId: string }> };
    open: {
      query(input: {
        vaultId: string;
      }): Promise<{ vaultId: string; role: string }>;
    };
    rename: {
      mutate(input: { vaultId: string; name: string }): Promise<{ ok: true }>;
    };
    archive: { mutate(input: { vaultId: string }): Promise<{ ok: true }> };
    restore: { mutate(input: { vaultId: string }): Promise<{ ok: true }> };
  };
  filesystem: any;
  database: any;
  events: {
    vault: {
      subscribe(
        input: { vaultId: string; lastEventId?: string },
        handlers: {
          onData(value: unknown): void;
          onError(error: Error): void;
          onComplete(): void;
        },
      ): Subscription;
    };
  };
};

export function createLapisServerBrowserClient(
  options: LapisServerClientOptions = {},
): LapisServerBrowserClient {
  const url = `${options.baseUrl ?? ""}/api/trpc`;
  const headers = () => {
    const csrf = options.csrfToken?.();
    return csrf ? { "x-lapis-csrf": csrf } : {};
  };
  return createTRPCClient<any>({
    links: [
      splitLink({
        condition: (operation) => operation.type === "subscription",
        true: httpSubscriptionLink({ url }),
        false: httpBatchLink({ url, headers }),
      }),
    ],
  }) as unknown as LapisServerBrowserClient;
}

type ServerClient = LapisServerBrowserClient;

export type ServerVaultEvent = {
  id: string;
  kind: "file" | "database" | "resync-required";
  vaultId: string;
  payload: unknown;
};

function pathUrl(
  baseUrl: string,
  vaultId: string,
  route: string,
  path: string,
): string {
  const encoded = path
    .replace(/^\/+|\/+$/gu, "")
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  return `${baseUrl}/api/vaults/${encodeURIComponent(vaultId)}/${route}/${encoded}`;
}

function managedVaultPath(path: string): string {
  return path.replace(/^\/+|\/+$/gu, "");
}

/**
 * Fetch boundary for hosted plugin installs. Official release assets are
 * downloaded by the authenticated server because GitHub release responses do
 * not expose browser CORS headers.
 */
export function createServerPluginDistributionFetch(
  options: ServerPluginDistributionFetchOptions,
): FetchLike {
  const fetchImpl =
    options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  const baseUrl = (options.baseUrl ?? "").replace(/\/$/u, "");
  return (input, init) => {
    const source =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (!isOfficialPluginBundleSource(source)) {
      return fetchImpl(input, init);
    }
    const url = new URL(
      `${baseUrl}/api/vaults/${encodeURIComponent(options.vaultId)}/plugin-bundles/download`,
      globalThis.location?.href ?? "http://localhost/",
    );
    url.searchParams.set("source", source);
    return fetchImpl(url, { ...init, credentials: "same-origin" });
  };
}

async function responseError(response: Response): Promise<ServerHostError> {
  let value: { error?: { code?: ServerHostErrorCode; message?: string } } = {};
  try {
    value = await response.clone().json();
  } catch {
    // A proxy may replace the structured response; retain a stable fallback.
  }
  return new ServerHostError(
    value.error?.code ??
      (response.status === 401 ? "UNAUTHENTICATED" : "INTERNAL"),
    value.error?.message ?? `Server request failed (${response.status})`,
  );
}

async function requireOk(response: Response): Promise<Response> {
  if (!response.ok) throw await responseError(response);
  return response;
}

function unwrapTracked(value: unknown): ServerVaultEvent {
  const candidate = value as { data?: ServerVaultEvent } & ServerVaultEvent;
  return candidate.data ?? candidate;
}

function isResyncRequired(error: Error): boolean {
  const candidate = error as Error & {
    data?: { lapisCode?: ServerHostErrorCode };
  };
  return (
    candidate.data?.lapisCode === "RESYNC_REQUIRED" ||
    /resync-required/iu.test(error.message)
  );
}

/** One resumable subscription shared by the vault and database adapters. */
export class ServerVaultEventStream {
  readonly #listeners = new Set<(event: ServerVaultEvent) => void>();
  #subscription?: Subscription;
  #lastEventId?: string;
  #generation = 0;

  constructor(
    private readonly client: ServerClient,
    readonly vaultId: string,
  ) {}

  subscribe(listener: (event: ServerVaultEvent) => void): () => void {
    this.#listeners.add(listener);
    this.#ensureStarted();
    return () => {
      this.#listeners.delete(listener);
      if (!this.#listeners.size) this.close();
    };
  }

  close(): void {
    this.#generation += 1;
    this.#subscription?.unsubscribe();
    this.#subscription = undefined;
  }

  #ensureStarted(): void {
    if (this.#subscription) return;
    const generation = ++this.#generation;
    this.#subscription = this.client.events.vault.subscribe(
      { vaultId: this.vaultId, lastEventId: this.#lastEventId },
      {
        onData: (value) => {
          const event = unwrapTracked(value);
          this.#lastEventId = event.id;
          for (const listener of this.#listeners) listener(event);
        },
        onError: (error) => {
          if (generation !== this.#generation) return;
          this.#subscription = undefined;
          if (isResyncRequired(error)) {
            const unavailableId = this.#lastEventId;
            this.#lastEventId = undefined;
            const event: ServerVaultEvent = {
              id: unavailableId ?? "unavailable:0",
              kind: "resync-required",
              vaultId: this.vaultId,
              payload: null,
            };
            for (const listener of this.#listeners) listener(event);
            this.#restart(generation);
            return;
          }
          this.#restart(generation);
        },
        onComplete: () => {
          if (generation !== this.#generation) return;
          this.#subscription = undefined;
          this.#restart(generation);
        },
      },
    );
  }

  #restart(generation: number): void {
    if (!this.#listeners.size) return;
    queueMicrotask(() => {
      if (generation === this.#generation) this.#ensureStarted();
    });
  }
}

export interface ServerVaultAdapterOptions {
  client: ServerClient;
  profile: ServerVaultProfile;
  csrfToken: () => string | undefined;
  baseUrl?: string;
  fetch?: FetchLike;
  events?: ServerVaultEventStream;
}

/** Online-only VaultAdapter; it never installs a NativeDesktopBridge. */
export class ServerVaultAdapter implements VaultAdapter {
  readonly #client: ServerClient;
  readonly #fetch: FetchLike;
  readonly #baseUrl: string;
  readonly #csrfToken: () => string | undefined;
  readonly events: ServerVaultEventStream;

  constructor(readonly options: ServerVaultAdapterOptions) {
    this.#client = options.client;
    this.#fetch =
      options.fetch ?? ((input, init) => globalThis.fetch(input, init));
    this.#baseUrl = (options.baseUrl ?? "").replace(/\/$/u, "");
    this.#csrfToken = options.csrfToken;
    this.events =
      options.events ??
      new ServerVaultEventStream(options.client, options.profile.id);
  }

  getVaultId(): string {
    return this.options.profile.id;
  }

  getName(): string {
    return this.options.profile.name;
  }

  getCapabilities() {
    return {
      persistent: true,
      userVisibleFiles: false,
      requiresPermission: false,
      nativeWatch: true,
      resourceUrls: true,
      systemTrash: false,
    } as const;
  }

  async exists(path: string): Promise<boolean> {
    return (await this.stat(path)) !== null;
  }

  async stat(path: string) {
    const stat = await this.#client.filesystem.stat.query({
      vaultId: this.getVaultId(),
      path: managedVaultPath(path),
    });
    return stat
      ? {
          type: stat.type,
          ctime: stat.mtime,
          mtime: stat.mtime,
          size: stat.size,
        }
      : null;
  }

  async read(path: string): Promise<string> {
    return new TextDecoder().decode(await this.#readBytes(path));
  }

  async readBinary(path: string): Promise<ArrayBuffer> {
    const bytes = await this.#readBytes(path);
    return bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
  }

  write(path: string, data: string): Promise<void> {
    return this.#replace(path, new TextEncoder().encode(data));
  }

  writeBinary(path: string, data: ArrayBuffer): Promise<void> {
    return this.#replace(path, new Uint8Array(data));
  }

  append(path: string, data: string): Promise<void> {
    return this.#append(path, new TextEncoder().encode(data));
  }

  appendBinary(path: string, data: ArrayBuffer): Promise<void> {
    return this.#append(path, new Uint8Array(data));
  }

  async process(
    path: string,
    transform: (data: string) => string,
  ): Promise<string> {
    const url = pathUrl(this.#baseUrl, this.getVaultId(), "files", path);
    const response = await requireOk(
      await this.#fetch(url, { credentials: "same-origin" }),
    );
    const current = await response.text();
    const next = transform(current);
    if (typeof next !== "string") {
      throw new TypeError("DataAdapter.process callback must return a string");
    }
    const written = await this.#fetch(url, {
      method: "PUT",
      body: next,
      credentials: "same-origin",
      headers: this.#mutationHeaders({
        "If-Match": response.headers.get("etag") ?? "",
      }),
    });
    if (written.status === 412) throw new VaultConflictError();
    await requireOk(written);
    return next;
  }

  list(path: string) {
    return this.#client.filesystem.list.query({
      vaultId: this.getVaultId(),
      path: managedVaultPath(path),
    });
  }

  async mkdir(
    path: string,
    options?: Partial<{ recursive: boolean; mode: string }>,
  ): Promise<void> {
    await this.#client.filesystem.mkdir.mutate({
      vaultId: this.getVaultId(),
      path: managedVaultPath(path),
      recursive: options?.recursive ?? false,
    });
  }

  async rmdir(path: string, recursive: boolean): Promise<void> {
    await this.#client.filesystem.remove.mutate({
      vaultId: this.getVaultId(),
      path: managedVaultPath(path),
      recursive,
    });
  }

  async remove(path: string): Promise<void> {
    await this.#client.filesystem.remove.mutate({
      vaultId: this.getVaultId(),
      path: managedVaultPath(path),
      recursive: false,
    });
  }

  async rename(from: string, to: string): Promise<void> {
    await this.#client.filesystem.rename.mutate({
      vaultId: this.getVaultId(),
      from: managedVaultPath(from),
      to: managedVaultPath(to),
    });
  }

  async copy(from: string, to: string): Promise<void> {
    await this.#client.filesystem.copy.mutate({
      vaultId: this.getVaultId(),
      from: managedVaultPath(from),
      to: managedVaultPath(to),
    });
  }

  getResourcePath(path: string): string {
    return pathUrl(this.#baseUrl, this.getVaultId(), "resources", path);
  }

  getResourceUrl(path: string): Promise<string> {
    return Promise.resolve(this.getResourcePath(path));
  }

  trashSystem(): Promise<boolean> {
    return Promise.resolve(false);
  }

  async trashLocal(path: string): Promise<void> {
    await this.#client.filesystem.trash.mutate({
      vaultId: this.getVaultId(),
      path: managedVaultPath(path),
    });
  }

  watch(
    path: string | string[],
    _options: { recursive?: boolean; interval?: number },
    listener: (event: any) => void,
  ) {
    const roots = (Array.isArray(path) ? path : [path]).map((item) =>
      item.replace(/^\/+|\/+$/gu, ""),
    );
    const dispose = this.events.subscribe((event) => {
      if (event.kind === "resync-required") {
        listener({
          type: "error",
          path: "/",
          error: new ServerHostError(
            "RESYNC_REQUIRED",
            "Vault reload required",
          ),
        });
        return;
      }
      if (event.kind !== "file") return;
      const payload = event.payload as {
        type?: string;
        path?: string;
        from?: string;
        to?: string;
      };
      const changed = payload.path ?? payload.to ?? payload.from ?? "";
      if (
        !roots.some(
          (root) => !root || changed === root || changed.startsWith(`${root}/`),
        )
      ) {
        return;
      }
      listener({
        type:
          payload.type === "delete"
            ? "delete"
            : payload.type === "create"
              ? "create"
              : "modify",
        path: changed,
      });
    });
    return { close: dispose };
  }

  async #readBytes(path: string): Promise<Uint8Array> {
    const response = await requireOk(
      await this.#fetch(
        pathUrl(this.#baseUrl, this.getVaultId(), "files", path),
        { credentials: "same-origin" },
      ),
    );
    return new Uint8Array(await response.arrayBuffer());
  }

  async #replace(path: string, bytes: Uint8Array): Promise<void> {
    await requireOk(
      await this.#fetch(
        pathUrl(this.#baseUrl, this.getVaultId(), "files", path),
        {
          method: "PUT",
          body: bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ) as ArrayBuffer,
          credentials: "same-origin",
          headers: this.#mutationHeaders(),
        },
      ),
    );
  }

  async #append(path: string, bytes: Uint8Array): Promise<void> {
    await requireOk(
      await this.#fetch(
        `${pathUrl(this.#baseUrl, this.getVaultId(), "files", path)}?operation=append`,
        {
          method: "POST",
          body: bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ) as ArrayBuffer,
          credentials: "same-origin",
          headers: this.#mutationHeaders(),
        },
      ),
    );
  }

  #mutationHeaders(extra: Record<string, string> = {}): Headers {
    const headers = new Headers(extra);
    const csrf = this.#csrfToken();
    if (csrf) headers.set("x-lapis-csrf", csrf);
    return headers;
  }
}

function readonlyDatabaseMethod(method: string): boolean {
  return /^(?:get|list|load|query|search)/u.test(method);
}

/** AppDatabaseProvider backed exclusively by the generated remote catalogue. */
export class ServerAppDatabaseProvider implements AppDatabaseProvider {
  readonly id = "lapis-server-http-rpc";

  constructor(
    private readonly client: ServerClient,
    private readonly events: ServerVaultEventStream,
  ) {}

  canOpen(context: { runtime: string }): boolean {
    return context.runtime === "deno-server";
  }

  async open(context: { vaultId: string }): Promise<AppDatabase> {
    const listeners = new Set<AppDatabaseChangeListener>();
    const events = this.events;
    let disposeEvents: (() => void) | undefined;
    const invoke = async (method: RemoteAppDatabaseMethod, args: unknown[]) => {
      const domain = REMOTE_APP_DATABASE_CONTRACT[method].domain;
      const procedure = (this.client.database as any)[domain][method];
      return readonlyDatabaseMethod(method)
        ? procedure.query({ vaultId: context.vaultId, args })
        : procedure.mutate({ vaultId: context.vaultId, args });
    };
    const database: Record<string, unknown> = {
      kind: "turso-native",
      vaultId: context.vaultId,
      descriptor: {
        providerId: this.id,
        engine: "turso",
        transport: "http-rpc",
        role: "direct",
        storageMode: "remote",
        capabilities: {
          nativeFullTextSearch: true,
          vectorSearch: false,
          approximateNearestNeighbors: false,
          localEmbeddings: false,
          crossTabCoordination: false,
          sync: true,
        },
      },
      async open() {
        if (disposeEvents) return;
        disposeEvents = events.subscribe((event) => {
          if (event.kind === "database") {
            for (const listener of listeners) {
              listener(event.payload as AppDatabaseChangeSet);
            }
          } else if (event.kind === "resync-required") {
            const change: AppDatabaseChangeSet = {
              revision: -1,
              domains: [],
              paths: [],
              reset: true,
              committedAt: Date.now(),
            };
            for (const listener of listeners) listener(change);
          }
        });
      },
      async close() {
        disposeEvents?.();
        disposeEvents = undefined;
        listeners.clear();
      },
      subscribeToChanges(listener: AppDatabaseChangeListener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
    for (const method of REMOTE_APP_DATABASE_METHODS) {
      database[method] = (...args: unknown[]) => invoke(method, args);
    }
    await (database.open as () => Promise<void>)();
    return database as unknown as AppDatabase;
  }
}

export function createServerPluginAssetServer(
  adapter: ServerVaultAdapter,
): PluginAssetServer {
  return {
    async getPluginAssetUrl(request) {
      const metadata = JSON.parse(
        await adapter.read(appStatePath("installed-plugins.json")),
      ) as { plugins?: Record<string, InstalledPluginRecord> };
      const installed = metadata.plugins?.[request.pluginId];
      if (
        !installed ||
        getInstalledPluginAssetVersion(installed) !== request.version
      ) {
        throw new ServerHostError(
          "NOT_FOUND",
          `Plugin ${request.pluginId} is not installed`,
        );
      }
      return createWebPluginAssetUrl({
        vaultId: adapter.getVaultId(),
        pluginId: request.pluginId,
        version: request.version,
        sha256: getInstalledPluginAssetHash(installed, request.relativePath),
        path: request.relativePath,
      });
    },
  };
}

export function createServerClientSession(
  options: LapisServerClientOptions = {},
) {
  let token: string | undefined;
  const csrfToken = () => token;
  const client = createLapisServerBrowserClient({ ...options, csrfToken });
  return {
    client,
    csrfToken,
    setCsrfToken(value?: string) {
      token = value;
    },
  };
}
