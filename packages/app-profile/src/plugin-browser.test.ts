import { describe, expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
const workspaceBindings = vi.hoisted(
  () =>
    new WeakMap<object, { controller: { settings: { close: () => void } } }>(),
);
vi.mock("@lapis-notes/api/workspace-host", () => ({
  getWorkspaceHostBinding: vi.fn((workspace) =>
    workspaceBindings.get(workspace),
  ),
}));
vi.mock("@lapis-notes/workspace", () => ({
  openPluginBrowser: vi.fn(async () => {}),
  PluginsView: class {
    home = vi.fn();
    unload = vi.fn();
  },
}));
import { openPluginBrowser, PluginsView } from "@lapis-notes/workspace";
import { registerNotesPluginBrowser } from "./plugin-browser";
function fixture(existing = false) {
  const leaf = {
    view: existing
      ? new (PluginsView as unknown as { new (): PluginsView })()
      : { getViewType: () => "empty" },
    setViewState: vi.fn(async () => {
      leaf.view = new (PluginsView as unknown as { new (): PluginsView })();
    }),
  };
  Object.assign(leaf.view, {
    getViewType: () => (existing ? "plugins" : "empty"),
  });
  let ribbon!: { callback: () => void };
  let command!: { callback: () => void };
  const removeRibbon = vi.fn();
  const closeSettings = vi.fn();
  const handlers = new Map<
    string,
    (params: Record<string, string>) => unknown
  >();
  const removeUrlHandler = vi.fn(() => handlers.delete("plugins"));
  const app = {
    urls: {
      registerProtocolHandler: vi.fn((action, handler) => {
        handlers.set(action, handler);
        return removeUrlHandler;
      }),
    },
    workspace: {
      registerView: vi.fn(),
      unregisterView: vi.fn(),
      getLeavesOfType: vi.fn(() => (existing ? [leaf] : [])),
      getLeaf: vi.fn(() => leaf),
      revealLeaf: vi.fn(async () => {}),
      activateLeaf: vi.fn(),
      setActiveLeaf: vi.fn(),
      leftRibbon: {
        addItem: vi.fn((item) => {
          ribbon = item;
          return removeRibbon;
        }),
      },
    },
    commands: {
      registerCommand: vi.fn((item) => {
        command = item;
      }),
      unregisterCommand: vi.fn(),
    },
  } as unknown as App;
  workspaceBindings.set(app.workspace, {
    controller: { settings: { close: closeSettings } },
  });
  return {
    app,
    leaf,
    removeRibbon,
    handlers,
    removeUrlHandler,
    closeSettings,
    ribbon: () => ribbon,
    command: () => command,
  };
}
describe("default Plugins registration", () => {
  it("keeps Settings open when app-link navigation rejects", async () => {
    vi.mocked(openPluginBrowser).mockRejectedValueOnce(
      new Error("Navigation unavailable"),
    );
    const f = fixture(true);
    registerNotesPluginBrowser(f.app);
    await expect(
      f.handlers.get("plugins")!({ id: "lapis-graph" }),
    ).rejects.toThrow("Navigation unavailable");
    expect(f.closeSettings).not.toHaveBeenCalled();
  });
  it("does not close Settings after a queued app link is disposed", async () => {
    let finishNavigation!: () => void;
    vi.mocked(openPluginBrowser).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishNavigation = resolve;
        }),
    );
    const f = fixture(true);
    const dispose = registerNotesPluginBrowser(f.app);
    const navigation = f.handlers.get("plugins")!({
      id: "lapis-graph",
      version: "0.1.0",
    });
    dispose();
    finishNavigation();
    await navigation;
    expect(f.closeSettings).not.toHaveBeenCalled();
  });
  it("routes app links to the selected plugin release without starting installation", async () => {
    vi.mocked(openPluginBrowser).mockClear();
    const f = fixture(true);
    registerNotesPluginBrowser(f.app);
    const handler = f.handlers.get("plugins");
    expect(handler).toBeTypeOf("function");
    await handler!({
      id: "lapis-graph",
      version: "2026.6.6",
      action: "plugins",
    });
    expect(openPluginBrowser).toHaveBeenCalledWith(
      f.app,
      "lapis-graph",
      expect.any(Function),
      "2026.6.6",
    );
    expect(f.closeSettings).toHaveBeenCalledOnce();
    await handler!({ id: "spellcheck", action: "plugins" });
    expect(openPluginBrowser).toHaveBeenLastCalledWith(
      f.app,
      "spellcheck",
      expect.any(Function),
      undefined,
    );
  });
  it("rejects malformed app-link coordinates and unregisters its handler on teardown", async () => {
    vi.mocked(openPluginBrowser).mockClear();
    const f = fixture();
    const dispose = registerNotesPluginBrowser(f.app);
    const handler = f.handlers.get("plugins");
    expect(handler).toBeTypeOf("function");
    for (const params of [
      {},
      { id: "../spellcheck" },
      { id: "spellcheck", version: "../../latest" },
      { id: "spellcheck", version: "" },
    ]) {
      await handler!(params);
    }
    expect(openPluginBrowser).not.toHaveBeenCalled();
    dispose();
    expect(f.removeUrlHandler).toHaveBeenCalledOnce();
    expect(f.handlers.size).toBe(0);
    await handler!({ id: "spellcheck", version: "0.1.1" });
    expect(openPluginBrowser).not.toHaveBeenCalled();
  });
  it("registers before restore and disposes every app-owned contribution", () => {
    const f = fixture();
    const dispose = registerNotesPluginBrowser(f.app);
    expect(f.app.workspace.registerView).toHaveBeenCalledWith(
      "plugins",
      expect.any(Function),
    );
    expect(f.app.commands.registerCommand).toHaveBeenCalledWith(
      expect.objectContaining({ id: "app:open-plugins", name: "Open Plugins" }),
    );
    dispose();
    expect(f.removeRibbon).toHaveBeenCalledOnce();
    expect(f.app.workspace.unregisterView).toHaveBeenCalledWith("plugins");
    expect(f.app.commands.unregisterCommand).toHaveBeenCalledWith(
      "app:open-plugins",
    );
  });
  it("unloads every owned Plugins view before unregistering and only once", () => {
    const f = fixture(true);
    const dispose = registerNotesPluginBrowser(f.app);
    dispose();
    dispose();
    expect((f.leaf.view as PluginsView).unload).toHaveBeenCalledOnce();
    expect(f.app.workspace.unregisterView).toHaveBeenCalledOnce();
    expect(
      vi.mocked((f.leaf.view as PluginsView).unload).mock
        .invocationCallOrder[0],
    ).toBeLessThan(
      vi.mocked(f.app.workspace.unregisterView).mock.invocationCallOrder[0],
    );
  });
  it("opens the homepage through the shared navigator", async () => {
    const f = fixture(true);
    registerNotesPluginBrowser(f.app);
    f.ribbon().callback();
    await vi.waitFor(() =>
      expect(openPluginBrowser).toHaveBeenCalledWith(
        f.app,
        undefined,
        expect.any(Function),
      ),
    );
  });
  it("deduplicates simultaneous ribbon and command activations and cancels after disposal", async () => {
    vi.mocked(openPluginBrowser).mockClear();
    const f = fixture();
    const dispose = registerNotesPluginBrowser(f.app);
    f.ribbon().callback();
    f.command().callback();
    expect(openPluginBrowser).toHaveBeenCalledOnce();
    const isActive = vi.mocked(openPluginBrowser).mock.calls[0][2]!;
    expect(isActive()).toBe(true);
    dispose();
    expect(isActive()).toBe(false);
  });
});
