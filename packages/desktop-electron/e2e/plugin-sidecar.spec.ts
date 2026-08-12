import { expect, test } from "@playwright/test";
import {
  createDesktopTestState,
  launchDesktopApp,
  waitForDesktopWorkspace,
} from "./helpers";

test("plugin sidecar evaluates, activates, deactivates, and restarts", async () => {
  const state = await createDesktopTestState();
  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
  });
  try {
    await waitForDesktopWorkspace(app.page);
    const result = await app.page.evaluate(async () => {
      const bridge = (
        globalThis as typeof globalThis & {
          __LAPIS_NATIVE_DESKTOP__: {
            invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
          };
        }
      ).__LAPIS_NATIVE_DESKTOP__;
      const contextId = "plugin-test-vault";
      const prepared = await bridge.invoke<{ status: string }>(
        "desktop_plugin_host_prepare",
        { contextId },
      );
      const evaluated = await bridge.invoke<{ status: string }>(
        "desktop_plugin_host_evaluate",
        {
          contextId,
          pluginId: "test-plugin",
          manifest: { id: "test-plugin" },
          selectedRuntime: { format: "commonjs" },
          code: 'module.exports = require("lapis").Plugin;',
        },
      );
      const activated = await bridge.invoke<{ status: string }>(
        "desktop_plugin_host_activate",
        { contextId, pluginId: "test-plugin" },
      );
      const deactivated = await bridge.invoke<{ status: string }>(
        "desktop_plugin_host_deactivate",
        { contextId, pluginId: "test-plugin" },
      );
      await bridge.invoke("desktop_plugin_host_shutdown", { contextId });
      const restarted = await bridge.invoke<{ status: string }>(
        "desktop_plugin_host_prepare",
        { contextId },
      );
      return { prepared, evaluated, activated, deactivated, restarted };
    });
    expect(result.prepared.status).toBe("ready");
    expect(result.evaluated.status).toBe("evaluated");
    expect(result.activated.status).toBe("activated");
    expect(result.deactivated.status).toBe("deactivated");
    expect(result.restarted.status).toBe("ready");
  } finally {
    await app.close();
    await state.cleanup();
  }
});

test("plugin sidecar rejects imports outside the fixed host allowlist", async () => {
  const state = await createDesktopTestState();
  const app = await launchDesktopApp({
    userDataDir: state.userDataDir,
    vaultPath: state.vaultA,
  });
  try {
    await waitForDesktopWorkspace(app.page);
    const error = await app.page.evaluate(async () => {
      const bridge = (
        globalThis as typeof globalThis & {
          __LAPIS_NATIVE_DESKTOP__: {
            invoke<T>(command: string, payload?: Record<string, unknown>): Promise<T>;
          };
        }
      ).__LAPIS_NATIVE_DESKTOP__;
      try {
        await bridge.invoke("desktop_plugin_host_evaluate", {
          contextId: "plugin-test-vault",
          pluginId: "bad-plugin",
          manifest: { id: "bad-plugin" },
          selectedRuntime: { format: "commonjs" },
          code: 'module.exports = require("node:fs");',
        });
        return null;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    });
    expect(error).toContain("Unsupported sidecar dependency node:fs");
    expect(error).toContain("@lapis-notes/api, lapis");
  } finally {
    await app.close();
    await state.cleanup();
  }
});
