import { describe, expect, it, vi } from "vitest";
import type { App } from "../context.svelte";
import {
  ConfigurationOptionSourceRegistry,
  normalizeConfigurationOptions,
  validateOptionSourceId,
} from "../configuration-option-source-registry";

function createAppStub(): App {
  return {} as App;
}

describe("ConfigurationOptionSourceRegistry", () => {
  it("validates option source ids", () => {
    expect(() => validateOptionSourceId("")).toThrow(
      "Configuration option source id must not be empty.",
    );
    expect(() => validateOptionSourceId("bad id")).toThrow(
      "Invalid configuration option source id",
    );
    expect(() => validateOptionSourceId("workspace.editorViews")).not.toThrow();
    expect(() => validateOptionSourceId("markdown-lint:ruleIds")).not.toThrow();
  });

  it("normalizes configuration options", () => {
    expect(
      normalizeConfigurationOptions(
        [
          { value: "a", label: "A" },
          { value: "b" },
          { value: "  " },
          { value: "a", label: "Duplicate" },
        ],
        "test.values",
      ),
    ).toEqual([
      { value: "a", label: "A", source: "test.values" },
      { value: "b", label: "b", source: "test.values" },
    ]);
  });

  it("registers, resolves, and unregisters configuration option sources", async () => {
    const registry = new ConfigurationOptionSourceRegistry();
    const app = createAppStub();
    const events: string[] = [];
    registry.on("changed", (change) =>
      events.push(`${change.sourceId}:${change.reason}`),
    );

    const registration = registry.register("test.values", {
      getOptions: () => [{ value: "a", label: "A" }, { value: "b" }],
    });

    expect(registry.has("test.values")).toBe(true);
    await expect(
      registry.resolve("test.values", {
        app,
        schema: { type: "string" },
      }),
    ).resolves.toEqual([
      { value: "a", label: "A", source: "test.values" },
      { value: "b", label: "b", source: "test.values" },
    ]);

    registration.dispose();

    expect(registry.has("test.values")).toBe(false);
    await expect(
      registry.resolve("test.values", {
        app,
        schema: { type: "string" },
      }),
    ).resolves.toEqual([]);
    expect(events).toEqual([
      "test.values:registered",
      "test.values:unregistered",
    ]);
  });

  it("rejects duplicate source ids", () => {
    const registry = new ConfigurationOptionSourceRegistry();
    registry.register("test.values", {
      getOptions: () => [],
    });

    expect(() =>
      registry.register("test.values", {
        getOptions: () => [],
      }),
    ).toThrow("Configuration option source already registered: test.values");
  });

  it("emits invalidated change events", () => {
    const registry = new ConfigurationOptionSourceRegistry();
    const events: string[] = [];
    registry.on("changed", (change) => events.push(change.reason));

    const registration = registry.register("test.values", {
      getOptions: () => [],
    });
    registration.invalidate();

    expect(events).toEqual(["registered", "invalidated"]);
  });

  it("resolves async providers", async () => {
    const registry = new ConfigurationOptionSourceRegistry();
    registry.register("test.async", {
      getOptions: async () => [{ value: "x", label: "X" }],
    });

    await expect(
      registry.resolve("test.async", {
        app: createAppStub(),
        schema: { type: "string" },
      }),
    ).resolves.toEqual([{ value: "x", label: "X", source: "test.async" }]);
  });

  it("returns an empty list when a provider throws", async () => {
    const registry = new ConfigurationOptionSourceRegistry();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    registry.register("test.error", {
      getOptions: () => {
        throw new Error("boom");
      },
    });

    await expect(
      registry.resolve("test.error", {
        app: createAppStub(),
        schema: { type: "string" },
      }),
    ).resolves.toEqual([]);

    warn.mockRestore();
  });

  it("lists registered source ids in sorted order", () => {
    const registry = new ConfigurationOptionSourceRegistry();
    registry.register("b.source", { getOptions: () => [] });
    registry.register("a.source", { getOptions: () => [] });

    expect(registry.getRegisteredSourceIds()).toEqual(["a.source", "b.source"]);
  });

  it("caches session-scoped providers until invalidation", async () => {
    const registry = new ConfigurationOptionSourceRegistry();
    const app = createAppStub();
    let calls = 0;
    const registration = registry.register("test.session", {
      cache: "session",
      getOptions: () => {
        calls += 1;
        return [{ value: "a", label: "A" }];
      },
    });

    await expect(
      registry.resolve("test.session", {
        app,
        schema: { type: "string" },
      }),
    ).resolves.toEqual([{ value: "a", label: "A", source: "test.session" }]);
    await expect(
      registry.resolve("test.session", {
        app,
        schema: { type: "string" },
      }),
    ).resolves.toEqual([{ value: "a", label: "A", source: "test.session" }]);
    expect(calls).toBe(1);

    registration.invalidate();

    await expect(
      registry.resolve("test.session", {
        app,
        schema: { type: "string" },
      }),
    ).resolves.toEqual([{ value: "a", label: "A", source: "test.session" }]);
    expect(calls).toBe(2);
  });

  it("caches queried session-scoped results separately", async () => {
    const registry = new ConfigurationOptionSourceRegistry();
    const app = createAppStub();
    let calls = 0;
    registry.register("test.query", {
      cache: "session",
      getOptions: ({ query }) => {
        calls += 1;
        return [{ value: query ?? "all", label: query ?? "All" }];
      },
    });

    await expect(
      registry.resolve("test.query", {
        app,
        schema: { type: "string" },
        query: "alpha",
      }),
    ).resolves.toEqual([
      { value: "alpha", label: "alpha", source: "test.query" },
    ]);
    await expect(
      registry.resolve("test.query", {
        app,
        schema: { type: "string" },
        query: "alpha",
      }),
    ).resolves.toEqual([
      { value: "alpha", label: "alpha", source: "test.query" },
    ]);
    await expect(
      registry.resolve("test.query", {
        app,
        schema: { type: "string" },
        query: "beta",
      }),
    ).resolves.toEqual([
      { value: "beta", label: "beta", source: "test.query" },
    ]);
    expect(calls).toBe(2);

    await expect(
      registry.resolve("test.query", {
        app,
        schema: { type: "string" },
        query: "beta",
      }),
    ).resolves.toEqual([
      { value: "beta", label: "beta", source: "test.query" },
    ]);
    expect(calls).toBe(2);
  });
});
