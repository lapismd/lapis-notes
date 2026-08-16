import { describe, expect, it, vi } from "vitest";
import { AppToolRegistry, type AppTool } from "./agent-tools";

const owner = {
  pluginId: "fixture",
  source: "community" as const,
  provenance: "community" as const,
};

function tool(name: string): AppTool {
  return {
    name,
    description: `Execute ${name}`,
    inputSchema: { type: "object", properties: {} },
    effect: "read",
    execute: vi.fn(async () => ({
      content: [{ type: "text" as const, text: name }],
    })),
  };
}

describe("AppToolRegistry", () => {
  it("registers deterministically with owner and exact registration identity", () => {
    const registry = new AppToolRegistry();
    const second = registry.register(owner, tool("notes_read"));
    registry.register(owner, tool("notes_list"));

    expect(registry.list().map((entry) => entry.tool.name)).toEqual([
      "notes_list",
      "notes_read",
    ]);
    expect(registry.get("notes_read")?.owner).toEqual(owner);
    expect(registry.resolve("notes_read", second.id)?.registrationId).toBe(
      second.id,
    );
    expect(registry.resolve("notes_read", "stale")).toBeUndefined();
  });

  it("rejects invalid names, duplicate names, and non-object inputs", () => {
    const registry = new AppToolRegistry();
    expect(() => registry.register(owner, tool("Notes Read"))).toThrow(
      /Invalid app tool name/u,
    );
    registry.register(owner, tool("notes_read"));
    expect(() => registry.register(owner, tool("notes_read"))).toThrow(
      /already registered/u,
    );
    expect(() =>
      registry.register(owner, {
        ...tool("bad_schema"),
        inputSchema: { type: "string" },
      }),
    ).toThrow(/type object/u);
  });

  it("disposes idempotently and never resolves stale identity", () => {
    const registry = new AppToolRegistry();
    const changes: string[] = [];
    registry.on("changed", (change) => changes.push(change.reason));

    const first = registry.register(owner, tool("notes_read"));
    first.dispose();
    first.dispose();
    const second = registry.register(owner, tool("notes_read"));

    expect(registry.resolve("notes_read", first.id)).toBeUndefined();
    expect(registry.resolve("notes_read", second.id)).toBeDefined();
    expect(changes).toEqual(["registered", "unregistered", "registered"]);
  });
});
