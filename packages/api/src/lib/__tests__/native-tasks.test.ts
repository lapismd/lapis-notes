import { mount, unmount, flushSync } from "svelte";
import NativeTaskApp from "./NativeTaskApp.test.fixture.svelte";
import { describe, expect, it, vi } from "vitest";
import { App } from "../context.svelte";
import { MemoryAppDatabase } from "../storage/app-database";
import { MemoryVaultAdapter } from "../storage/memory-vault-adapter";
import type { VaultSession } from "../storage/vault-session";
import {
  NativeTaskError,
  NativeTasksSession,
  type NativeTasks,
  type NativeTaskValue,
} from "../native-tasks";

const status: NativeTaskValue = {
  kind: "status",
  status: { enabled: false, configuration: null, tracked: null },
};

describe("admitted native Tasks observation", () => {
  it("drains accepted calls after detach without disabling or replaying them", async () => {
    let release!: (value: NativeTaskValue) => void;
    const call = vi.fn(
      () =>
        new Promise<NativeTaskValue>((resolve) => {
          release = resolve;
        }),
    );
    const session = new NativeTasksSession({ call });
    const pending = session.call({ kind: "status" });
    await Promise.resolve();
    const detached = session.detach();
    expect(session.detached).toBe(true);
    await expect(session.call({ kind: "status" })).rejects.toThrow(/detached/);
    release(status);
    await pending;
    await detached;
    expect(call).toHaveBeenCalledTimes(1);
    expect(call).toHaveBeenCalledWith({ kind: "status" });
  });

  it.each(["absent", "disabled", "failed"])(
    "reconciles a %s declaration through explicit disable",
    async () => {
      const call = vi.fn<NativeTasks["call"]>().mockResolvedValue(status);
      const session = new NativeTasksSession({ call }, () => false);
      await session.load();
      expect(call).toHaveBeenCalledExactlyOnceWith({ kind: "disable" });
    },
  );

  it("awaits configuration and retains typed partial failures without fallback", async () => {
    const failure = {
      name: "TaskMutationError",
      code: "stale-task",
      message: "Changed",
      parts: ["task"],
      request_id: "request",
      uncertain: false,
      operation: null,
    };
    const call = vi
      .fn<NativeTasks["call"]>()
      .mockResolvedValue({ kind: "failure", failure });
    const session = new NativeTasksSession({ call });
    const result = session.call({ kind: "retry", request_id: "request" });
    await expect(result).rejects.toMatchObject({
      name: failure.name,
      code: failure.code,
      parts: failure.parts,
      requestId: "request",
      uncertain: false,
    });
    await expect(result).rejects.toBeInstanceOf(NativeTaskError);
    expect(call).toHaveBeenCalledTimes(1);
    await session.detach();
  });

  it("propagates transport loss without replay", async () => {
    const lost = new Error("Connection lost");
    const call = vi.fn<NativeTasks["call"]>().mockRejectedValue(lost);
    const session = new NativeTasksSession({ call });
    await expect(session.load()).rejects.toBe(lost);
    expect(call).toHaveBeenCalledTimes(1);
    await session.detach();
  });
});

describe("App-owned native Tasks", () => {
  it("defers Task startup reconciliation until plugin loading has settled", async () => {
    vi.stubGlobal("matchMedia", (media: string) => ({
      media,
      matches: false,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    const order: string[] = [];
    const call = vi
      .fn<NativeTasks["call"]>()
      .mockImplementation(async (command) => {
        order.push(command.kind);
        return status;
      });
    const database = new MemoryAppDatabase("task-startup");
    await database.open();
    let app!: App;
    const target = document.createElement("div");
    document.body.append(target);
    const component = mount(NativeTaskApp, {
      target,
      props: {
        properties: {
          version: "test",
          adapter: new MemoryVaultAdapter(),
          appDatabase: database,
          nativeTasks: { call },
          markdownRenderer: async () => {},
        },
        onApp: (value) => {
          app = value;
        },
      },
    });
    flushSync();
    await app.metadataCache.load();
    expect(call).not.toHaveBeenCalled();
    app.plugins.on("plugins-loaded", () => {
      order.push("plugins-loaded");
    });
    await app.plugins.loadPlugins({
      communityPlugins: "disabled",
      optionalCorePlugins: "disabled",
    });
    expect(order).toEqual(["disable", "plugins-loaded"]);
    await app.metadataCache.dispose({ persist: false });
    await unmount(component);
    target.remove();
    await database.close();
  });

  it.each(["disabled", "failed", "enabled"])(
    "uses the session port and reconciles the actual %s plugin declaration",
    async (state) => {
      vi.stubGlobal("matchMedia", (media: string) => ({
        media,
        matches: false,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      const preferred = vi.fn<NativeTasks["call"]>().mockResolvedValue(status);
      const ignored = vi.fn<NativeTasks["call"]>().mockResolvedValue(status);
      const database = new MemoryAppDatabase("native-task-app");
      await database.open();
      const session = {
        runtime: "test",
        vaultAdapter: new MemoryVaultAdapter(),
        appDatabase: database,
        nativeTasks: { call: preferred },
        close: async () => {},
      } as VaultSession;
      let app!: App;
      const target = document.createElement("div");
      document.body.append(target);
      const component = mount(NativeTaskApp, {
        target,
        props: {
          properties: {
            version: "test",
            session,
            nativeTasks: { call: ignored },
            markdownRenderer: async () => {},
          },
          onApp: (value) => {
            app = value;
          },
        },
      });
      flushSync();
      app.plugins.plugins.set("tasks", { state } as never);
      await app.nativeTasks!.load();
      expect(preferred).toHaveBeenCalledExactlyOnceWith({
        kind: state === "enabled" ? "status" : "disable",
      });
      expect(ignored).not.toHaveBeenCalled();
      const disposing = app.metadataCache.dispose({ persist: false });
      // The owning metadata lifetime detaches synchronously before plugin unload.
      expect(app.nativeTasks!.detached).toBe(true);
      await disposing;
      expect(preferred).toHaveBeenCalledTimes(1);
      await unmount(component);
      target.remove();
      await database.close();
    },
  );
});
