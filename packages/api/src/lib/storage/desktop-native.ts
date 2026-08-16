/**
 * Desktop-neutral native bridge for Lapis Notes desktop hosts.
 *
 * The Electron shell registers its host bridge before calling
 * `mountWorkspaceApp()`, and shared storage/session code in `packages/api`
 * picks it up via `getNativeDesktopBridge()` / `hasNativeDesktopBridge()`.
 */

import type { AppDatabaseNotificationSeverity } from "./app-database";
import { dirname, joinPath, normalizePath, basename } from "./path";
import type {
  ChangeEvent,
  AsyncResourceAdapter,
  DataWriteOptions,
  ListedFiles,
  NativeWatchAdapter,
  NativeWatchSubscription,
  Stat,
  VaultAdapter,
  VaultAdapterCapabilities,
  VaultIdentityAdapter,
  WatchErrorEvent,
  WatchOptions,
} from "./fs";
import {
  deleteVaultProfile,
  getDefaultVaultStateStore,
  getVaultProfile,
  replaceVaultProfile,
  saveVaultProfile,
  type KeyValueStore,
  type VaultProfile,
} from "./vault-state";

// ─── Bridge global ────────────────────────────────────────────────────────────

const NATIVE_BRIDGE_GLOBAL = "__LAPIS_NATIVE_DESKTOP__";
let registeredNativeDesktopBridge: NativeDesktopBridge | null = null;

// ─── Neutral interface ────────────────────────────────────────────────────────

export type NativeDesktopRuntime = "electron-desktop";

export type NativeDesktopPlatformOs = "macos" | "windows" | "linux" | "unknown";

export interface NativeDesktopPlatformInfo {
  readonly runtime: NativeDesktopRuntime;
  readonly os: NativeDesktopPlatformOs;
  readonly arch: string;
  readonly runtimeVersion?: string;
  readonly appVersion?: string;
  readonly packaged?: boolean;
}

export type NativeDesktopCapabilityId =
  | "resource"
  | "database"
  | "search"
  | "notebook"
  | "language-service"
  | "model"
  | "plugin-sidecar"
  | "plugin-assets"
  | "file-watch"
  | "notifications"
  | "file-system-actions"
  | "agent-runtime";

export type NativeAgentProcessMessage = {
  processId: string;
  type: "stdout" | "stderr" | "exit";
  data?: string;
  exitCode?: number;
};

export type NativeAgentRuntimeEvent = {
  sessionId: string;
  runId: string;
  sequence: number;
  event: {
    type: "event" | "permission" | "closed";
    event?: Record<string, unknown>;
    request?: Record<string, unknown>;
  };
};

export type NativeDesktopCapabilityStatus = "available" | "unavailable";

export interface NativeDesktopCapability {
  readonly id: NativeDesktopCapabilityId;
  readonly status: NativeDesktopCapabilityStatus;
  readonly provider?: string;
  readonly details?: Record<string, string | number | boolean | null>;
}

export type NativeDesktopCapabilityRegistry = Partial<
  Record<NativeDesktopCapabilityId, NativeDesktopCapability>
>;

/**
 * The desktop-neutral native bridge interface. The Electron desktop host
 * implements this contract and registers it via `setNativeDesktopBridge`.
 */
export interface NativeDesktopBridge {
  readonly runtime: NativeDesktopRuntime;
  readonly platform?: NativeDesktopPlatformInfo;
  readonly capabilities?: NativeDesktopCapabilityRegistry;
  invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
  toFileUrl(path: string): string;
  getResourceUrl?(rootPath: string, normalizedPath: string): Promise<string>;
  showNotification?(payload: NativeDesktopNotificationPayload): Promise<void>;
  startDragging?(): Promise<void>;
  onOpenVaultPicker?(listener: () => void): () => void;
  onAppUrlOpen?(listener: (url: string) => void): () => void;
  onAgentProcessMessage?(
    listener: (event: NativeAgentProcessMessage) => void,
  ): () => void;
  onAgentRuntimeEvent?(
    listener: (event: NativeAgentRuntimeEvent) => void,
  ): () => void;
  watch?(
    rootPath: string,
    normalizedPath: string,
    options: WatchOptions,
    listener: (event: ChangeEvent | WatchErrorEvent) => void,
  ): NativeWatchSubscription | void;
}

type NativeVectorSearchResult =
  | {
      available: true;
      candidates: Array<{
        path: string;
        score: number;
        matchedChunkIds: string[];
      }>;
    }
  | { available: false; reason: string };

export interface NativeVaultSelection {
  path: string;
  name: string;
}

export interface NativeVaultHandle {
  rootPath: string;
}

export interface NativeVaultOptions {
  vaultId?: string;
  name?: string;
  stateStore?: KeyValueStore;
}

type NativeVaultSelectionCommand =
  | "desktop_pick_vault_folder"
  | "desktop_create_vault_folder"
  | "desktop_open_demo_vault";

declare global {
  // eslint-disable-next-line no-var
  var __LAPIS_NATIVE_DESKTOP__: NativeDesktopBridge | undefined;
}

// ─── Bridge registration ──────────────────────────────────────────────────────

export function getNativeDesktopBridge(): NativeDesktopBridge | null {
  return (
    registeredNativeDesktopBridge ?? globalThis[NATIVE_BRIDGE_GLOBAL] ?? null
  );
}

export interface NativeDesktopNotificationPayload {
  readonly id: string;
  readonly title?: string;
  readonly message: string;
  readonly severity: AppDatabaseNotificationSeverity;
  readonly source?: string;
}

export function hasNativeDesktopBridge(): boolean {
  return getNativeDesktopBridge() !== null;
}

export function getNativeDesktopPlatform(): NativeDesktopPlatformInfo | null {
  return getNativeDesktopBridge()?.platform ?? null;
}

export function getNativeDesktopCapabilities(): NativeDesktopCapabilityRegistry {
  return getNativeDesktopBridge()?.capabilities ?? {};
}

export function getNativeDesktopCapability(
  id: NativeDesktopCapabilityId,
): NativeDesktopCapability | null {
  return getNativeDesktopCapabilities()[id] ?? null;
}

export function hasNativeDesktopCapability(
  id: NativeDesktopCapabilityId,
): boolean {
  return getNativeDesktopCapability(id)?.status === "available";
}

export function setNativeDesktopBridge(
  bridge: NativeDesktopBridge | null,
): void {
  registeredNativeDesktopBridge = bridge;
}

export async function startNativeDesktopWindowDragging(): Promise<void> {
  await getNativeDesktopBridge()?.startDragging?.();
}

export async function showNativeDesktopNotification(
  payload: NativeDesktopNotificationPayload,
): Promise<void> {
  if (!hasNativeDesktopCapability("notifications")) {
    return;
  }

  const bridge = getNativeDesktopBridge();
  if (!bridge) {
    return;
  }

  if (bridge.showNotification) {
    await bridge.showNotification(payload);
    return;
  }

  await bridge.invoke("desktop_notifications_show", { notification: payload });
}

export async function resolveNativeDesktopVaultPath(
  rootPath: string,
  normalizedPath: string,
): Promise<string | null> {
  if (!hasNativeDesktopCapability("file-system-actions")) {
    return null;
  }
  const bridge = getNativeDesktopBridge();
  if (!bridge) {
    return null;
  }
  return bridge.invoke<string>("desktop_fs_resolve_path", {
    rootPath,
    normalizedPath,
  });
}

export async function resolveNativeDesktopVaultPathToRelative(
  rootPath: string,
  absolutePath: string,
): Promise<string | null> {
  if (!hasNativeDesktopCapability("file-system-actions")) {
    return null;
  }
  const bridge = getNativeDesktopBridge();
  if (!bridge) {
    return null;
  }
  return bridge.invoke<string | null>("desktop_fs_to_vault_path", {
    rootPath,
    absolutePath,
  });
}

export async function openNativeDesktopVaultPath(
  rootPath: string,
  normalizedPath: string,
): Promise<void> {
  const bridge = getNativeDesktopBridge();
  if (!bridge || !hasNativeDesktopCapability("file-system-actions")) {
    throw new Error("Native file actions are unavailable");
  }
  await bridge.invoke("desktop_fs_open_path", { rootPath, normalizedPath });
}

export async function revealNativeDesktopVaultPath(
  rootPath: string,
  normalizedPath: string,
): Promise<void> {
  const bridge = getNativeDesktopBridge();
  if (!bridge || !hasNativeDesktopCapability("file-system-actions")) {
    throw new Error("Native file actions are unavailable");
  }
  await bridge.invoke("desktop_fs_reveal_path", { rootPath, normalizedPath });
}

export async function moveNativeDesktopVaultProfile(
  profile: VaultProfile,
  options: { stateStore?: KeyValueStore } = {},
): Promise<VaultProfile | null> {
  const rootPath = getVaultHandleRootPath(profile);
  if (!rootPath) {
    throw new Error("Stored desktop vault path is unavailable");
  }

  const selection = await invokeNative<NativeVaultSelection | null>(
    "desktop_move_vault_folder",
    {
      path: rootPath,
      vaultId: profile.id,
    },
  );
  if (!selection) {
    return null;
  }

  const nextProfile: VaultProfile = {
    ...profile,
    id: buildVaultId(selection.path),
    updatedAt: Date.now(),
    handle: { rootPath: selection.path } satisfies NativeVaultHandle,
  };
  await replaceVaultProfile(
    profile.id,
    nextProfile,
    options.stateStore ?? getDefaultVaultStateStore(),
  );
  return nextProfile;
}

export async function removeStoredVaultProfile(
  profileId: string,
  options: { stateStore?: KeyValueStore } = {},
): Promise<void> {
  await deleteVaultProfile(
    profileId,
    options.stateStore ?? getDefaultVaultStateStore(),
  );
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function createFsError(code: string, path: string): Error & { code: string } {
  const error = new Error(`${code}: ${path}`) as Error & { code: string };
  error.code = code;
  return error;
}

function toNativeError(error: unknown): Error & { code?: string } {
  if (error instanceof Error) {
    return error as Error & { code?: string };
  }

  const message = typeof error === "string" ? error : String(error);
  const match = /^([A-Z0-9_]+):\s*(.*)$/u.exec(message);
  const wrapped = new Error(match?.[2] || message) as Error & {
    code?: string;
  };
  if (match) {
    wrapped.code = match[1];
  }
  return wrapped;
}

function normalizeVaultPath(path: string): string {
  path = normalizePath(path);
  if (path === "/" || !path) return "/";
  if (path.startsWith("../") || path === "..") {
    throw createFsError("EINVAL", path);
  }
  return path.replace(/^\/+/, "").replace(/\/+$/, "");
}

function normalizeRootPath(rootPath: string): string {
  return rootPath.replace(/[\\/]+$/u, "");
}

function buildVaultId(rootPath: string): string {
  return `desktop-folder:${normalizeRootPath(rootPath).replace(/\\/gu, "/")}`;
}

function getVaultHandleRootPath(profile: VaultProfile): string | null {
  const handle = profile.handle as NativeVaultHandle | string | undefined;
  if (typeof handle === "string") {
    return handle;
  }
  if (handle && typeof handle === "object" && "rootPath" in handle) {
    return typeof handle.rootPath === "string" ? handle.rootPath : null;
  }
  return null;
}

function resolveAbsolutePath(rootPath: string, normalizedPath: string): string {
  const path = normalizeVaultPath(normalizedPath);
  const basePath = normalizeRootPath(rootPath);
  if (path === "/") {
    return basePath;
  }

  const separator = rootPath.includes("\\") ? "\\" : "/";
  return `${basePath}${separator}${path.split("/").join(separator)}`;
}

function requireBridge(): NativeDesktopBridge {
  const bridge = getNativeDesktopBridge();
  if (!bridge) {
    throw new Error("Native desktop bridge is unavailable");
  }
  return bridge;
}

async function invokeNative<T>(
  command: string,
  payload?: Record<string, unknown>,
): Promise<T> {
  try {
    return await requireBridge().invoke<T>(command, payload);
  } catch (error) {
    throw toNativeError(error);
  }
}

// ─── Vault adapter ────────────────────────────────────────────────────────────

export class NativeDesktopVaultAdapter
  implements
    VaultAdapter,
    VaultIdentityAdapter,
    AsyncResourceAdapter,
    NativeWatchAdapter
{
  readonly runtime: "electron-desktop";
  readonly vaultId: string;
  readonly name: string;

  constructor(
    readonly rootPath: string,
    options: NativeVaultOptions = {},
    runtime: NativeDesktopRuntime = "electron-desktop",
  ) {
    this.runtime = runtime;
    this.vaultId = options.vaultId ?? buildVaultId(rootPath);
    this.name = options.name ?? basename(normalizeRootPath(rootPath));
  }

  static async fromProfile(
    profile: VaultProfile,
    options: NativeVaultOptions = {},
  ): Promise<NativeDesktopVaultAdapter> {
    const rootPath = getVaultHandleRootPath(profile);
    if (!rootPath) {
      throw new Error("Stored desktop vault path is unavailable");
    }

    const bridge = requireBridge();
    const adapter = new NativeDesktopVaultAdapter(
      rootPath,
      {
        ...options,
        vaultId: options.vaultId ?? profile.id,
        name: options.name ?? profile.name,
      },
      bridge.runtime,
    );
    const stat = await adapter.stat("/");
    if (!stat || stat.type !== "folder") {
      throw createFsError("ENOENT", rootPath);
    }
    return adapter;
  }

  getName(): string {
    return this.name;
  }

  getVaultId(): string {
    return this.vaultId;
  }

  getCapabilities(): Partial<VaultAdapterCapabilities> {
    return {
      persistent: true,
      userVisibleFiles: true,
      requiresPermission: false,
      nativeWatch:
        hasNativeDesktopCapability("file-watch") ||
        typeof getNativeDesktopBridge()?.watch === "function",
      resourceUrls: true,
      systemTrash: false,
    };
  }

  watch(
    normalizedPath: string | string[],
    options: WatchOptions,
    listener: (event: ChangeEvent | WatchErrorEvent) => void,
  ): NativeWatchSubscription | void {
    if (Array.isArray(normalizedPath)) {
      const subscriptions = normalizedPath
        .map(
          (path) =>
            this.watch(
              path,
              options,
              listener,
            ) as NativeWatchSubscription | void,
        )
        .filter((subscription): subscription is NativeWatchSubscription =>
          Boolean(subscription),
        );
      return {
        close: () => {
          subscriptions.forEach((subscription) => subscription.close());
        },
      };
    }

    return getNativeDesktopBridge()?.watch?.(
      this.rootPath,
      normalizeVaultPath(normalizedPath),
      options,
      listener,
    );
  }

  async exists(normalizedPath: string): Promise<boolean> {
    return invokeNative<boolean>("desktop_fs_exists", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
    });
  }

  async stat(normalizedPath: string): Promise<Stat | null> {
    return invokeNative<Stat | null>("desktop_fs_stat", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
    });
  }

  async read(normalizedPath: string): Promise<string> {
    return invokeNative<string>("desktop_fs_read_text", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
    });
  }

  async readBinary(normalizedPath: string): Promise<ArrayBuffer> {
    const data = await invokeNative<number[]>("desktop_fs_read_binary", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
    });
    return new Uint8Array(data).buffer;
  }

  async write(
    normalizedPath: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void> {
    await invokeNative<void>("desktop_fs_write_text", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
      data,
      options,
    });
  }

  async writeBinary(
    normalizedPath: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    await invokeNative<void>("desktop_fs_write_binary", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
      data: [...new Uint8Array(data)],
      options,
    });
  }

  async append(
    normalizedPath: string,
    data: string,
    options?: DataWriteOptions,
  ): Promise<void> {
    await invokeNative<void>("desktop_fs_append_text", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
      data,
      options,
    });
  }

  async appendBinary(
    normalizedPath: string,
    data: ArrayBuffer,
    options?: DataWriteOptions,
  ): Promise<void> {
    const current = await this.readBinary(normalizedPath).catch((error) => {
      if ((error as { code?: string }).code === "ENOENT") {
        return new ArrayBuffer(0);
      }
      throw error;
    });
    const previous = new Uint8Array(current);
    const next = new Uint8Array(previous.byteLength + data.byteLength);
    next.set(previous);
    next.set(new Uint8Array(data), previous.byteLength);
    await this.writeBinary(normalizedPath, next.buffer, options);
  }

  async process(
    normalizedPath: string,
    fn: (data: string) => string,
    options?: DataWriteOptions,
  ): Promise<string> {
    const next = fn(await this.read(normalizedPath));
    await this.write(normalizedPath, next, options);
    return next;
  }

  async list(normalizedPath: string): Promise<ListedFiles> {
    return invokeNative<ListedFiles>("desktop_fs_list", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
    });
  }

  async mkdir(
    normalizedPath: string,
    options?: Partial<{ recursive: boolean; mode: string }>,
  ): Promise<void> {
    await invokeNative<void>("desktop_fs_mkdir", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
      recursive: options?.recursive ?? false,
    });
  }

  async rmdir(normalizedPath: string, recursive: boolean): Promise<void> {
    await invokeNative<void>("desktop_fs_rmdir", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
      recursive,
    });
  }

  async remove(normalizedPath: string): Promise<void> {
    await invokeNative<void>("desktop_fs_remove", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
    });
  }

  async rename(
    normalizedPath: string,
    normalizedNewPath: string,
  ): Promise<void> {
    await invokeNative<void>("desktop_fs_rename", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
      normalizedNewPath: normalizeVaultPath(normalizedNewPath),
    });
  }

  async copy(normalizedPath: string, normalizedNewPath: string): Promise<void> {
    await invokeNative<void>("desktop_fs_copy", {
      rootPath: this.rootPath,
      normalizedPath: normalizeVaultPath(normalizedPath),
      normalizedNewPath: normalizeVaultPath(normalizedNewPath),
    });
  }

  getResourcePath(normalizedPath: string): string {
    return requireBridge().toFileUrl(
      resolveAbsolutePath(this.rootPath, normalizedPath),
    );
  }

  async getResourceUrl(normalizedPath: string): Promise<string> {
    const path = normalizeVaultPath(normalizedPath);
    const bridge = requireBridge();
    if (bridge.getResourceUrl) {
      return bridge.getResourceUrl(this.rootPath, path);
    }
    return this.getResourcePath(normalizedPath);
  }

  async trashSystem(): Promise<boolean> {
    return false;
  }

  async trashLocal(normalizedPath: string): Promise<void> {
    const path = normalizeVaultPath(normalizedPath);
    const trashPath = normalizeVaultPath(joinPath(".trash", path));
    await this.mkdir(dirname(trashPath), { recursive: true }).catch(() => {});
    await this.rename(path, trashPath);
  }
}

// ─── Vault picker ─────────────────────────────────────────────────────────────

async function selectNativeDesktopVault(
  command: NativeVaultSelectionCommand,
  options: NativeVaultOptions = {},
): Promise<{
  adapter: NativeDesktopVaultAdapter;
  profile: VaultProfile;
} | null> {
  const bridge = requireBridge();
  const selection = await invokeNative<NativeVaultSelection | null>(command);
  if (!selection) {
    return null;
  }

  const adapter = new NativeDesktopVaultAdapter(
    selection.path,
    {
      ...options,
      name: options.name ?? selection.name,
    },
    bridge.runtime,
  );
  const now = Date.now();
  const store = options.stateStore ?? getDefaultVaultStateStore();
  const existingProfile = await getVaultProfile(adapter.getVaultId(), store);
  const profile: VaultProfile = {
    id: adapter.getVaultId(),
    name: adapter.getName(),
    kind: "desktop-folder",
    handle: { rootPath: selection.path } satisfies NativeVaultHandle,
    createdAt: existingProfile?.createdAt ?? now,
    updatedAt: now,
  };
  await saveVaultProfile(profile, store);
  return { adapter, profile };
}

export async function pickNativeDesktopVault(
  options: NativeVaultOptions = {},
): Promise<{
  adapter: NativeDesktopVaultAdapter;
  profile: VaultProfile;
} | null> {
  return selectNativeDesktopVault("desktop_pick_vault_folder", options);
}

export async function createNativeDesktopVault(
  options: NativeVaultOptions = {},
): Promise<{
  adapter: NativeDesktopVaultAdapter;
  profile: VaultProfile;
} | null> {
  return selectNativeDesktopVault("desktop_create_vault_folder", options);
}

export async function openNativeDesktopDemoVault(
  options: NativeVaultOptions = {},
): Promise<{
  adapter: NativeDesktopVaultAdapter;
  profile: VaultProfile;
} | null> {
  return selectNativeDesktopVault("desktop_open_demo_vault", options);
}
