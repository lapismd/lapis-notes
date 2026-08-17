import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@lapismd/mira/preview/frontmatter", () => ({
  createFrontmatterPropertyManager: (config: any = {}) => {
    const types = { ...(config.types ?? {}) };
    return {
      get config() {
        return { ...config, types };
      },
      resolveType(pathString: string, key: string, _value: unknown) {
        const configured = types[pathString] ?? types[key];
        if (typeof configured === "string") return configured;
        if (
          configured &&
          typeof configured === "object" &&
          "type" in configured
        ) {
          return configured.type;
        }
        return "text";
      },
      properties: () => [],
      typeOptions: () => [],
      resolveWidget(kind: string) {
        return (
          config.widgets?.find((widget: any) => widget.type === kind) ?? null
        );
      },
      coerceValue: (value: unknown) => value,
      defaultValue: () => "",
      setType(key: string, type: string) {
        types[key] = type;
      },
      rename: config.rename,
    };
  },
  FrontmatterController: class FrontmatterController {},
}));

vi.mock("@lapis-notes/api", () => ({
  Notice: class Notice {
    constructor(public message: string) {}
  },
  normalizeMetadataValue: (type: string, value: unknown) => {
    if (type === "number" && typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : value;
    }
    return value;
  },
}));

import {
  commitLapisFrontmatterRecord,
  createLapisFrontmatterPropertyManager,
} from "./lapis-frontmatter-adapter";

function createAppFixture(frontmatter: Record<string, unknown>) {
  const types: Record<string, { name: string; type: string }> = {
    count: { name: "count", type: "number" },
  };
  const registeredTypeWidgets = {
    text: {
      type: "text",
      name: "Text",
      icon: "lucide-text",
      default: () => "",
      validate: () => true,
      render: () => undefined,
    },
    tags: {
      type: "tags",
      name: "Tags",
      icon: "lucide-hash",
      default: () => [],
      validate: () => true,
      render: () => undefined,
    },
    aliases: {
      type: "aliases",
      name: "Aliases",
      icon: "lucide-at-sign",
      default: () => [],
      validate: () => true,
      render: () => undefined,
    },
    number: {
      type: "number",
      name: "Number",
      icon: "lucide-binary",
      default: () => 0,
      validate: () => true,
      render: () => undefined,
    },
  };
  let current = structuredClone(frontmatter);

  return {
    app: {
      metadataTypeManager: {
        types,
        registeredTypeWidgets,
        properties: {
          title: { name: "title", type: "text", count: 1, files: new Set() },
        },
        getAllProperties() {
          return this.properties;
        },
        getValues(key: string) {
          if (key === "tags") return [["demo"], ["ideas", "project/beta"]];
          return [];
        },
        setType: vi.fn((key: string, type: string) => {
          types[key] = { name: key, type };
        }),
        rename: vi.fn(async (prev: string, next: string) => {
          if (types[prev]) {
            types[next] = { ...types[prev], name: next };
            delete types[prev];
          }
          return { updatedFiles: ["note.md"], failedFiles: [] };
        }),
      },
      fileManager: {
        processFrontMatter: vi.fn(
          async (
            _file: { path: string },
            mutate: (data: Record<string, unknown>) => void,
          ) => {
            const next = structuredClone(current);
            mutate(next);
            current = next;
          },
        ),
      },
      metadataCache: {
        getCache: () => ({ frontmatter: structuredClone(current) }),
      },
    } as any,
    getFrontmatter: () => current,
  };
}

describe("lapis frontmatter adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes Lapis definitions while preserving Mira native editors", () => {
    const { app } = createAppFixture({ title: "Demo" });
    const manager = createLapisFrontmatterPropertyManager(app);

    expect(manager.resolveWidget("tags")?.label).toBe("Tags");
    expect(manager.resolveWidget("tags")?.icon).toBe("lucide-hash");
    expect(manager.resolveWidget("tags")?.render).toBeUndefined();
    expect(manager.resolveWidget("aliases")?.render).toBeUndefined();
    expect(manager.resolveType("count", "count", "2")).toBe("number");
    expect(manager.config.valueSuggestions?.("tags", "ide")).toEqual([
      "demo",
      "ideas",
      "project/beta",
    ]);

    manager.setType("status", "text");
    expect(app.metadataTypeManager.setType).toHaveBeenCalledWith(
      "status",
      "text",
    );
  });

  it("commits controller records through processFrontMatter with normalization", async () => {
    const { app, getFrontmatter } = createAppFixture({
      title: "Demo",
      count: "3",
    });

    await commitLapisFrontmatterRecord(app, { path: "note.md" } as any, {
      record: { title: "Updated", count: "4" },
      yaml: "title: Updated\ncount: 4\n",
      replacement: "---\ntitle: Updated\ncount: 4\n---\n",
      from: null,
      to: null,
    });

    expect(app.fileManager.processFrontMatter).toHaveBeenCalled();
    expect(getFrontmatter()).toEqual({
      title: "Updated",
      count: 4,
    });
  });
});
