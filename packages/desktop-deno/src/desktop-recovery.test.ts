import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  clearDesktopSafeModeState,
  createDesktopStartupFailure,
  DESKTOP_SAFE_MODE_STORAGE_KEY,
  describeDesktopSafeMode,
  formatDesktopStartupDiagnostic,
  readDesktopSafeModeState,
  updateDesktopSafeModeState,
  type DesktopRecoveryStorage,
} from "./desktop-recovery";

function memoryStorage(): DesktopRecoveryStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe("Deno desktop startup recovery", () => {
  it("persists only supported session-scoped recovery flags", () => {
    const storage = memoryStorage();
    const failure = createDesktopStartupFailure(
      "plugins",
      new Error("Roles failed"),
    );
    const state = updateDesktopSafeModeState(
      {
        disableCommunityPlugins: true,
        disableOptionalCorePlugins: true,
        disableNotebookExecution: true,
        lastStartupFailure: failure,
      },
      storage,
    );

    expect(state).toMatchObject({
      active: true,
      disableCommunityPlugins: false,
      disableOptionalCorePlugins: true,
      disableNotebookExecution: false,
      lastStartupFailure: { task: "plugins", message: "Roles failed" },
    });
    expect(readDesktopSafeModeState(storage)).toEqual(state);
    expect(describeDesktopSafeMode(state)).toEqual([
      "non-required core plugins disabled",
    ]);

    clearDesktopSafeModeState(storage);
    expect(storage.getItem(DESKTOP_SAFE_MODE_STORAGE_KEY)).toBeNull();
    expect(readDesktopSafeModeState(storage).active).toBe(false);
  });

  it("normalizes corrupt persisted values to normal startup", () => {
    const storage = memoryStorage();
    storage.setItem(DESKTOP_SAFE_MODE_STORAGE_KEY, "not-json");
    expect(readDesktopSafeModeState(storage)).toMatchObject({
      active: false,
      disableOptionalCorePlugins: false,
      skipLayoutRestore: false,
      lastStartupFailure: null,
    });
  });

  it("copies a complete stack and absolute vault location", () => {
    const error = new Error("EACCES: /Users/example/Desktop/notes");
    const failure = createDesktopStartupFailure("vault", error);
    const diagnostic = JSON.parse(
      formatDesktopStartupDiagnostic({
        appVersion: "2026.31.5",
        vaultName: "notes",
        vaultLocation: "/Users/example/Desktop/notes",
        failure,
      }),
    );

    expect(failure.detail).toContain("Error: EACCES");
    expect(diagnostic.vaultLocation).toBe("/Users/example/Desktop/notes");
    expect(diagnostic.detail).toContain("/Users/example/Desktop/notes");
  });

  it("describes layout-only recovery without unavailable policies", () => {
    const storage = memoryStorage();
    const state = updateDesktopSafeModeState(
      { skipLayoutRestore: true },
      storage,
    );
    expect(describeDesktopSafeMode(state)).toEqual([
      "saved layout restore skipped",
    ]);
  });

  it("keeps saved profiles after restore failures and exposes recovery actions", () => {
    const hostSource = readFileSync(
      path.resolve(process.cwd(), "src/DesktopVaultHost.svelte"),
      "utf8",
    );
    const restoreSource = hostSource.slice(
      hostSource.indexOf("async function restoreVault"),
      hostSource.indexOf("function showLauncher"),
    );
    const desktopProfileFailure = restoreSource.slice(
      restoreSource.indexOf('profile?.kind === "desktop-folder"'),
      restoreSource.indexOf("} else if (profile)"),
    );
    expect(desktopProfileFailure).toContain('status = "error"');
    expect(desktopProfileFailure).toContain("errorMessage =");
    expect(desktopProfileFailure).not.toContain("clearCurrentVaultProfile");

    const sessionSource = readFileSync(
      path.resolve(process.cwd(), "src/DesktopWorkspaceSession.svelte"),
      "utf8",
    );
    for (const action of [
      "Copy error details",
      "Manage Vaults",
      "Start with optional plugins disabled",
      "Start without restoring layout",
      "Reset saved layout",
      "Rebuild metadata",
      "Rebuild Search",
      "Restart normally",
    ]) {
      expect(sessionSource).toContain(action);
    }
    expect(sessionSource).toContain("safeMode,");
    expect(sessionSource).toContain("app.safeMode.disableOptionalCorePlugins");
    expect(sessionSource).toContain("app.safeMode.skipLayoutRestore");
    expect(sessionSource).not.toContain(
      "Start with community plugins disabled",
    );
    expect(sessionSource).not.toContain("Disable notebook execution");
  });
});
