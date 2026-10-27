import { describe, expect, it, vi } from "vitest";
import { addIcon, removeIcon, registerIconPacks, IconRegistry } from "../icons";
const svg =
  '<svg viewBox="0 0 24 24"><defs><linearGradient id="a"><stop stop-color="red"/></linearGradient></defs><path fill="url(#a)" d="M2 3h7v9H2z"/></svg>';

describe("plugin file icon registry", () => {
  it("supports legacy plugin-prefixed names outside the owned namespace", async () => {
    const registry = new IconRegistry();
    addIcon("plugin-diagram", svg);
    registerIconPacks([
      {
        name: "plugin-example-shapes",
        icons: {
          prefix: "plugin-example-shapes",
          icons: { shape: { body: '<path d="M7 8h2"/>' } },
        },
      },
    ]);
    try {
      expect(await registry.resolve("plugin-diagram")).toContain("M2 3");
      expect(await registry.resolve("plugin-example-shapes:shape")).toContain(
        "M7 8",
      );
    } finally {
      removeIcon("plugin-diagram");
      registry.dispose();
    }
  });
  it("caches synchronous pack failures across different icon names", async () => {
    const registry = new IconRegistry();
    const loader = vi.fn(() => {
      throw new Error("offline");
    });
    const pack = registry.registerIconPack("example", { name: "sync", loader });
    expect((await registry.resolveIcon(`${pack.prefix}:one`)).status).toBe(
      "failed",
    );
    expect((await registry.resolveIcon(`${pack.prefix}:two`)).status).toBe(
      "failed",
    );
    expect(loader).toHaveBeenCalledTimes(1);
    registry.dispose();
  });
  it("resolves legacy SVG registrations and invalidates missing results", async () => {
    const registry = new IconRegistry();
    const changed = vi.fn();
    const stop = registry.subscribe(changed);
    expect((await registry.resolveIcon("example-diagram")).status).toBe(
      "missing",
    );
    addIcon("example-diagram", svg);
    expect((await registry.resolveIcon("custom:example-diagram")).status).toBe(
      "found",
    );
    expect(await registry.resolve("example-diagram")).toContain("M2 3h7v9H2z");
    removeIcon("example-diagram");
    expect((await registry.resolveIcon("example-diagram")).status).toBe(
      "missing",
    );
    expect(changed).toHaveBeenCalled();
    stop();
    registry.dispose();
  });
  it("isolates owned artwork and protects replacement from stale cleanup", async () => {
    const a = new IconRegistry(),
      b = new IconRegistry();
    const first = a.registerIcon("example", "diagram", svg);
    const second = a.registerIcon(
      "example",
      "diagram",
      svg.replace("M2 3", "M4 5"),
    );
    const other = b.registerIcon("example", "diagram", svg);
    expect(first.id).toBe(other.id);
    first.dispose();
    expect(await a.resolve(second.id)).toContain("M4 5");
    expect(await b.resolve(other.id)).toContain("M2 3");
    second.dispose();
    expect(await a.resolve(second.id)).toBeNull();
    a.dispose();
    b.dispose();
  });
  it("deduplicates pack loads and resolves aliases", async () => {
    let complete!: (value: any) => void;
    const loader = vi.fn(
      () =>
        new Promise<any>((resolve) => {
          complete = resolve;
        }),
    );
    const registry = new IconRegistry();
    const pack = registry.registerIconPack("example", {
      name: "shapes",
      loader,
    });
    const id = `${pack.prefix}:alias`;
    const one = registry.resolve(id),
      two = registry.resolve(id);
    complete({
      prefix: "shapes",
      icons: { shape: { body: '<path d="M2 3h7v9H2z"/>' } },
      aliases: { alias: { parent: "shape" } },
    });
    expect(await one).toContain("M2 3");
    expect(await two).toContain("M2 3");
    expect(loader).toHaveBeenCalledTimes(1);
    registry.dispose();
  });
  it("fences a late loader after unregister and caches failure until replacement", async () => {
    const registry = new IconRegistry();
    let complete!: (value: any) => void;
    const pack = registry.registerIconPack("example", {
      name: "late",
      loader: () =>
        new Promise<any>((r) => {
          complete = r;
        }),
    });
    const pending = registry.resolve(`${pack.prefix}:shape`);
    pack.dispose();
    complete({
      prefix: "late",
      icons: { shape: { body: '<path d="M1 1h1"/>' } },
    });
    expect(await pending).toBeNull();
    const loader = vi.fn(async () => {
      throw new Error("offline");
    });
    const failed = registry.registerIconPack("example", {
      name: "late",
      loader,
    });
    expect((await registry.resolveIcon(`${failed.prefix}:shape`)).status).toBe(
      "failed",
    );
    await registry.resolve(`${failed.prefix}:shape`);
    expect(loader).toHaveBeenCalledTimes(1);
    registry.registerIconPack("example", {
      name: "late",
      icons: {
        prefix: "late",
        icons: { shape: { body: '<path d="M1 1h1"/>' } },
      },
    });
    expect(await registry.resolve(`${failed.prefix}:shape`)).toContain("M1 1");
    registry.dispose();
  });
  it("renders legacy synchronous packs and rejects executable SVG input", async () => {
    registerIconPacks([
      {
        name: "example-pack",
        icons: {
          prefix: "example-pack",
          icons: { shape: { body: '<path d="M7 8h2"/>' } },
        },
      },
    ]);
    const registry = new IconRegistry();
    expect(await registry.resolve("example-pack:shape")).toContain("M7 8");
    expect(() =>
      registry.registerIcon(
        "example",
        "bad",
        '<svg onload="alert(1)"><path d="M0 0"/></svg>',
      ),
    ).toThrow();
    expect(() =>
      registry.registerIcon(
        "example",
        "bad",
        '<svg><use href="https://example.test/icon.svg"/></svg>',
      ),
    ).toThrow();
    registry.dispose();
  });
});
