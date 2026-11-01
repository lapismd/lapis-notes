/// <reference types="vite-plugin-pwa/client" />

import { mount, unmount } from "svelte";
import { get } from "svelte/store";
import { registerSW } from "virtual:pwa-register";
import PwaUpdatePrompt from "./PwaUpdatePrompt.svelte";
import { createPwaHostStateController } from "./pwa-host-state";
import {
  getPwaRuntimeApplication,
  preparePwaUpdate,
  onPwaRuntimeApplicationChanged,
  type PwaRuntimeApp as RuntimeApp,
} from "./pwa-runtime-application";

type BeforeInstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const INSTALL_COMMAND_ID = "app:web-install-pwa";
const SHOW_UPDATE_COMMAND_ID = "app:web-show-update";
const APPLY_UPDATE_COMMAND_ID = "app:web-apply-update";
const INSTALL_STATUS_ITEM_ID = "app:web-install-pwa";
const UPDATE_STATUS_ITEM_ID = "app:web-update-available";
const OFFLINE_STATUS_ITEM_ID = "app:web-offline";

const hostState = createPwaHostStateController();
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let applyServiceWorkerUpdate: ((reloadPage?: boolean) => Promise<void>) | null =
  null;
let cleanup: (() => void) | null = null;
function runtimeApp(): RuntimeApp | null {
  const candidate = getPwaRuntimeApplication();
  return candidate?.commands && candidate.statusBar
    ? (candidate as RuntimeApp)
    : null;
}

function syncDocumentAndStatus(): void {
  const state = get(hostState);
  document.documentElement.dataset.pwaNetwork = state.offline
    ? "offline"
    : "online";
  if (state.offlineReady) {
    document.documentElement.dataset.pwaOfflineReady = "true";
  }
  const app = runtimeApp();
  if (!app) return;
  for (const id of [
    INSTALL_STATUS_ITEM_ID,
    UPDATE_STATUS_ITEM_ID,
    OFFLINE_STATUS_ITEM_ID,
  ]) {
    app.statusBar.unregisterItem(id);
  }
  if (state.offline) {
    app.statusBar.upsertItem({
      id: OFFLINE_STATUS_ITEM_ID,
      icon: "wifi-off",
      tooltip: "Offline. Local browser vault data remains available.",
      priority: 880,
    });
  }
  if (state.updateAvailable && applyServiceWorkerUpdate) {
    app.statusBar.upsertItem({
      id: UPDATE_STATUS_ITEM_ID,
      icon: "refresh-cw",
      text: "Update",
      tooltip: "A new version is ready.",
      command: SHOW_UPDATE_COMMAND_ID,
      priority: 890,
    });
  }
  if (deferredPrompt) {
    app.statusBar.upsertItem({
      id: INSTALL_STATUS_ITEM_ID,
      icon: "download",
      text: "Install",
      tooltip: "Install Lapis Notes",
      command: INSTALL_COMMAND_ID,
      priority: 900,
    });
  }
}

function registerCommands(app: RuntimeApp): void {
  if (!app.commands.getCommand(INSTALL_COMMAND_ID)) {
    app.commands.registerCommand({
      id: INSTALL_COMMAND_ID,
      name: "Install Lapis Notes",
      icon: "download",
      checkCallback(checking) {
        if (!deferredPrompt) return false;
        if (!checking) {
          const prompt = deferredPrompt;
          deferredPrompt = null;
          void prompt.prompt().then(() => prompt.userChoice);
          syncDocumentAndStatus();
        }
        return true;
      },
    });
  }
  if (!app.commands.getCommand(SHOW_UPDATE_COMMAND_ID)) {
    app.commands.registerCommand({
      id: SHOW_UPDATE_COMMAND_ID,
      name: "Show available Lapis Notes update",
      icon: "refresh-cw",
      checkCallback(checking) {
        if (!get(hostState).updateAvailable) return false;
        if (!checking) hostState.reopenUpdatePrompt();
        return true;
      },
    });
  }
  if (!app.commands.getCommand(APPLY_UPDATE_COMMAND_ID)) {
    app.commands.registerCommand({
      id: APPLY_UPDATE_COMMAND_ID,
      name: "Install available Lapis Notes update",
      icon: "refresh-cw",
      checkCallback(checking) {
        if (!applyServiceWorkerUpdate) return false;
        if (!checking) {
          void applyAvailableUpdate();
        }
        return true;
      },
    });
  }
}

let applying: Promise<void> | null = null;
async function applyAvailableUpdate(): Promise<void> {
  if (!applyServiceWorkerUpdate || applying) return;
  const update = applyServiceWorkerUpdate;
  hostState.startApplyingUpdate();
  applying = preparePwaUpdate().then(() => update(true));
  try {
    await applying;
  } catch {
    hostState.announceUpdateAvailable();
  } finally {
    applying = null;
  }
}

async function requestUpdateCheck(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    await (await navigator.serviceWorker.getRegistration())?.update();
  } catch {
    /* Network failure leaves the installed app and pending update intact. */
  }
}

function integrateWhenReady(): void {
  const app = runtimeApp();
  if (app) registerCommands(app);
  syncDocumentAndStatus();
}

export function registerWebPwa(): () => void {
  if (import.meta.env.DEV) return () => {};
  if (cleanup) return cleanup;
  const prompt = mount(PwaUpdatePrompt, {
    target: document.body,
    props: {
      stateStore: hostState,
      onLater: () => hostState.dismissUpdatePrompt(),
      onInstallNow: () => void applyAvailableUpdate(),
    },
  });
  const unsubscribe = hostState.subscribe(syncDocumentAndStatus);
  const unsubscribeRuntime = onPwaRuntimeApplicationChanged(integrateWhenReady);
  hostState.setOnline(navigator.onLine !== false);
  const updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      applyServiceWorkerUpdate = updateServiceWorker;
      hostState.announceUpdateAvailable();
    },
    onOfflineReady() {
      hostState.markOfflineReady();
    },
  });
  const onInstall = (event: Event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    hostState.setInstallPromptVisible(true);
  };
  const onInstalled = () => {
    deferredPrompt = null;
    hostState.setInstallPromptVisible(false);
  };
  const onOnline = () => {
    hostState.setOnline(true);
    void requestUpdateCheck();
  };
  const onVisible = () => {
    if (document.visibilityState === "visible") void requestUpdateCheck();
  };
  const onOffline = () => hostState.setOnline(false);
  window.addEventListener("beforeinstallprompt", onInstall);
  window.addEventListener("appinstalled", onInstalled);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  document.addEventListener("visibilitychange", onVisible);
  integrateWhenReady();
  cleanup = () => {
    void unmount(prompt);
    document.removeEventListener("visibilitychange", onVisible);
    unsubscribe();
    unsubscribeRuntime();
    window.removeEventListener("beforeinstallprompt", onInstall);
    window.removeEventListener("appinstalled", onInstalled);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    cleanup = null;
  };
  return cleanup;
}
