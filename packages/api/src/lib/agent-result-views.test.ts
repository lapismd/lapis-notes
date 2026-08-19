import { describe, expect, it } from "vitest";
import { AppResultViewRegistry } from "./agent-result-views";

const component = (() => null) as never;

describe("AppResultViewRegistry", () => {
  it("registers tool and command views and disposes them", () => {
    const registry = new AppResultViewRegistry();
    const tool = registry.register("search", {
      tool: "notes_search",
      component,
    });
    const command = registry.register("ai", {
      command: "skills",
      component,
    });
    expect(registry.getByTool("notes_search")?.ownerPluginId).toBe("search");
    expect(registry.getByCommand("skills")?.ownerPluginId).toBe("ai");
    tool.dispose();
    expect(registry.getByTool("notes_search")).toBeUndefined();
    expect(registry.getByCommand("skills")).toBeDefined();
    command.dispose();
    expect(registry.getByCommand("skills")).toBeUndefined();
  });

  it("rejects missing, duplicate, and invalid keys", () => {
    const registry = new AppResultViewRegistry();
    expect(() => registry.register("search", { component })).toThrow(
      /exactly one/i,
    );
    expect(() =>
      registry.register("search", {
        tool: "notes_search",
        command: "search",
        component,
      }),
    ).toThrow(/exactly one/i);
    registry.register("search", { tool: "notes_search", component });
    expect(() =>
      registry.register("other", { tool: "notes_search", component }),
    ).toThrow(/already registered/i);
  });
});
