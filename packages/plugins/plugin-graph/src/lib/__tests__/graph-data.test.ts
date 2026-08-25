import { describe, expect, test, vi } from "vitest";
import { buildGlobalGraph, buildLocalGraph } from "../graph-data";
import { DEFAULT_GRAPH_SETTINGS, patchGraphSettings } from "../graph-settings";

function createFile(path: string, extension: string, ctime = 10, mtime = 20) {
  const basename = path.split("/").at(-1) ?? path;
  return {
    path,
    basename,
    baseName: basename.replace(/\.[^.]+$/, ""),
    extension,
    stat: { ctime, mtime, size: 100 },
  };
}

function createRow(
  file: ReturnType<typeof createFile>,
  options: {
    tags?: string[];
    links?: Array<{
      targetText: string;
      resolvedTargetPath: string | null;
      type: "link" | "embed";
      count: number;
    }>;
  } = {},
) {
  return {
    file: {
      path: file.path,
      normalizedPath: file.path.toLowerCase(),
      extension: file.extension,
      mtime: file.stat.mtime,
      size: file.stat.size,
      hash: file.path,
      indexed: true,
    },
    metadata: null,
    properties: [],
    tags: (options.tags ?? []).map((tag) => ({
      path: file.path,
      tag,
      parts: tag.replace(/^#/, "").split("/"),
      hierarchy: [tag.replace(/^#/, "")],
    })),
    links: (options.links ?? []).map((link) => ({
      sourcePath: file.path,
      original: link.targetText,
      ...link,
    })),
  };
}

function createApp() {
  const noteA = createFile("Notes/A.md", "md");
  const noteB = createFile("Notes/B.md", "md");
  const orphan = createFile("Notes/Orphan.md", "md");
  const attachment = createFile("Attachments/map.png", "png");
  const rows = [
    createRow(noteA, {
      tags: ["#project", "#focus"],
      links: [
        {
          targetText: "Notes/B.md",
          resolvedTargetPath: noteB.path,
          type: "link",
          count: 2,
        },
        {
          targetText: "Missing.md",
          resolvedTargetPath: null,
          type: "link",
          count: 1,
        },
        {
          targetText: "Attachments/map.png",
          resolvedTargetPath: attachment.path,
          type: "embed",
          count: 1,
        },
      ],
    }),
    createRow(noteB),
    createRow(orphan),
  ];
  const fileMap = new Map([
    [noteA.path, noteA],
    [noteB.path, noteB],
    [orphan.path, orphan],
    [attachment.path, attachment],
  ]);
  const queryMetadataPage = vi.fn(async () => ({ rows }));
  const queryMetadata = vi.fn(
    async (query: { pathPrefixes?: string[]; requiredTags?: string[] }) => {
      if (query.pathPrefixes?.length) {
        const paths = new Set(query.pathPrefixes);
        return rows.filter((row) => paths.has(row.file.path));
      }
      if (query.requiredTags?.length) {
        const tags = new Set(
          query.requiredTags.map((tag) => `#${tag.replace(/^#/, "")}`),
        );
        return rows.filter((row) => row.tags.some((tag) => tags.has(tag.tag)));
      }
      return rows;
    },
  );
  const queryLinks = vi.fn(
    async (query: { direction: "incoming" | "outgoing"; paths?: string[] }) => {
      const paths = new Set(query.paths ?? []);
      const links = rows.flatMap((row) => row.links);
      return query.direction === "incoming"
        ? links.filter(
            (link) =>
              link.resolvedTargetPath && paths.has(link.resolvedTargetPath),
          )
        : links.filter((link) => paths.has(link.sourcePath));
    },
  );

  return {
    app: {
      vault: {
        getFileByPath(path: string) {
          return fileMap.get(path) ?? null;
        },
      },
      metadataCache: {
        queryMetadataPage,
        queryMetadata,
        queryLinks,
      },
      workspace: {
        getActiveFile() {
          return noteA;
        },
      },
    } as any,
    noteA,
    queryMetadataPage,
  };
}

describe("graph data", () => {
  test("builds indexed tag, attachment, and unresolved nodes", async () => {
    const { app, queryMetadataPage } = createApp();
    const settings = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      filters: {
        showTags: true,
        showAttachments: true,
        existingFilesOnly: false,
      },
    });
    const graph = await buildGlobalGraph(app, settings);

    expect(queryMetadataPage).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 256,
        include: ["tags", "links"],
      }),
    );
    expect(graph.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining([
        "note:Notes/A.md",
        "note:Notes/B.md",
        "tag:#project",
        "tag:#focus",
        "attachment:Attachments/map.png",
        "unresolved:Missing.md",
      ]),
    );
    expect(graph.links.map((link) => link.id)).toEqual(
      expect.arrayContaining([
        "internal-link:note:Notes/A.md:note:Notes/B.md",
        "embed:note:Notes/A.md:attachment:Attachments/map.png",
        "tag:note:Notes/A.md:tag:#project",
      ]),
    );
  });

  test("hides orphan notes when configured", async () => {
    const settings = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      filters: { showOrphans: false },
    });
    const graph = await buildGlobalGraph(createApp().app, settings);
    expect(graph.nodes.some((node) => node.id === "note:Notes/Orphan.md")).toBe(
      false,
    );
  });

  test("scopes the local graph by indexed depth", async () => {
    const { app, noteA } = createApp();
    const settings = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      filters: {
        showAttachments: true,
        existingFilesOnly: false,
      },
      localGraph: { depth: 1 },
    });
    const graph = await buildLocalGraph(app, settings, noteA as never);

    expect(graph.centerNodeId).toBe("note:Notes/A.md");
    expect(graph.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining([
        "note:Notes/A.md",
        "note:Notes/B.md",
        "attachment:Attachments/map.png",
        "unresolved:Missing.md",
      ]),
    );
    expect(graph.nodes.some((node) => node.id === "note:Notes/Orphan.md")).toBe(
      false,
    );
  });

  test("batches a large local neighbourhood below the database path budget", async () => {
    const activeFile = createFile("Notes/Active.md", "md");
    const neighbours = Array.from({ length: 450 }, (_, index) =>
      createFile(`Notes/Neighbour-${String(index).padStart(3, "0")}.md`, "md"),
    );
    const rows = [
      createRow(activeFile, {
        links: neighbours.map((file) => ({
          targetText: file.path,
          resolvedTargetPath: file.path,
          type: "link" as const,
          count: 1,
        })),
      }),
      ...neighbours.map((file) => createRow(file)),
    ];
    const rowsByPath = new Map(rows.map((row) => [row.file.path, row]));
    const metadataBatchSizes: number[] = [];
    const linkBatchSizes: number[] = [];
    const app = {
      vault: {
        getFileByPath(path: string) {
          return path === activeFile.path
            ? activeFile
            : (neighbours.find((file) => file.path === path) ?? null);
        },
      },
      metadataCache: {
        async queryMetadata(query: { pathPrefixes?: string[] }) {
          const paths = query.pathPrefixes ?? [];
          metadataBatchSizes.push(paths.length);
          if (paths.length > 200) throw new Error("metadata path batch too large");
          return paths.flatMap((path) => {
            const row = rowsByPath.get(path);
            return row ? [row] : [];
          });
        },
        async queryLinks(query: {
          direction: "incoming" | "outgoing";
          paths?: string[];
        }) {
          const paths = query.paths ?? [];
          linkBatchSizes.push(paths.length);
          if (paths.length > 200) throw new Error("link path batch too large");
          const selected = new Set(paths);
          const links = rows.flatMap((row) => row.links);
          return query.direction === "incoming"
            ? links.filter(
                (link) =>
                  link.resolvedTargetPath &&
                  selected.has(link.resolvedTargetPath),
              )
            : links.filter((link) => selected.has(link.sourcePath));
        },
      },
      workspace: { getActiveFile: () => activeFile },
    } as any;
    const settings = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      localGraph: { depth: 2 },
    });

    const graph = await buildLocalGraph(app, settings, activeFile as never);

    expect(graph.nodes.filter((node) => node.type === "note")).toHaveLength(
      451,
    );
    expect(Math.max(...metadataBatchSizes)).toBeLessThanOrEqual(200);
    expect(Math.max(...linkBatchSizes)).toBeLessThanOrEqual(200);
    expect(metadataBatchSizes.length).toBeGreaterThan(2);
    expect(linkBatchSizes.length).toBeGreaterThan(2);
  });

  test("does not expand a local neighbourhood through shared tags", async () => {
    const activeFile = createFile("Notes/Active.md", "md");
    const activeRow = createRow(activeFile, {
      tags: ["#shared"],
    });
    const unrelatedFile = createFile("Notes/Unrelated.md", "md");
    const unrelatedRow = createRow(unrelatedFile, { tags: ["#shared"] });
    const queryMetadata = vi.fn(
      async (query: {
        pathPrefixes?: string[];
        requiredTags?: string[];
      }) => {
        if (query.requiredTags?.length) {
          throw new Error("Local Graph must not traverse shared tags");
        }
        const paths = new Set(query.pathPrefixes ?? []);
        return [activeRow, unrelatedRow].filter((row) =>
          paths.has(row.file.path),
        );
      },
    );
    const app = {
      vault: {
        getFileByPath(path: string) {
          if (path === activeFile.path) return activeFile;
          if (path === unrelatedFile.path) return unrelatedFile;
          return null;
        },
      },
      metadataCache: {
        queryMetadata,
        async queryLinks() {
          return [];
        },
      },
      workspace: { getActiveFile: () => activeFile },
    } as any;
    const settings = patchGraphSettings(DEFAULT_GRAPH_SETTINGS, {
      filters: { showTags: true },
      localGraph: { depth: 1 },
    });

    const graph = await buildLocalGraph(app, settings, activeFile as never);

    expect(graph.centerNodeId).toBe("note:Notes/Active.md");
    expect(graph.nodes.map((node) => node.id)).toEqual([
      "note:Notes/Active.md",
      "tag:#shared",
    ]);
    expect(queryMetadata).toHaveBeenCalledTimes(1);
    expect(queryMetadata).not.toHaveBeenCalledWith(
      expect.objectContaining({ requiredTags: expect.anything() }),
    );
  });
});
