import { describe, expect, it } from "vitest";
import {
  APP_SHELL_PLUGINS_PATH,
  createAppShellPluginPersistence,
  type AppShellPluginPersistenceVault,
} from "../app-shell-plugin-persistence";

function createFileVault(files: Map<string, string>): AppShellPluginPersistenceVault {
  return {
    mkpath: async () => undefined,
    adapter: {
      exists: async (path) => files.has(path),
      read: async (path) => {
        const value = files.get(path);
        if (value === undefined) throw new Error("missing");
        return value;
      },
      write: async (path, data) => {
        files.set(path, data);
      },
    },
  };
}

describe("app-shell plugin persistence", () => {
  it("returns null when the vault file is missing", async () => {
    const persistence = createAppShellPluginPersistence(
      createFileVault(new Map()),
    );

    expect(await persistence.load()).toBeNull();
  });

  it("returns null when the vault is missing at load time", async () => {
    const persistence = createAppShellPluginPersistence(() => undefined);

    expect(await persistence.load()).toBeNull();
  });

  it("resolves a vault assigned after persistence is created", async () => {
    const files = new Map<string, string>();
    let vault: AppShellPluginPersistenceVault | undefined;
    const persistence = createAppShellPluginPersistence(() => vault);

    expect(await persistence.load()).toBeNull();

    vault = createFileVault(files);
    await persistence.save({
      notifications: true,
      fmode: false,
    });

    expect(await persistence.load()).toEqual({
      notifications: true,
      fmode: false,
    });
  });

  it("round-trips enablement and keeps F-Mode off by default", async () => {
    const files = new Map<string, string>();
    const persistence = createAppShellPluginPersistence(createFileVault(files));

    await persistence.save({
      notifications: true,
      fmode: true,
      problems: true,
    });
    expect(files.get(APP_SHELL_PLUGINS_PATH)).toContain('"fmode": true');
    expect(await persistence.load()).toEqual({
      notifications: true,
      fmode: true,
      problems: true,
    });
  });
});
