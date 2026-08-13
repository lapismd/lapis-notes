import { writable, type Readable } from "svelte/store";

export interface PwaHostState {
  installPromptVisible: boolean;
  updateAvailable: boolean;
  updatePromptVisible: boolean;
  updateApplying: boolean;
  offline: boolean;
  offlineReady: boolean;
}

export interface PwaHostStateController extends Readable<PwaHostState> {
  setInstallPromptVisible(visible: boolean): void;
  markOfflineReady(): void;
  setOnline(online: boolean): void;
  announceUpdateAvailable(): void;
  dismissUpdatePrompt(): void;
  reopenUpdatePrompt(): void;
  startApplyingUpdate(): void;
  clearUpdate(): void;
}

const INITIAL_STATE: PwaHostState = {
  installPromptVisible: false,
  updateAvailable: false,
  updatePromptVisible: false,
  updateApplying: false,
  offline: false,
  offlineReady: false,
};

export function createPwaHostStateController(): PwaHostStateController {
  const store = writable<PwaHostState>(INITIAL_STATE);
  return {
    subscribe: store.subscribe,
    setInstallPromptVisible: (visible) =>
      store.update((state) => ({ ...state, installPromptVisible: visible })),
    markOfflineReady: () =>
      store.update((state) => ({ ...state, offlineReady: true })),
    setOnline: (online) =>
      store.update((state) => ({ ...state, offline: !online })),
    announceUpdateAvailable: () =>
      store.update((state) => ({
        ...state,
        updateAvailable: true,
        updateApplying: false,
        updatePromptVisible: true,
      })),
    dismissUpdatePrompt: () =>
      store.update((state) => ({ ...state, updatePromptVisible: false })),
    reopenUpdatePrompt: () =>
      store.update((state) =>
        state.updateAvailable
          ? { ...state, updatePromptVisible: true }
          : state,
      ),
    startApplyingUpdate: () =>
      store.update((state) => ({
        ...state,
        updateApplying: true,
        updatePromptVisible: false,
      })),
    clearUpdate: () =>
      store.update((state) => ({
        ...state,
        updateAvailable: false,
        updateApplying: false,
        updatePromptVisible: false,
      })),
  };
}
