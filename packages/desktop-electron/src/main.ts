import {
  ElectronMainVaultBootstrapKeyValueStore,
  getBootstrapAppearanceMode,
  migrateVaultBootstrapStoreFromIndexedDb,
  setDefaultVaultStateStore,
  setNativeDesktopBridge,
  type BootstrapAppearanceMode,
  type NativeDesktopBridge,
  type NativeWatchSubscription,
} from "@lapis-notes/api";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import { mount } from "svelte";
import DesktopVaultHost from "./DesktopVaultHost.svelte";
import "./desktop-host.css";

export type ElectronDesktopBridge = NativeDesktopBridge & {
  onOpenAboutDialog?(listener: () => void): () => void;
  onBeforeClose?(listener: () => void): () => void;
  closeAllWatches?(): void;
};

declare global {
  interface Window {
    __LAPIS_NATIVE_DESKTOP__?: ElectronDesktopBridge;
  }
}

function applyDesktopPlatformClasses(
  platform: NativeDesktopBridge["platform"],
): void {
  const root = document.documentElement;
  const desktopRuntime = platform?.runtime === "electron-desktop";
  root.classList.toggle("lapis-desktop", desktopRuntime);
  root.classList.toggle(
    "lapis-desktop--macos",
    desktopRuntime && platform?.os === "macos",
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

const preloadBridge = window.__LAPIS_NATIVE_DESKTOP__;
if (!preloadBridge) {
  throw new Error("Electron preload did not install the native desktop bridge");
}

const activeWatches = new Set<NativeWatchSubscription>();
const bridge: ElectronDesktopBridge = {
  ...preloadBridge,
  watch: preloadBridge.watch
    ? (rootPath, normalizedPath, options, listener) => {
        const subscription = preloadBridge.watch!(
          rootPath,
          normalizedPath,
          options,
          listener,
        );
        if (!subscription) return;
        const tracked = {
          close: () => {
            activeWatches.delete(tracked);
            subscription.close();
          },
        } satisfies NativeWatchSubscription;
        activeWatches.add(tracked);
        return tracked;
      }
    : undefined,
  closeAllWatches() {
    for (const watch of [...activeWatches]) watch.close();
  },
};

applyDesktopPlatformClasses(preloadBridge.platform);
setNativeDesktopBridge(bridge);
await migrateVaultBootstrapStoreFromIndexedDb();
setDefaultVaultStateStore(new ElectronMainVaultBootstrapKeyValueStore());
await initializeAppearance();

const target = document.getElementById("app");
if (!target) {
  throw new Error("Desktop renderer root is missing");
}

export default mount(DesktopVaultHost, { target, props: { bridge } });
