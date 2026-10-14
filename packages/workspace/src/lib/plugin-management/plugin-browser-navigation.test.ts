import { describe, expect, it, vi } from "vitest";
import type { App } from "@lapis-notes/api";
vi.mock("./plugins-view.svelte", () => ({
  PluginsView: class {
    getViewType = () => "plugins";
    home = vi.fn();
    showPlugin = vi.fn();
  },
}));
import { PluginsView } from "./plugins-view.svelte";
import { openPluginBrowser } from "./plugin-browser-navigation";
function fixture(existing = false) {
  const leaf = {
    view: existing
      ? new (PluginsView as unknown as { new (): PluginsView })()
      : { getViewType: () => "empty" },
    setViewState: vi.fn(async () => {
      leaf.view = new (PluginsView as unknown as { new (): PluginsView })();
    }),
  };
  let leaves = existing ? [leaf] : [];
  const app = {
    workspace: {
      getLeavesOfType: vi.fn(() => leaves),
      getLeaf: vi.fn(() => leaf),
      revealLeaf: vi.fn(async () => {
        leaves = [leaf];
      }),
      activateLeaf: vi.fn(),
    },
  } as unknown as App;
  return { app, leaf };
}
describe("Plugins browser navigation", () => {
  it("preserves the requested historical version when revealing a moved Plugins leaf", async () => {
    const { app, leaf } = fixture(true);
    await openPluginBrowser(app, "graph", () => true, "0.1.0");
    expect((leaf.view as PluginsView).showPlugin).toHaveBeenCalledWith(
      "graph",
      "0.1.0",
    );
    expect(app.workspace.getLeaf).not.toHaveBeenCalled();
    expect(app.workspace.activateLeaf).toHaveBeenCalledWith(leaf);
  });
  it("creates, selects, reveals and activates details", async () => {
    const { app, leaf } = fixture();
    await openPluginBrowser(app, "graph");
    expect(leaf.setViewState).toHaveBeenCalledOnce();
    expect((leaf.view as PluginsView).showPlugin).toHaveBeenCalledWith("graph");
    expect(app.workspace.activateLeaf).toHaveBeenCalledWith(leaf);
    expect(
      vi.mocked(app.workspace.activateLeaf).mock.invocationCallOrder[0],
    ).toBeGreaterThan(
      vi.mocked(app.workspace.revealLeaf).mock.invocationCallOrder[0],
    );
  });
  it("reuses moved leaves and returns ribbon navigation home", async () => {
    const { app, leaf } = fixture(true);
    await openPluginBrowser(app, "graph");
    await openPluginBrowser(app);
    expect(app.workspace.getLeaf).not.toHaveBeenCalled();
    expect((leaf.view as PluginsView).home).toHaveBeenCalledOnce();
  });
  it("serializes simultaneous requests without duplicate leaves", async () => {
    const { app, leaf } = fixture();
    await Promise.all([
      openPluginBrowser(app, "graph"),
      openPluginBrowser(app, "ai"),
    ]);
    expect(app.workspace.getLeaf).toHaveBeenCalledOnce();
    expect((leaf.view as PluginsView).showPlugin).toHaveBeenLastCalledWith(
      "ai",
    );
  });
  it("ignores navigation after registration disposal", async () => {
    const { app } = fixture();
    await openPluginBrowser(app, "graph", () => false);
    expect(app.workspace.getLeaf).not.toHaveBeenCalled();
    expect(app.workspace.activateLeaf).not.toHaveBeenCalled();
  });
  it("reports missing registration without activating a wrong view and can retry", async () => {
    const { app, leaf } = fixture();
    vi.mocked(leaf.setViewState).mockResolvedValueOnce(undefined);
    await expect(openPluginBrowser(app, "graph")).rejects.toThrow(
      "not registered",
    );
    expect(app.workspace.activateLeaf).not.toHaveBeenCalled();
    await openPluginBrowser(app, "graph");
    expect(app.workspace.activateLeaf).toHaveBeenCalledOnce();
  });
});
