import { describe, expect, it, vi } from "vitest";
import {
  cacheMatchesDependencies,
  collectMetadataDependencies,
  shouldReloadForMetadataChange,
} from "./metadata-invalidation-core";

describe("collectMetadataDependencies", () => {
  it("tracks frontmatter, tag, link, and file-field dependencies from filters and view state", () => {
    const dependencies = collectMetadataDependencies({
      documentFilter: {
        and: [
          { column: "note.owner", op: "=", value: "me" },
          { column: "file", op: "hasProperty", value: "status" },
          { column: "file", op: "hasTag", value: "project/active" },
          { column: "file", op: "hasLink", value: "Target" },
          { column: "file.folder", op: "inFolder", value: "Projects" },
        ],
      },
      viewFilter: { and: [{ column: "note.priority", op: ">", value: "1" }] },
      order: ["note.status", "file.name"],
      sort: [
        { property: "file.mtime", direction: "DESC" },
        { property: "note.due", direction: "ASC" },
      ],
      groupByProperty: "file.folder",
      imageProperty: "note.cover",
      formulas: {},
    });

    expect([...dependencies.properties].sort()).toEqual([
      "cover",
      "due",
      "owner",
      "priority",
      "status",
    ]);
    expect(dependencies.propertyPresence).toBe(true);
    expect(dependencies.tags).toBe(true);
    expect(dependencies.links).toBe(true);
    expect([...dependencies.staticFileFields].sort()).toEqual([
      "file.folder",
      "file.name",
    ]);
    expect([...dependencies.dynamicFileFields]).toEqual(["file.mtime"]);
    expect(dependencies.custom).toBe(false);
  });

  it("marks formulas and custom filters as broad dependencies", () => {
    const dependencies = collectMetadataDependencies({
      documentFilter: { and: ["contains(note.title, formula.status)"] },
      viewFilter: { and: [{ column: "formula.score", op: ">", value: "0" }] },
      order: [],
      sort: [],
      groupByProperty: null,
      formulas: { score: "note.points" },
    });

    expect(dependencies.custom).toBe(true);
  });
});

describe("cacheMatchesDependencies", () => {
  it("matches relevant frontmatter properties", () => {
    const dependencies = collectMetadataDependencies({
      documentFilter: {
        and: [{ column: "note.status", op: "=", value: "open" }],
      },
      viewFilter: { and: [] },
      order: [],
      sort: [],
      groupByProperty: null,
      formulas: {},
    });

    expect(
      cacheMatchesDependencies(
        { frontmatter: { status: "open" } },
        dependencies,
      ),
    ).toBe(true);
    expect(
      cacheMatchesDependencies(
        { frontmatter: { other: "value" } },
        dependencies,
      ),
    ).toBe(false);
  });
});

describe("shouldReloadForMetadataChange", () => {
  it("does not reload for unrelated changes when only static file fields are used", () => {
    const dependencies = collectMetadataDependencies({
      documentFilter: {
        and: [{ column: "file.folder", op: "inFolder", value: "Projects" }],
      },
      viewFilter: { and: [] },
      order: ["file.name"],
      sort: [],
      groupByProperty: null,
      formulas: {},
    });

    expect(
      shouldReloadForMetadataChange({
        changedPath: "Other/Note.md",
        currentResultPaths: ["Projects/Index.md"],
        cache: { frontmatter: {}, tags: [], links: [], embeds: [] },
        prevCache: null,
        dependencies,
        isDirectlyAffectedByPathChange: vi.fn(() => false),
      }),
    ).toBe(false);
  });

  it("reloads for mutable file fields even when the changed file is outside current results", () => {
    const dependencies = collectMetadataDependencies({
      documentFilter: { and: [] },
      viewFilter: { and: [] },
      order: [],
      sort: [{ property: "file.mtime", direction: "DESC" }],
      groupByProperty: null,
      formulas: {},
    });

    expect(
      shouldReloadForMetadataChange({
        changedPath: "Other/Note.md",
        currentResultPaths: ["Projects/Index.md"],
        cache: { frontmatter: {}, tags: [], links: [], embeds: [] },
        prevCache: null,
        dependencies,
        isDirectlyAffectedByPathChange: vi.fn(() => false),
      }),
    ).toBe(true);
  });

  it("reloads when the changed cache satisfies a tracked frontmatter dependency", () => {
    const dependencies = collectMetadataDependencies({
      documentFilter: {
        and: [{ column: "note.status", op: "=", value: "open" }],
      },
      viewFilter: { and: [] },
      order: [],
      sort: [],
      groupByProperty: null,
      formulas: {},
    });

    expect(
      shouldReloadForMetadataChange({
        changedPath: "Other/Note.md",
        currentResultPaths: ["Projects/Index.md"],
        cache: { frontmatter: { status: "open" } },
        prevCache: null,
        dependencies,
        isDirectlyAffectedByPathChange: vi.fn(() => false),
      }),
    ).toBe(true);
  });
});
