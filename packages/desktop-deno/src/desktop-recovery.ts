import type { AppSafeModeFailure, AppSafeModeState } from "@lapis-notes/api";

export const DESKTOP_SAFE_MODE_STORAGE_KEY = "lapis.safeMode.session";

export interface DesktopRecoveryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function createDesktopDefaultSafeModeState(): AppSafeModeState {
  return {
    active: false,
    disableCommunityPlugins: false,
    disableOptionalCorePlugins: false,
    skipLayoutRestore: false,
    disableNotebookExecution: false,
    lastStartupFailure: null,
  };
}

function normalizeFailure(value: unknown): AppSafeModeFailure | null {
  if (!value || typeof value !== "object") return null;
  const failure = value as Partial<AppSafeModeFailure>;
  if (
    typeof failure.message !== "string" ||
    typeof failure.detail !== "string"
  ) {
    return null;
  }
  return {
    task: typeof failure.task === "string" ? failure.task : null,
    message: failure.message,
    detail: failure.detail,
    pluginId: typeof failure.pluginId === "string" ? failure.pluginId : null,
  };
}

export function normalizeDesktopSafeModeState(
  value: unknown,
): AppSafeModeState {
  if (!value || typeof value !== "object") {
    return createDesktopDefaultSafeModeState();
  }
  const state = value as Partial<AppSafeModeState>;
  return {
    active: Boolean(state.active),
    disableCommunityPlugins: false,
    disableOptionalCorePlugins: Boolean(state.disableOptionalCorePlugins),
    skipLayoutRestore: Boolean(state.skipLayoutRestore),
    disableNotebookExecution: false,
    lastStartupFailure: normalizeFailure(state.lastStartupFailure),
  };
}

export function readDesktopSafeModeState(
  storage: DesktopRecoveryStorage = window.sessionStorage,
): AppSafeModeState {
  try {
    const raw = storage.getItem(DESKTOP_SAFE_MODE_STORAGE_KEY);
    return raw
      ? normalizeDesktopSafeModeState(JSON.parse(raw))
      : createDesktopDefaultSafeModeState();
  } catch {
    return createDesktopDefaultSafeModeState();
  }
}

export function updateDesktopSafeModeState(
  update: Partial<AppSafeModeState>,
  storage: DesktopRecoveryStorage = window.sessionStorage,
): AppSafeModeState {
  const current = readDesktopSafeModeState(storage);
  const next = normalizeDesktopSafeModeState({
    ...current,
    ...update,
    active: true,
    lastStartupFailure:
      update.lastStartupFailure === undefined
        ? current.lastStartupFailure
        : update.lastStartupFailure,
  });
  try {
    storage.setItem(DESKTOP_SAFE_MODE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // The in-memory state still governs the current reload attempt.
  }
  return next;
}

export function clearDesktopSafeModeState(
  storage: DesktopRecoveryStorage = window.sessionStorage,
): void {
  try {
    storage.removeItem(DESKTOP_SAFE_MODE_STORAGE_KEY);
  } catch {
    // Recovery cleanup must not trap the app on storage failures.
  }
}

export function createDesktopStartupFailure(
  task: string,
  error: unknown,
): AppSafeModeFailure {
  const message = error instanceof Error ? error.message : String(error);
  return {
    task,
    message,
    detail: error instanceof Error ? (error.stack ?? error.message) : message,
    pluginId: null,
  };
}

export function describeDesktopSafeMode(state: AppSafeModeState): string[] {
  const reasons: string[] = [];
  if (state.disableOptionalCorePlugins) {
    reasons.push("non-required core plugins disabled");
  }
  if (state.skipLayoutRestore) reasons.push("saved layout restore skipped");
  return reasons;
}

export function formatDesktopStartupDiagnostic(options: {
  appVersion: string;
  vaultName: string;
  vaultLocation: string;
  failure: AppSafeModeFailure;
}): string {
  return JSON.stringify(
    {
      formatVersion: 1,
      application: "Lapis Notes",
      appVersion: options.appVersion,
      vaultName: options.vaultName,
      vaultLocation: options.vaultLocation,
      phase: options.failure.task,
      message: options.failure.message,
      detail: options.failure.detail,
    },
    null,
    2,
  );
}
