/// <reference types="vite-plugin-pwa/client" />

import { mount } from "svelte";
import { get } from "svelte/store";
import { registerSW } from "virtual:pwa-register";
import PwaUpdatePrompt from "./PwaUpdatePrompt.svelte";
import { createPwaHostStateController } from "./pwa-host-state";
import { getApplicationCompatibility } from "@lapis-notes/api";

type RuntimeApp = {
  commands: {
    executeCommand(id: string): Promise<unknown>;
    getCommand(id: string): unknown;
    registerCommand(command: {
      id: string;
      name: string;
      icon?: string;
      checkCallback(checking: boolean): boolean;
    }): void;
  };
  statusBar: {
    unregisterItem(id: string): void;
    upsertItem(item: {
      id: string;
      icon?: string;
      text?: string;
      tooltip?: string;
      command?: string;
      alignment?: "left" | "right";
      priority?: number;
    }): void;
  };
};

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
let providedRuntimeApp: RuntimeApp | null = null;

export function setPwaRuntimeApplication(app: RuntimeApp): () => void {
  providedRuntimeApp = app;
  syncDocumentAndStatus();
  return () => {
    if (providedRuntimeApp === app) providedRuntimeApp = null;
  };
}

function runtimeApp(): RuntimeApp | null {
  const candidate =
    providedRuntimeApp ??
    (getApplicationCompatibility() as Partial<RuntimeApp> | undefined);
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
          hostState.startApplyingUpdate();
          void applyServiceWorkerUpdate(true).catch(() =>
            hostState.announceUpdateAvailable(),
          );
        }
        return true;
      },
    });
  }
}

function integrateWhenReady(): void {
  const deadline = Date.now() + 120_000;
  const poll = () => {
    const app = runtimeApp();
    if (app) {
      registerCommands(app);
      syncDocumentAndStatus();
    } else if (Date.now() < deadline) {
      setTimeout(poll, 50);
    }
  };
  poll();
}

export function registerWebPwa(): () => void {
  if (import.meta.env.DEV) return () => {};
  if (cleanup) return cleanup;
  mount(PwaUpdatePrompt, {
    target: document.body,
    props: {
      stateStore: hostState,
      onLater: () => hostState.dismissUpdatePrompt(),
      onInstallNow: () =>
        void runtimeApp()?.commands.executeCommand(APPLY_UPDATE_COMMAND_ID),
    },
  });
  const unsubscribe = hostState.subscribe(syncDocumentAndStatus);
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
  const onOnline = () => hostState.setOnline(true);
  const onOffline = () => hostState.setOnline(false);
  window.addEventListener("beforeinstallprompt", onInstall);
  window.addEventListener("appinstalled", onInstalled);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  integrateWhenReady();
  cleanup = () => {
    unsubscribe();
    window.removeEventListener("beforeinstallprompt", onInstall);
    window.removeEventListener("appinstalled", onInstalled);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    cleanup = null;
  };
  return cleanup;
}
