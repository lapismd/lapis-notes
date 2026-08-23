import { describe, expect, it, vi } from "vitest";
import type { CachedMetadata, Pos } from "@lapis-notes/api";
import {
  buildBacklinksData,
  buildLinkSidebarData,
  buildLinkedLinkSidebarData,
  buildOutgoingLinksData,
  findExactUnlinkedMentions,
  sortLinkSidebarGroups,
  type LinkSidebarFile,
  type LinkSidebarState,
} from "./link-sidebar-data";
import type { App, TFile } from "@lapis-notes/api";

function file(path: string, ctime = 1, mtime = 1): LinkSidebarFile {
  const name = path.split("/").pop() ?? path;
  const dot = name.lastIndexOf(".");
  return {
    path,
    name,
    basename: dot === -1 ? name : name.slice(0, dot),
    extension: dot === -1 ? "" : name.slice(dot + 1),
    stat: { ctime, mtime, size: 0 },
  };
}

function pos(content: string, text: string): Pos {
  const offset = content.indexOf(text);
  if (offset === -1) throw new Error(`Unable to find ${text}`);
  return {
    start: { line: 0, col: offset, offset },
    end: { line: 0, col: offset + text.length, offset: offset + text.length },
  };
}

function state(input: {
  activePath: string;
  files: LinkSidebarFile[];
  caches: Record<string, CachedMetadata>;
  documents: Record<string, { content: string; frontmatterEndOffset?: number }>;
  resolved?: Record<string, Record<string, string>>;
}): LinkSidebarState {
  return {
    activeFile: input.files.find(
      (candidate) => candidate.path === input.activePath,
    )!,
    files: input.files,
    caches: new Map(Object.entries(input.caches)),
    documents: new Map(
      Object.entries(input.documents).map(([path, document]) => [
        path,
        { path, ...document },
      ]),
    ),
    resolveLinkPath: (link, sourcePath) =>
      input.resolved?.[sourcePath]?.[link] ?? null,
  };
}

describe("link sidebar data", () => {
  it("groups linked backlinks and excludes linked ranges from unlinked matches", () => {
    const target = file("Target.md");
    const linked = file("Linked.md");
    const plain = file("Plain.md");
    const linkedContent =
      "A linked mention: [[Target]] and embed ![[Target]]. Target again.";
    const linkReference = {
      link: "Target",
      original: "[[Target]]",
      position: pos(linkedContent, "[[Target]]"),
    };
    const embedReference = {
      link: "Target",
      original: "![[Target]]",
      position: pos(linkedContent, "![[Target]]"),
    };
    const data = buildBacklinksData(
      state({
        activePath: target.path,
        files: [target, linked, plain],
        documents: {
          [target.path]: { content: "# Target" },
          [linked.path]: { content: linkedContent },
          [plain.path]: { content: "A plain Target mention." },
        },
        caches: {
          [target.path]: {},
          [linked.path]: {
            links: [linkReference],
            embeds: [embedReference],
          },
          [plain.path]: {},
        },
        resolved: { [linked.path]: { Target: target.path } },
      }),
    );
    expect(data.linkedGroups[0]?.file.path).toBe(linked.path);
    expect(
      data.linkedGroups[0]?.mentions.map((mention) => mention.kind),
    ).toEqual(["link", "embed"]);
    expect(data.unlinkedGroups.map((group) => group.file.path)).toEqual([
      linked.path,
      plain.path,
    ]);
    expect(data.unlinkedGroups[0]?.mentions[0]?.context).toContain(
      "Target again",
    );
  });

  it("uses aliases and ignores frontmatter for unlinked backlinks", () => {
    const target = file("Target.md");
    const source = file("Source.md");
    const content =
      "---\nalias: Project Alpha\n---\nProject Alpha is mentioned.";
    const data = buildBacklinksData(
      state({
        activePath: target.path,
        files: [target, source],
        documents: {
          [target.path]: { content: "# Target" },
          [source.path]: {
            content,
            frontmatterEndOffset: content.indexOf("Project Alpha is"),
          },
        },
        caches: {
          [target.path]: { frontmatter: { aliases: ["Project Alpha"] } },
          [source.path]: {},
        },
      }),
    );
    expect(data.unlinkedGroups[0]?.mentions).toHaveLength(1);
    expect(data.unlinkedGroups[0]?.mentions[0]?.context).toContain(
      "is mentioned",
    );
  });

  it("groups outgoing linked and exact unlinked mentions", () => {
    const active = file("Active.md");
    const linked = file("Linked.md");
    const unlinked = file("Unlinked.md");
    const content = "This links [[Linked]] and names Unlinked plainly.";
    const data = buildOutgoingLinksData(
      state({
        activePath: active.path,
        files: [active, linked, unlinked],
        documents: {
          [active.path]: { content },
          [linked.path]: { content: "# Linked" },
          [unlinked.path]: { content: "# Unlinked" },
        },
        caches: {
          [active.path]: {
            links: [
              {
                link: "Linked",
                original: "[[Linked]]",
                position: pos(content, "[[Linked]]"),
              },
            ],
          },
          [linked.path]: {},
          [unlinked.path]: {},
        },
        resolved: { [active.path]: { Linked: linked.path } },
      }),
    );
    expect(data.linkedGroups.map((group) => group.file.path)).toEqual([
      linked.path,
    ]);
    expect(data.unlinkedGroups.map((group) => group.file.path)).toEqual([
      unlinked.path,
    ]);
  });

  it("respects word boundaries and file time sorting", () => {
    const content = "Target [[Target]] Targeted Target";
    expect(
      findExactUnlinkedMentions({
        content,
        aliases: ["Target"],
        blockedRanges: [pos(content, "[[Target]]")],
      }).map((match) => match.offset),
    ).toEqual([0, content.lastIndexOf("Target")]);

    const older = file("Older.md", 1, 1);
    const newer = file("Newer.md", 2, 3);
    const groups = [older, newer].map((entry) => ({
      file: entry,
      mentions: [],
    }));
    expect(sortLinkSidebarGroups(groups, "modified-desc")[0]?.file.path).toBe(
      newer.path,
    );
    expect(sortLinkSidebarGroups(groups, "created-asc")[0]?.file.path).toBe(
      older.path,
    );
  });

  it("builds linked mentions from indexed link queries", async () => {
    const active = file("Active.md") as TFile;
    const linked = file("Linked.md") as TFile;
    const content = "See [[Linked]] and names Unlinked.";
    const cache = {
      links: [
        {
          link: "Linked",
          original: "[[Linked]]",
          position: pos(content, "[[Linked]]"),
        },
      ],
    };
    const caches: Record<string, typeof cache | Record<string, never>> = {
      [active.path]: cache,
      [linked.path]: {},
    };
    const app = {
      metadataCache: {
        queryLinks: async (query: { direction: string; path?: string }) => {
          if (query.direction === "outgoing" && query.path === active.path) {
            return [
              {
                sourcePath: active.path,
                targetText: "Linked",
                resolvedTargetPath: linked.path,
                type: "link",
                count: 1,
              },
            ];
          }
          if (query.direction === "incoming" && query.path === linked.path) {
            return [
              {
                sourcePath: active.path,
                targetText: "Linked",
                resolvedTargetPath: linked.path,
                type: "link",
                count: 1,
              },
            ];
          }
          return [];
        },
        getFileCacheAsync: async (candidate: TFile | string) =>
          caches[typeof candidate === "string" ? candidate : candidate.path] ??
          null,
        getFirstLinkpathDest: () => null,
      },
      appDatabase: {
        getSearchDocument: async () => undefined,
        searchDocuments: async () => [],
      },
      logger: { warn: () => undefined },
      vault: {
        getMarkdownFiles: () => [active, linked],
        getFileByPath: (path: string) =>
          path === active.path ? active : path === linked.path ? linked : null,
      },
    } as unknown as App;

    expect(
      (
        await buildLinkedLinkSidebarData(app, active, "outgoing")
      ).linkedGroups.map((group) => group.file.path),
    ).toEqual([linked.path]);
    expect(
      (
        await buildLinkedLinkSidebarData(app, linked, "backlinks")
      ).linkedGroups.map((group) => group.file.path),
    ).toEqual([active.path]);
  });

  it("materializes incoming indexed paths when the vault file map is empty", async () => {
    const active = file("Notes/Active.md") as TFile;
    const source = file("Notes/Source.md") as TFile;
    const content = "Back to [[Active]].";
    const sourceCache = {
      links: [
        {
          link: "Active",
          original: "[[Active]]",
          position: pos(content, "[[Active]]"),
        },
      ],
    };
    const caches: Record<string, typeof sourceCache | Record<string, never>> = {
      [active.path]: {},
      [source.path]: sourceCache,
    };
    const app = {
      metadataCache: {
        queryLinks: async () => [
          {
            sourcePath: source.path,
            targetText: "Active",
            resolvedTargetPath: active.path,
            type: "link",
            count: 1,
          },
        ],
        getFileCacheAsync: async (candidate: TFile | string) =>
          caches[typeof candidate === "string" ? candidate : candidate.path] ??
          null,
        getFirstLinkpathDest: () => null,
      },
      appDatabase: {
        getSearchDocument: async () => undefined,
        searchDocuments: async () => [],
      },
      logger: { warn: () => undefined },
      vault: {
        getMarkdownFiles: () => [],
        getFileByPath: () => null,
      },
    } as unknown as App;

    expect(
      (
        await buildLinkedLinkSidebarData(app, active, "backlinks")
      ).linkedGroups.map((group) => group.file.path),
    ).toEqual([source.path]);
  });

  it("builds linked backlinks from incoming indexed rows without source metadata", async () => {
    const active = file("Notes/Active.md") as TFile;
    const source = file("Notes/Source.md") as TFile;
    const caches: Record<string, CachedMetadata> = {
      [active.path]: {
        links: [
          {
            link: "Other",
            original: "[[Other]]",
            position: pos("See [[Other]]", "[[Other]]"),
          },
        ],
      },
    };
    const app = {
      metadataCache: {
        queryLinks: async (query: { direction: string }) =>
          query.direction === "incoming"
            ? [
                {
                  sourcePath: source.path,
                  targetText: "Active",
                  resolvedTargetPath: active.path,
                  type: "link",
                  count: 1,
                },
              ]
            : [],
        getFileCacheAsync: async (candidate: TFile | string) =>
          caches[typeof candidate === "string" ? candidate : candidate.path] ??
          null,
        getFirstLinkpathDest: () => null,
      },
      appDatabase: {
        getSearchDocument: async () => undefined,
        searchDocuments: async () => [],
      },
      logger: { warn: () => undefined },
      vault: {
        getMarkdownFiles: () => [active],
        getFileByPath: (path: string) =>
          path === active.path ? active : path === source.path ? source : null,
      },
    } as unknown as App;

    expect(
      (await buildLinkedLinkSidebarData(app, active, "outgoing")).linkedGroups,
    ).toEqual([]);
    expect(
      (
        await buildLinkedLinkSidebarData(app, active, "backlinks")
      ).linkedGroups.map((group) => group.file.path),
    ).toEqual([source.path]);
  });

  it("discovers bounded outgoing mention candidates through the Search index", async () => {
    const active = file("Notes/Active.md") as TFile;
    const candidate = file("Notes/Candidate.md") as TFile;
    const activeDocument = {
      path: active.path,
      name: active.name,
      extension: active.extension,
      checksum: "active",
      content: "Names Candidate plainly.",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
    };
    const candidateDocument = {
      path: candidate.path,
      name: candidate.name,
      extension: candidate.extension,
      checksum: "candidate",
      content: "# Candidate",
      tags: [],
      tagParts: [],
      tagHierarchy: [],
    };
    const cachedRead = vi.fn(async () => {
      throw new Error("Indexed candidates must not reread note bodies");
    });
    const searchDocuments = vi.fn(async (query: string) =>
      query === "Candidate" ? [{ document: candidateDocument }] : [],
    );
    const app = {
      metadataCache: {
        queryLinks: async () => [],
        getFileCacheAsync: async () => ({}),
        getFirstLinkpathDest: () => null,
      },
      appDatabase: {
        getSearchDocument: async (path: string) =>
          path === active.path ? activeDocument : undefined,
        searchDocuments,
      },
      logger: { warn: () => undefined },
      vault: {
        getFileByPath: (path: string) =>
          path === active.path
            ? active
            : path === candidate.path
              ? candidate
              : null,
        cachedRead,
      },
      workspace: { iterateAllLeaves: () => undefined },
    } as unknown as App;

    const result = await buildLinkSidebarData(app, active, "outgoing");

    expect(result.unlinkedGroups.map((group) => group.file.path)).toEqual([
      candidate.path,
    ]);
    expect(searchDocuments).toHaveBeenCalledWith("Candidate", {
      mode: "lexical",
      limit: 20,
    });
    expect(cachedRead).not.toHaveBeenCalled();
  });
});
