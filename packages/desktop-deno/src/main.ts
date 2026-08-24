import {
  NativeDesktopVaultBootstrapKeyValueStore,
  getBootstrapAppearanceMode,
  migrateVaultBootstrapStoreFromIndexedDb,
  setDefaultVaultStateStore,
  setNativeDesktopBridge,
  type AppDatabaseChangeSet,
  type BootstrapAppearanceMode,
  type ChangeEvent,
  type NativeDesktopBridge,
  type NativeDesktopCapabilityRegistry,
  type NativeDesktopNotificationPayload,
  type NativeDesktopPlatformInfo,
  type NativeAgentProcessMessage,
  type NativeAgentRuntimeEvent,
  type NativeAgentToolCall,
  type NativeAgentToolCancel,
  type NativeAppDatabaseChangeEvent,
  type NativeTerminalExitEvent,
  type NativeTerminalOutputEvent,
  type NativeWatchSubscription,
  type WatchErrorEvent,
  type WatchOptions,
} from "@lapis-notes/api";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import { mount } from "svelte";
import DesktopVaultHost from "./DesktopVaultHost.svelte";
import { waitForDesktopBindings } from "./binding-probe";
import { installDesktopWindowDrag } from "./desktop-window-drag";
import { installDenoExternalLinkPolicy } from "./external-links";
import "./desktop-host.css";

export type DesktopAppInfo = {
  name: string;
  version: string;
  buildTime: string | null;
  copyright: string;
};

export type DenoDesktopPlatformInfo = NativeDesktopPlatformInfo & {
  suggestedVaultPath?: string;
  overlayWindowControls?: boolean;
  acceptance?: boolean;
};

export type DenoDesktopBridge = NativeDesktopBridge & {
  platform: DenoDesktopPlatformInfo;
  onOpenVaultPicker?(listener: () => void): () => void;
  onOpenAboutDialog?(listener: () => void): () => void;
  onBeforeClose?(listener: () => void): () => void;
  waitForAcceptanceAppUrl?(): Promise<string>;
};

type DenoDesktopBindings = {
  invoke(command: string, payload?: Record<string, unknown>): Promise<unknown>;
  platform(): DenoDesktopPlatformInfo;
  capabilities(): NativeDesktopCapabilityRegistry;
};

type DenoRendererNativeEvent = {
  channel?: unknown;
  payload?: unknown;
};

const watchListeners = new Map<
  string,
  (event: ChangeEvent | WatchErrorEvent) => void
>();
const agentProcessListeners = new Set<
  (event: NativeAgentProcessMessage) => void
>();
const agentRuntimeListeners = new Set<
  (event: NativeAgentRuntimeEvent) => void
>();
const agentToolCallListeners = new Set<(event: NativeAgentToolCall) => void>();
const agentToolCancelListeners = new Set<
  (event: NativeAgentToolCancel) => void
>();
const terminalOutputListeners = new Set<
  (event: NativeTerminalOutputEvent) => void
>();
const terminalExitListeners = new Set<
  (event: NativeTerminalExitEvent) => void
>();
const appDatabaseChangeListeners = new Set<
  (event: NativeAppDatabaseChangeEvent) => void
>();
const openVaultListeners = new Set<() => void>();
const openAboutListeners = new Set<() => void>();
const beforeCloseListeners = new Set<() => void>();
const appUrlListeners = new Set<(url: string) => void>();
const acceptanceAppUrls: string[] = [];
const acceptanceAppUrlWaiters: Array<(url: string) => void> = [];
let appUrlFlushPending = false;
let appUrlFlushRequested = false;

async function flushPendingAppUrls(): Promise<void> {
  if (appUrlFlushPending) {
    appUrlFlushRequested = true;
    return;
  }
  appUrlFlushPending = true;
  try {
    do {
      appUrlFlushRequested = false;
      const urls = (await bindings.invoke(
        "desktop_app_url_take_pending",
      )) as unknown;
      if (!Array.isArray(urls)) continue;
      for (const value of urls) {
        if (typeof value !== "string") continue;
        for (const listener of appUrlListeners) listener(value);
        const waiter = acceptanceAppUrlWaiters.shift();
        if (waiter) waiter(value);
        else acceptanceAppUrls.push(value);
      }
    } while (appUrlFlushRequested);
  } finally {
    appUrlFlushPending = false;
  }
}

globalThis.addEventListener("lapis-deno-native-event", (rawEvent) => {
  const detail = (rawEvent as CustomEvent<DenoRendererNativeEvent>).detail;
  if (detail?.channel === "desktop_fs_watch_event") {
    const payload = detail.payload as
      | { watchId?: unknown; event?: ChangeEvent | WatchErrorEvent }
      | undefined;
    if (typeof payload?.watchId !== "string" || !payload.event) return;
    watchListeners.get(payload.watchId)?.(payload.event);
    return;
  }
  if (detail?.channel === "desktop_app_database_change") {
    const payload = detail.payload as
      | {
          vaultId?: unknown;
          change?: AppDatabaseChangeSet;
        }
      | undefined;
    if (
      typeof payload?.vaultId !== "string" ||
      !payload.change
    ) {
      return;
    }
    for (const listener of appDatabaseChangeListeners) {
      listener({
        vaultId: payload.vaultId,
        change: payload.change,
      });
    }
    return;
  }
  if (detail?.channel === "desktop_agent_process_message") {
    for (const listener of agentProcessListeners) {
      listener(detail.payload as NativeAgentProcessMessage);
    }
    return;
  }
  if (detail?.channel === "desktop_agent_runtime_event") {
    for (const listener of agentRuntimeListeners) {
      listener(detail.payload as NativeAgentRuntimeEvent);
    }
    return;
  }
  if (detail?.channel === "desktop_agent_tool_call") {
    for (const listener of agentToolCallListeners) {
      listener(detail.payload as NativeAgentToolCall);
    }
    return;
  }
  if (detail?.channel === "desktop_agent_tool_cancel") {
    for (const listener of agentToolCancelListeners) {
      listener(detail.payload as NativeAgentToolCancel);
    }
    return;
  }
  if (detail?.channel === "desktop_terminal_output") {
    for (const listener of terminalOutputListeners) {
      listener(detail.payload as NativeTerminalOutputEvent);
    }
    return;
  }
  if (detail?.channel === "desktop_terminal_exit") {
    for (const listener of terminalExitListeners) {
      listener(detail.payload as NativeTerminalExitEvent);
    }
    return;
  }
  if (detail?.channel === "desktop_menu_open_vault_picker") {
    for (const listener of openVaultListeners) listener();
    return;
  }
  if (detail?.channel === "desktop_menu_open_about_dialog") {
    for (const listener of openAboutListeners) listener();
    return;
  }
  if (detail?.channel === "desktop_renderer_before_close") {
    for (const listener of beforeCloseListeners) listener();
    return;
  }
  if (detail?.channel === "desktop_app_url_available") {
    void flushPendingAppUrls();
  }
});

function subscribe<T>(
  listeners: Set<(event: T) => void>,
  listener: (event: T) => void,
) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function createWatchId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `watch-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

function readBindings(): DenoDesktopBindings | null {
  const bindings = (globalThis as { bindings?: DenoDesktopBindings }).bindings;
  return bindings == null ? null : bindings;
}

function showStartupError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const status = document.getElementById("lapis-boot-status");
  if (status) status.textContent = message;
  const target = document.getElementById("app");
  if (!target) return;
  target.replaceChildren();
  const notice = document.createElement("p");
  notice.setAttribute("role", "alert");
  notice.textContent = message;
  target.append(notice);
}

function clearBootStatus(): void {
  document.getElementById("lapis-boot-status")?.remove();
}

function applyDesktopPlatformClasses(platform: DenoDesktopPlatformInfo): void {
  const root = document.documentElement;
  const desktopRuntime = platform.runtime === "deno-desktop";
  root.classList.toggle("lapis-desktop", desktopRuntime);
  root.classList.toggle(
    "lapis-desktop--macos",
    desktopRuntime &&
      platform.os === "macos" &&
      platform.overlayWindowControls === true,
  );
}

function resolveAppearance(mode: BootstrapAppearanceMode): "dark" | "light" {
  if (mode === "system") {
    return globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode;
}

async function initializeAppearance(): Promise<void> {
  const mode = resolveAppearance(await getBootstrapAppearanceMode());
  document.documentElement.classList.toggle("dark", mode === "dark");
  document.documentElement.classList.toggle("light", mode === "light");
  document.documentElement.classList.toggle("theme-dark", mode === "dark");
  document.documentElement.classList.toggle("theme-light", mode === "light");
  document.documentElement.dataset.uiTheme = "lapis";
}

const target = document.getElementById("app");
if (!target) {
  throw new Error("Desktop renderer root is missing");
}

let bindings: DenoDesktopBindings;
try {
  bindings = await waitForDesktopBindings({
    readBindings,
    presentAtParse: (globalThis as { __LAPIS_DENO_BINDINGS__?: boolean })
      .__LAPIS_DENO_BINDINGS__,
  });
} catch (error) {
  showStartupError(error);
  throw error;
}

const platform = (await bindings
  .invoke("desktop_platform_get")
  .catch(() => bindings.platform())) as DenoDesktopPlatformInfo;
const capabilities = (await bindings
  .invoke("desktop_capabilities_get")
  .catch(() => bindings.capabilities())) as NativeDesktopCapabilityRegistry;

const bridge: DenoDesktopBridge = {
  runtime: "deno-desktop",
  platform,
  capabilities,
  invoke: (command, payload) =>
    bindings.invoke(command, payload) as Promise<never>,
  toFileUrl(path) {
    const normalized = path.replace(/\\/gu, "/");
    return `file://${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
  },
  getResourceUrl(rootPath, normalizedPath) {
    return bindings.invoke("desktop_fs_get_resource_url", {
      rootPath,
      normalizedPath,
    }) as Promise<string>;
  },
  showNotification(payload: NativeDesktopNotificationPayload) {
    return bindings.invoke("desktop_notifications_show", {
      notification: payload,
    }) as Promise<void>;
  },
  onAgentProcessMessage(listener) {
    return subscribe(agentProcessListeners, listener);
  },
  onAgentRuntimeEvent(listener) {
    return subscribe(agentRuntimeListeners, listener);
  },
  onAgentToolCall(listener) {
    return subscribe(agentToolCallListeners, listener);
  },
  onAgentToolCancel(listener) {
    return subscribe(agentToolCancelListeners, listener);
  },
  onTerminalOutput(listener) {
    return subscribe(terminalOutputListeners, listener);
  },
  onTerminalExit(listener) {
    return subscribe(terminalExitListeners, listener);
  },
  onAppDatabaseChange(listener) {
    return subscribe(appDatabaseChangeListeners, listener);
  },
  watch(
    rootPath: string,
    normalizedPath: string,
    options: WatchOptions,
    listener: (event: ChangeEvent | WatchErrorEvent) => void,
  ): NativeWatchSubscription {
    const watchId = createWatchId();
    watchListeners.set(watchId, listener);
    void bindings
      .invoke("desktop_fs_watch_start", {
        watchId,
        rootPath,
        normalizedPath,
        recursive: options.recursive ?? false,
      })
      .catch((error) => {
        watchListeners.get(watchId)?.({
          type: "error",
          path: normalizedPath || "/",
          error,
        });
      });
    return {
      close() {
        watchListeners.delete(watchId);
        void bindings.invoke("desktop_fs_watch_stop", { watchId });
      },
    };
  },
  onOpenVaultPicker(listener) {
    return subscribe(openVaultListeners, listener);
  },
  onOpenAboutDialog(listener) {
    return subscribe(openAboutListeners, listener);
  },
  onBeforeClose(listener) {
    return subscribe(beforeCloseListeners, listener);
  },
  onAppUrlOpen(listener) {
    const unsubscribe = subscribe(appUrlListeners, listener);
    void flushPendingAppUrls();
    return unsubscribe;
  },
  waitForAcceptanceAppUrl() {
    const queued = acceptanceAppUrls.shift();
    if (queued) return Promise.resolve(queued);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = acceptanceAppUrlWaiters.indexOf(onUrl);
        if (index !== -1) acceptanceAppUrlWaiters.splice(index, 1);
        reject(new Error("Deno app URL acceptance timed out"));
      }, 30_000);
      const onUrl = (url: string) => {
        clearTimeout(timeout);
        resolve(url);
      };
      acceptanceAppUrlWaiters.push(onUrl);
      void flushPendingAppUrls();
    });
  },
};

applyDesktopPlatformClasses(platform);
installDenoExternalLinkPolicy((command, payload) =>
  bindings.invoke(command, payload),
);
installDesktopWindowDrag((command, payload) =>
  bindings.invoke(command, payload),
);
setNativeDesktopBridge(bridge);
await migrateVaultBootstrapStoreFromIndexedDb();
setDefaultVaultStateStore(new NativeDesktopVaultBootstrapKeyValueStore());
await initializeAppearance();

clearBootStatus();
export default mount(DesktopVaultHost, { target, props: { bridge } });
