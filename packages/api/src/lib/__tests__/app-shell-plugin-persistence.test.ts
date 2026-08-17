import { describe, expect, it } from "vitest";
import {
  APP_SHELL_PLUGINS_PATH,
  createAppShellPluginPersistence,
} from "../app-shell-plugin-persistence";

describe("app-shell plugin persistence", () => {
  it("returns null when the vault file is missing", async () => {
    const files = new Map<string, string>();
    const persistence = createAppShellPluginPersistence({
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
    });

    expect(await persistence.load()).toBeNull();
  });

  it("round-trips enablement and keeps F-Mode off by default", async () => {
    const files = new Map<string, string>();
    const persistence = createAppShellPluginPersistence({
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
    });

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
