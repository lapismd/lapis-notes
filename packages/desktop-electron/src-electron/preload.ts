import { contextBridge, ipcRenderer } from "electron";
import type {
  ChangeEvent,
  NativeAgentProcessMessage,
  NativeAgentRuntimeEvent,
  NativeAgentToolCall,
  NativeAgentToolCancel,
  NativeAppDatabaseChangeEvent,
  NativeTerminalExitEvent,
  NativeTerminalOutputEvent,
  NativeDesktopCapabilityRegistry,
  NativeDesktopBridge,
  NativeDesktopNotificationPayload,
  NativeDesktopPlatformInfo,
  NativeWatchSubscription,
  WatchErrorEvent,
  WatchOptions,
} from "@lapis-notes/api";
import {
  DESKTOP_INVOKE_COMMANDS,
  createDesktopCapabilityRegistry,
} from "./desktop-capabilities";

// Expose the native desktop bridge to the renderer process.
// The renderer reads `window.__LAPIS_NATIVE_DESKTOP__` in `src/main.ts` and
// registers it with `setNativeDesktopBridge()` before mounting the desktop host.

const watchListeners = new Map<
  string,
  (event: ChangeEvent | WatchErrorEvent) => void
>();
const openVaultPickerListeners = new Set<() => void>();
const openAboutDialogListeners = new Set<() => void>();
const beforeCloseListeners = new Set<() => void>();

ipcRenderer.on(
  "desktop_fs_watch_event",
  (
    _event,
    payload: { watchId?: string; event?: ChangeEvent | WatchErrorEvent },
  ) => {
    if (!payload.watchId || !payload.event) {
      return;
    }
    watchListeners.get(payload.watchId)?.(payload.event);
  },
);

const appUrlListeners = new Set<(url: string) => void>();
const agentProcessListeners = new Set<(event: NativeAgentProcessMessage) => void>();
const agentRuntimeListeners = new Set<(event: NativeAgentRuntimeEvent) => void>();
const agentToolCallListeners = new Set<(event: NativeAgentToolCall) => void>();
const agentToolCancelListeners = new Set<(event: NativeAgentToolCancel) => void>();
const terminalOutputListeners = new Set<(event: NativeTerminalOutputEvent) => void>();
const terminalExitListeners = new Set<(event: NativeTerminalExitEvent) => void>();
const appDatabaseChangeListeners = new Set<
  (event: NativeAppDatabaseChangeEvent) => void
>();

ipcRenderer.on(
  "desktop_db_change",
  (_event, payload: NativeAppDatabaseChangeEvent) => {
    for (const listener of appDatabaseChangeListeners) listener(payload);
  },
);

ipcRenderer.on(
  "desktop_agent_process_message",
  (_event, payload: NativeAgentProcessMessage) => {
    for (const listener of agentProcessListeners) listener(payload);
  },
);

ipcRenderer.on(
  "desktop_agent_runtime_event",
  (_event, payload: NativeAgentRuntimeEvent) => {
    for (const listener of agentRuntimeListeners) listener(payload);
  },
);

ipcRenderer.on(
  "desktop_agent_tool_call",
  (_event, payload: NativeAgentToolCall) => {
    for (const listener of agentToolCallListeners) listener(payload);
  },
);

ipcRenderer.on(
  "desktop_agent_tool_cancel",
  (_event, payload: NativeAgentToolCancel) => {
    for (const listener of agentToolCancelListeners) listener(payload);
  },
);

ipcRenderer.on(
  "desktop_terminal_output",
  (_event, payload: NativeTerminalOutputEvent) => {
    for (const listener of terminalOutputListeners) listener(payload);
  },
);

ipcRenderer.on(
  "desktop_terminal_exit",
  (_event, payload: NativeTerminalExitEvent) => {
    for (const listener of terminalExitListeners) listener(payload);
  },
);

ipcRenderer.on("desktop_menu_open_vault_picker", () => {
  for (const listener of openVaultPickerListeners) {
    listener();
  }
});

ipcRenderer.on("desktop_menu_open_about_dialog", () => {
  for (const listener of openAboutDialogListeners) {
    listener();
  }
});

ipcRenderer.on("desktop_renderer_before_close", () => {
  for (const listener of beforeCloseListeners) {
    listener();
  }
});

async function flushPendingAppUrls(): Promise<void> {
  const urls = (await ipcRenderer.invoke(
    "desktop_app_url_take_pending",
  )) as string[];
  for (const url of urls) {
    for (const listener of appUrlListeners) {
      listener(url);
    }
  }
}

ipcRenderer.on("desktop_app_url_available", () => {
  void flushPendingAppUrls();
});

function createWatchId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `watch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getPlatformOs(): NativeDesktopPlatformInfo["os"] {
  switch (process.platform) {
    case "darwin":
      return "macos";
    case "win32":
      return "windows";
    case "linux":
      return "linux";
    default:
      return "unknown";
  }
}

function getPlatformInfo(): NativeDesktopPlatformInfo {
  return {
    runtime: "electron-desktop",
    os: getPlatformOs(),
    arch: process.arch,
    runtimeVersion: process.versions.electron,
  };
}

const bridge: NativeDesktopBridge & {
  onOpenVaultPicker(listener: () => void): () => void;
  onOpenAboutDialog(listener: () => void): () => void;
  onBeforeClose(listener: () => void): () => void;
} = {
  runtime: "electron-desktop",
  platform: getPlatformInfo(),
  capabilities: createDesktopCapabilityRegistry(),

  invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T> {
    if (!DESKTOP_INVOKE_COMMANDS.has(command)) {
      return Promise.reject(new Error(`Unsupported desktop command: ${command}`));
    }
    return ipcRenderer.invoke(command, payload) as Promise<T>;
  },

  toFileUrl(filePath: string): string {
    // Convert a native file path to a safe-to-load URL.
    const normalized = filePath.replace(/\\/g, "/");
    const encoded = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `file://${encoded}`;
  },

  getResourceUrl(rootPath: string, normalizedPath: string): Promise<string> {
    return ipcRenderer.invoke("desktop_fs_get_resource_url", {
      rootPath,
      normalizedPath,
    }) as Promise<string>;
  },

  showNotification(payload: NativeDesktopNotificationPayload): Promise<void> {
    return ipcRenderer.invoke("desktop_notifications_show", {
      notification: payload,
    }) as Promise<void>;
  },

  onOpenVaultPicker(listener: () => void): () => void {
    openVaultPickerListeners.add(listener);
    return () => {
      openVaultPickerListeners.delete(listener);
    };
  },

  onOpenAboutDialog(listener: () => void): () => void {
    openAboutDialogListeners.add(listener);
    return () => {
      openAboutDialogListeners.delete(listener);
    };
  },

  onBeforeClose(listener: () => void): () => void {
    beforeCloseListeners.add(listener);
    return () => {
      beforeCloseListeners.delete(listener);
    };
  },

  watch(
    rootPath: string,
    normalizedPath: string,
    options: WatchOptions,
    listener: (event: ChangeEvent | WatchErrorEvent) => void,
  ): NativeWatchSubscription {
    const watchId = createWatchId();
    watchListeners.set(watchId, listener);

    void ipcRenderer
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
      close: () => {
        watchListeners.delete(watchId);
        void ipcRenderer.invoke("desktop_fs_watch_stop", { watchId });
      },
    };
  },

  onAppUrlOpen(listener: (url: string) => void): () => void {
    appUrlListeners.add(listener);
    void flushPendingAppUrls();
    return () => {
      appUrlListeners.delete(listener);
    };
  },

  onAgentProcessMessage(
    listener: (event: NativeAgentProcessMessage) => void,
  ): () => void {
    agentProcessListeners.add(listener);
    return () => {
      agentProcessListeners.delete(listener);
    };
  },

  onAgentRuntimeEvent(
    listener: (event: NativeAgentRuntimeEvent) => void,
  ): () => void {
    agentRuntimeListeners.add(listener);
    return () => {
      agentRuntimeListeners.delete(listener);
    };
  },

  onAgentToolCall(listener: (event: NativeAgentToolCall) => void): () => void {
    agentToolCallListeners.add(listener);
    return () => {
      agentToolCallListeners.delete(listener);
    };
  },

  onAgentToolCancel(listener: (event: NativeAgentToolCancel) => void): () => void {
    agentToolCancelListeners.add(listener);
    return () => {
      agentToolCancelListeners.delete(listener);
    };
  },

  onTerminalOutput(
    listener: (event: NativeTerminalOutputEvent) => void,
  ): () => void {
    terminalOutputListeners.add(listener);
    return () => {
      terminalOutputListeners.delete(listener);
    };
  },

  onTerminalExit(
    listener: (event: NativeTerminalExitEvent) => void,
  ): () => void {
    terminalExitListeners.add(listener);
    return () => {
      terminalExitListeners.delete(listener);
    };
  },

  onAppDatabaseChange(
    listener: (event: NativeAppDatabaseChangeEvent) => void,
  ): () => void {
    appDatabaseChangeListeners.add(listener);
    return () => {
      appDatabaseChangeListeners.delete(listener);
    };
  },
};

contextBridge.exposeInMainWorld("__LAPIS_NATIVE_DESKTOP__", bridge);
