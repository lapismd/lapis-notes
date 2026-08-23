import { beforeEach, describe, expect, it, vi } from "vitest";
import { MetadataTypeManager } from "../metadata.svelte";
import { inferMetadataPropertyType } from "../metadata-value";
import { TFile, TFolder } from "../storage/fs";

vi.mock("svelte", () => ({
  onMount: (fn: () => void | (() => void)) => fn(),
}));

function createFile(path: string, parent: TFolder | null = null): TFile {
  return new TFile(path, { ctime: 0, mtime: 0, size: 1 }, parent);
}

function createAppContext() {
  const files = new Map<string, TFile>();
  const caches = new Map<string, { frontmatter: Record<string, unknown> }>();
  const frontmatters = new Map<string, Record<string, unknown>>();

  function collectProperties(
    value: unknown,
    path: string,
    output: Array<{
      name: string;
      type: string;
      value: unknown;
      topLevel: boolean;
    }>,
    topLevel = false,
  ) {
    output.push({
      name: path.replace(/\[\d+\]/gu, "[]"),
      type: inferMetadataPropertyType(path, value),
      value,
      topLevel,
    });
    if (Array.isArray(value)) {
      value.forEach((entry, index) =>
        collectProperties(entry, `${path}[${index}]`, output),
      );
    } else if (value && typeof value === "object") {
      for (const [key, entry] of Object.entries(value)) {
        collectProperties(entry, `${path}.${key}`, output);
      }
    }
  }

  function indexedProperties(frontmatter: Record<string, unknown>) {
    const output: Array<{
      name: string;
      type: string;
      value: unknown;
      topLevel: boolean;
    }> = [];
    for (const [name, value] of Object.entries(frontmatter)) {
      collectProperties(value, name, output, true);
    }
    return output;
  }

  const app = {
    props: { configPath: ".obsidian/app.json" },
    vault: {
      on: vi.fn(() => ({ id: "vault-load" })),
      offref: vi.fn(),
      getFileByPath: vi.fn((path: string) => files.get(path) ?? null),
      read: vi.fn(async () => ""),
      modify: vi.fn(async () => {}),
    },
    metadataCache: {
      on: vi.fn(() => ({ id: "metadata-event" })),
      offref: vi.fn(),
      getAllItems: vi.fn(
        () =>
          new Map(
            [...files.values()]
              .filter((file) => caches.has(file.path))
              .map((file) => [file, caches.get(file.path)!]),
          ),
      ),
      getCache: vi.fn((path: string) => caches.get(path) ?? null),
      fileCache: {} as Record<string, unknown>,
      queryFacets: vi.fn(
        async (query: {
          kind: "property-name" | "property-path" | "property-value";
          propertyName?: string;
          limit?: number;
        }) => {
          const counts = new Map<
            string,
            {
              value: unknown;
              valueType: "string" | "number" | "boolean" | "null";
              count: number;
              metadataTypes?: string[];
              topLevel?: boolean;
            }
          >();
          for (const cache of caches.values()) {
            const properties = indexedProperties(cache.frontmatter);
            const candidates =
              query.kind === "property-name"
                ? properties.filter((property) => property.topLevel)
                : properties;
            const seen = new Set<string>();
            for (const property of candidates) {
              if (
                query.kind === "property-value" &&
                property.name !== query.propertyName
              ) {
                continue;
              }
              const value =
                query.kind === "property-value" ? property.value : property.name;
              if (
                value !== null &&
                !["string", "number", "boolean"].includes(typeof value)
              ) {
                continue;
              }
              const key = `${typeof value}\0${String(value)}`;
              if (seen.has(key)) continue;
              seen.add(key);
              const current = counts.get(key);
              counts.set(key, {
                value,
                valueType:
                  value === null
                    ? "null"
                    : (typeof value as "string" | "number" | "boolean"),
                count: (current?.count ?? 0) + 1,
                metadataTypes: [property.type],
                topLevel: property.topLevel,
              });
            }
          }
          return [...counts.values()]
            .sort(
              (left, right) =>
                right.count - left.count ||
                String(left.value).localeCompare(String(right.value)),
            )
            .slice(0, query.limit ?? 100);
        },
      ),
      queryMetadataPage: vi.fn(
        async (query: {
          after?: string;
          limit?: number;
          query?: { propertyFilters?: Array<{ name: string }> };
        }) => {
          const required = query.query?.propertyFilters?.map(({ name }) => name) ?? [];
          const paths = [...files.keys()]
            .filter((path) => {
              const frontmatter = caches.get(path)?.frontmatter;
              if (!frontmatter) return false;
              const properties = indexedProperties(frontmatter);
              return required.every((name) =>
                properties.some((property) => property.name === name),
              );
            })
            .sort()
            .filter((path) => !query.after || path > query.after);
          const limit = query.limit ?? 100;
          const pagePaths = paths.slice(0, limit);
          return {
            rows: pagePaths.map((path) => ({
              file: {
                path,
                normalizedPath: path.toLowerCase(),
                extension: "md",
                mtime: 0,
                size: 1,
                hash: path,
                indexed: true,
              },
              metadata: null,
              properties: [],
              tags: [],
              links: [],
            })),
            nextCursor:
              pagePaths.length === limit && paths.length > limit
                ? pagePaths.at(-1)
                : undefined,
          };
        },
      ),
    },
    fileManager: {
      processFrontMatter: vi.fn(
        async (file: TFile, mutate: (data: any) => void) => {
          const next = structuredClone(frontmatters.get(file.path) ?? {});
          mutate(next);
          frontmatters.set(file.path, next);
          caches.set(file.path, { frontmatter: structuredClone(next) });
        },
      ),
    },
  };

  function addFile(path: string, frontmatter: Record<string, unknown>) {
    const file = createFile(path);
    files.set(path, file);
    frontmatters.set(path, structuredClone(frontmatter));
    caches.set(path, { frontmatter: structuredClone(frontmatter) });
    app.metadataCache.fileCache[path] = { hash: path };
    return file;
  }

  return { app, addFile, caches, frontmatters };
}

describe("MetadataTypeManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks nested property membership and removes stale paths on change", async () => {
    const ctx = createAppContext();
    const file = ctx.addFile("Notes/one.md", {
      status: "open",
      stats: { done: false },
    });
    const manager = new MetadataTypeManager(ctx.app as any);

    await manager.updateProperties();
    expect(manager.properties["status"]?.count).toBe(1);
    expect(manager.properties["stats.done"]?.count).toBe(1);

    ctx.caches.set(file.path, { frontmatter: { status: "open" } });
    await manager.updateProperties();

    expect(manager.properties["status"]?.count).toBe(1);
    expect(manager.properties["stats.done"]).toBeUndefined();
  });

  it("infers semantic top-level types while preserving nested tracking", async () => {
    const ctx = createAppContext();
    const file = ctx.addFile("Notes/one.md", {
      tags: ["work"],
      aliases: ["Daily"],
      "note.status": "draft",
      prop: [{ name: "alpha" }],
    });
    const manager = new MetadataTypeManager(ctx.app as any);

    await manager.updateProperties();

    expect(manager.properties.tags?.type).toBe("tags");
    expect(manager.properties.aliases?.type).toBe("aliases");
    expect(manager.properties["note.status"]?.type).toBe("text");
    expect(manager.properties.prop?.type).toBe("array");
    expect(manager.properties["prop[].name"]?.type).toBe("text");
  });

  it("renames nested properties with falsey values and migrates persisted types", async () => {
    const ctx = createAppContext();
    ctx.addFile("Notes/one.md", { config: { enabled: false } });
    ctx.addFile("Notes/two.md", { config: { enabled: false } });
    const manager = new MetadataTypeManager(ctx.app as any);

    manager.types["config.enabled"] = {
      name: "config.enabled",
      type: "checkbox",
    };
    manager.reload();

    const result = await manager.rename("config.enabled", "config.active");

    expect(result.failedFiles).toEqual([]);
    expect(result.updatedFiles).toHaveLength(2);
    expect(ctx.frontmatters.get("Notes/one.md")).toEqual({
      config: { active: false },
    });
    expect(ctx.frontmatters.get("Notes/two.md")).toEqual({
      config: { active: false },
    });
    expect(manager.types["config.enabled"]).toBeUndefined();
    expect(manager.types["config.active"]?.type).toBe("checkbox");
  });

  it("reports collisions without moving values or persisted types", async () => {
    const ctx = createAppContext();
    ctx.addFile("Notes/one.md", {
      config: { enabled: false, active: true },
    });
    const manager = new MetadataTypeManager(ctx.app as any);

    manager.types["config.enabled"] = {
      name: "config.enabled",
      type: "checkbox",
    };
    manager.reload();

    const result = await manager.rename("config.enabled", "config.active");

    expect(result.updatedFiles).toEqual([]);
    expect(result.failedFiles).toEqual([
      {
        path: "Notes/one.md",
        message: 'Property "config.active" already exists',
      },
    ]);
    expect(ctx.frontmatters.get("Notes/one.md")).toEqual({
      config: { enabled: false, active: true },
    });
    expect(manager.types["config.enabled"]?.type).toBe("checkbox");
    expect(manager.types["config.active"]).toBeUndefined();
  });

  it("renames exact top-level keys without using lodash path semantics", async () => {
    const ctx = createAppContext();
    ctx.addFile("Notes/one.md", {
      "note.status": "draft",
      note: { status: "nested" },
    });
    ctx.addFile("Notes/two.md", { "note.status": "done" });
    const manager = new MetadataTypeManager(ctx.app as any);

    manager.types["note.status"] = {
      name: "note.status",
      type: "text",
    };
    manager.reload();

    const result = await manager.renameTopLevelProperty(
      "note.status",
      "note.state",
    );

    expect(result.failedFiles).toEqual([]);
    expect(result.updatedFiles).toHaveLength(2);
    expect(ctx.frontmatters.get("Notes/one.md")).toEqual({
      "note.state": "draft",
      note: { status: "nested" },
    });
    expect(ctx.frontmatters.get("Notes/two.md")).toEqual({
      "note.state": "done",
    });
    expect(manager.types["note.status"]).toBeUndefined();
    expect(manager.types["note.state"]?.type).toBe("text");
  });

  it("deletes exact top-level keys across affected files", async () => {
    const ctx = createAppContext();
    ctx.addFile("Notes/one.md", {
      tags: ["work"],
      nested: { tags: ["keep"] },
    });
    ctx.addFile("Notes/two.md", { tags: ["home"] });
    const manager = new MetadataTypeManager(ctx.app as any);

    manager.types.tags = { name: "tags", type: "tags" };
    manager.reload();

    const result = await manager.deleteTopLevelProperty("tags");

    expect(result.failedFiles).toEqual([]);
    expect(result.updatedFiles).toHaveLength(2);
    expect(ctx.frontmatters.get("Notes/one.md")).toEqual({
      nested: { tags: ["keep"] },
    });
    expect(ctx.frontmatters.get("Notes/two.md")).toEqual({});
    expect(manager.types.tags).toBeUndefined();
  });

  it("changes exact top-level property type and coerces values", async () => {
    const ctx = createAppContext();
    ctx.addFile("Notes/one.md", { published: "false" });
    ctx.addFile("Notes/two.md", { published: "true" });
    const manager = new MetadataTypeManager(ctx.app as any);

    const result = await manager.setTopLevelPropertyType(
      "published",
      "checkbox",
    );

    expect(result.failedFiles).toEqual([]);
    expect(result.updatedFiles).toHaveLength(2);
    expect(ctx.frontmatters.get("Notes/one.md")).toEqual({
      published: false,
    });
    expect(ctx.frontmatters.get("Notes/two.md")).toEqual({
      published: true,
    });
    expect(manager.types.published?.type).toBe("checkbox");
  });

  it("surfaces facet query failures and recovers on the next revision", async () => {
    const ctx = createAppContext();
    ctx.addFile("Notes/one.md", { status: "open" });
    const manager = new MetadataTypeManager(ctx.app as any);
    await manager.updateProperties();

    ctx.app.metadataCache.queryFacets.mockRejectedValueOnce(
      new Error("metadata database unavailable"),
    );
    await manager.updateProperties();

    expect(manager.queryError).toBe("metadata database unavailable");
    expect(manager.propertiesLoading).toBe(false);
    expect(manager.properties.status?.count).toBe(1);

    await manager.updateProperties();
    expect(manager.queryError).toBeNull();
    expect(manager.properties.status?.count).toBe(1);
  });
});
