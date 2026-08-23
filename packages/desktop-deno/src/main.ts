import {
  ElectronMainVaultBootstrapKeyValueStore,
  getBootstrapAppearanceMode,
  migrateVaultBootstrapStoreFromIndexedDb,
  setDefaultVaultStateStore,
  setNativeDesktopBridge,
  type BootstrapAppearanceMode,
  type NativeDesktopBridge,
  type NativeDesktopCapabilityRegistry,
  type NativeDesktopPlatformInfo,
} from "@lapis-notes/api";
import "@lapismd/design-core/styles.css";
import "@lapismd/design-core/themes/lapis.css";
import "@lapis-notes/ui/theme.css";
import "@lapis-notes/ui/codemirror-autocomplete.css";
import { mount } from "svelte";
import DesktopVaultHost from "./DesktopVaultHost.svelte";
import { waitForDesktopBindings } from "./binding-probe";
import { installDesktopWindowDrag } from "./desktop-window-drag";
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
};

type DenoDesktopBindings = {
  invoke(command: string, payload?: Record<string, unknown>): Promise<unknown>;
  platform(): DenoDesktopPlatformInfo;
  capabilities(): NativeDesktopCapabilityRegistry;
};

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
const openVaultListeners = new Set<() => void>();

window.addEventListener("lapis-deno-open-vault", () => {
  for (const listener of openVaultListeners) listener();
});

const bridge: DenoDesktopBridge = {
  runtime: "deno-desktop",
  platform,
  capabilities,
  invoke: (command, payload) =>
    bindings.invoke(command, payload) as Promise<never>,
  toFileUrl: (path) => `file://${path}`,
  onOpenVaultPicker(listener) {
    openVaultListeners.add(listener);
    return () => {
      openVaultListeners.delete(listener);
    };
  },
};

applyDesktopPlatformClasses(platform);
installDesktopWindowDrag((command, payload) =>
  bindings.invoke(command, payload),
);
setNativeDesktopBridge(bridge);
await migrateVaultBootstrapStoreFromIndexedDb();
setDefaultVaultStateStore(new ElectronMainVaultBootstrapKeyValueStore());
await initializeAppearance();

clearBootStatus();
export default mount(DesktopVaultHost, { target, props: { bridge } });
