import { contextBridge, ipcRenderer } from "electron";
import type {
  ChangeEvent,
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
};

contextBridge.exposeInMainWorld("__LAPIS_NATIVE_DESKTOP__", bridge);
