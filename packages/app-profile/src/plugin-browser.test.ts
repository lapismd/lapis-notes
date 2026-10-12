import { describe, expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
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
  const app = {
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
  return {
    app,
    leaf,
    removeRibbon,
    ribbon: () => ribbon,
    command: () => command,
  };
}
describe("default Plugins registration", () => {
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
