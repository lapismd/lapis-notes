import { describe, expect, it } from "vitest";
import { ContextKeyService } from "../context-keys.svelte";
import { StatusBarManager } from "../status-bar.svelte";

describe("status bar manager", () => {
  it("orders visible items by alignment, priority, and registration order", () => {
    const contextKeys = new ContextKeyService({
      "plugin.enabled.demo": true,
      "editor.active": true,
    });
    const statusBar = new StatusBarManager();

    statusBar.registerItem({
      id: "demo:right-late",
      text: "Late",
      alignment: "right",
      priority: 20,
    });
    statusBar.registerItem({
      id: "demo:left",
      text: "Left",
      alignment: "left",
      priority: 5,
    });
    statusBar.registerItem({
      id: "demo:right-early",
      text: "Early",
      alignment: "right",
      priority: 10,
    });
    statusBar.registerItem({
      id: "demo:conditional",
      text: "Conditional",
      alignment: "right",
      when: "editor.active && plugin.enabled.demo",
      priority: 15,
    });

    expect(
      statusBar.getVisibleItems("left", contextKeys).map((item) => item.id),
    ).toEqual(["demo:left"]);
    expect(
      statusBar.getVisibleItems("right", contextKeys).map((item) => item.id),
    ).toEqual(["demo:right-early", "demo:conditional", "demo:right-late"]);

    contextKeys.set("editor.active", false);

    expect(
      statusBar.getVisibleItems("right", contextKeys).map((item) => item.id),
    ).toEqual(["demo:right-early", "demo:right-late"]);
  });

  it("unregisters disposed items", () => {
    const contextKeys = new ContextKeyService();
    const statusBar = new StatusBarManager();
    const dispose = statusBar.registerItem({ id: "demo:item", text: "Demo" });

    expect(statusBar.getVisibleItems("right", contextKeys)).toHaveLength(1);

    dispose();

    expect(statusBar.getVisibleItems("right", contextKeys)).toHaveLength(0);
  });

  it("updates registered items in place without changing order", () => {
    const contextKeys = new ContextKeyService({
      "plugin.demo.visible": false,
    });
    const statusBar = new StatusBarManager();

    statusBar.registerItem({
      id: "demo:first",
      text: "First",
      priority: 10,
    });
    statusBar.registerItem({
      id: "demo:second",
      text: "Second",
      priority: 20,
    });

    statusBar.upsertItem({
      id: "demo:first",
      text: "Updated",
      spin: true,
      tooltip: "Visible when enabled",
      when: "plugin.demo.visible",
      priority: 30,
    });

    expect(
      statusBar.getVisibleItems("right", contextKeys).map((item) => item.id),
    ).toEqual(["demo:second"]);

    contextKeys.set("plugin.demo.visible", true);

    const visibleItems = statusBar.getVisibleItems("right", contextKeys);
    expect(visibleItems.map((item) => item.id)).toEqual([
      "demo:second",
      "demo:first",
    ]);
    expect(visibleItems[1]).toMatchObject({
      id: "demo:first",
      text: "Updated",
      spin: true,
      tooltip: "Visible when enabled",
      when: "plugin.demo.visible",
      priority: 30,
    });
  });
});
