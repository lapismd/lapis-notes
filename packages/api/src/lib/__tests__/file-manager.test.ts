import { describe, expect, it, vi } from "vitest";
import type { CachedMetadata, Pos } from "../cache.svelte";
import { FileManager } from "../file-manager";
import { TFile, TFolder } from "../storage/fs";

function createFile(path: string, parent: TFolder | null = null): TFile {
  return new TFile(path, { ctime: 0, mtime: 0, size: 1 }, parent);
}

function createPosition(content: string, original: string): Pos {
  const start = content.indexOf(original);
  if (start === -1) {
    throw new Error(`Unable to find ${original} in test content`);
  }

  return {
    start: { line: 0, col: start, offset: start },
    end: {
      line: 0,
      col: start + original.length,
      offset: start + original.length,
    },
  };
}

function createConfiguration(values: Record<string, unknown> = {}) {
  return {
    getConfiguration() {
      return {
        get<T>(key: string, defaultValue?: T): T {
          return (values[key] as T | undefined) ?? defaultValue!;
        },
      };
    },
  };
}

describe("FileManager", () => {
  it("formats generated links using configured link settings", () => {
    const target = createFile("Notes/Foo.md");
    const manager = new FileManager({
      configuration: createConfiguration({
        "files.links.newLinkFormat": "relative",
        "files.links.useWikilinks": false,
        "files.links.omitMarkdownExtension": true,
        "files.links.useShortestUniqueSuffix": false,
      }),
      vault: {
        getFiles: () => [target],
      },
    } as any);

    expect(manager.generateMarkdownLink(target, "Projects/Index.md")).toBe(
      "[Foo](../Notes/Foo)",
    );
  });

  it("rewrites affected internal links when a file is renamed", async () => {
    const root = new TFolder("", []);
    const source = createFile("Notes/Source.md", root);
    const target = createFile("Notes/Target.md", root);
    const files = new Map([
      [source.path, source],
      [target.path, target],
    ]);
    const contents: Record<string, string> = {
      [source.path]:
        "See [[Target|Alias]], [Shown](Target.md#Section), and ![[Target#^block]].\n",
    };

    const sourceCache: CachedMetadata = {
      links: [
        {
          link: "Target",
          original: "[[Target|Alias]]",
          displayText: "Alias",
          position: createPosition(contents[source.path], "[[Target|Alias]]"),
        },
        {
          link: "Target.md#Section",
          original: "[Shown](Target.md#Section)",
          displayText: "",
          position: createPosition(
            contents[source.path],
            "[Shown](Target.md#Section)",
          ),
        },
        {
          link: "Target#^block",
          original: "![[Target#^block]]",
          displayText: "Target > ^block",
          position: createPosition(contents[source.path], "![[Target#^block]]"),
        },
      ],
    };

    const rename = vi.fn(async (file: TFile, newPath: string) => {
      files.delete(file.path);
      files.set(newPath, file.copy({ path: newPath }));
    });
    const process = vi.fn(
      async (file: TFile, updater: (data: string) => string) => {
        contents[file.path] = updater(contents[file.path]);
        return contents[file.path];
      },
    );

    const manager = new FileManager({
      configuration: createConfiguration({
        "files.links.newLinkFormat": "shortest",
        "files.links.useWikilinks": false,
        "files.links.omitMarkdownExtension": false,
        "files.links.useShortestUniqueSuffix": false,
      }),
      vault: {
        rename,
        process,
        getFileByPath: (path: string) => files.get(path) ?? null,
        getFiles: () => [...files.values()],
      },
      metadataCache: {
        getAllItems: () => new Map([[source, sourceCache]]),
        getFirstLinkpathDest: (link: string) => {
          const path = link.split("#", 1)[0];
          if (path === "Target" || path === "Target.md") {
            return target;
          }
          return null;
        },
      },
    } as any);

    await manager.renameFile(target, "Notes/Renamed.md");

    expect(rename).toHaveBeenCalledWith(target, "Notes/Renamed.md");
    expect(process).toHaveBeenCalledTimes(1);
    expect(contents[source.path]).toBe(
      "See [Alias](Renamed.md), [Shown](Renamed.md#Section), and ![Renamed](Renamed.md#%5Eblock).\n",
    );
  });

  it("preserves existing frontmatter keys when the cache is missing during mutation", async () => {
    const file = createFile("TaskNotes/Tasks/example.md");
    const initialContent = [
      "---",
      "title: Example",
      "tags:",
      "  - task",
      "  - inbox",
      "custom:",
      "  owner: steve",
      "---",
      "",
      "Body",
    ].join("\n");
    let content = initialContent;

    const read = vi.fn(async () => content);
    const process = vi.fn(
      async (_file: TFile, updater: (data: string) => string) => {
        content = updater(content);
        return content;
      },
    );
    const metadataRead = vi.fn(async () => ({
      frontmatter: {
        title: "Example",
        tags: ["task", "inbox"],
        custom: { owner: "steve" },
      },
    }));
    const writeFrontmatter = vi.fn(
      (_file: TFile, data: Record<string, unknown>) =>
        [
          "title: Example",
          "tags:",
          "  - task",
          "  - inbox",
          "custom:",
          "  owner: steve",
          `scheduled: ${String(data.scheduled ?? "")}`,
        ].join("\n"),
    );

    const manager = new FileManager({
      configuration: createConfiguration(),
      vault: {
        read,
        process,
      },
      metadataCache: {
        getFileCache: () => null,
        read: metadataRead,
        writeFrontmatter,
      },
    } as any);

    await manager.processFrontMatter(file, (frontmatter) => {
      frontmatter.scheduled = "2026-05-13T10:30:00";
    });

    expect(read).toHaveBeenCalledWith(file);
    expect(metadataRead).toHaveBeenCalledWith(initialContent, file);
    expect(writeFrontmatter).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        title: "Example",
        tags: ["task", "inbox"],
        custom: { owner: "steve" },
        scheduled: "2026-05-13T10:30:00",
      }),
    );
    expect(content).toContain("title: Example");
    expect(content).toContain("owner: steve");
    expect(content).toContain("scheduled: 2026-05-13T10:30:00");
  });

  it("adds a first frontmatter block when a note starts without one", async () => {
    const file = createFile("TaskNotes/Tasks/no-frontmatter.md");
    let content = "Body\n";

    const read = vi.fn(async () => content);
    const process = vi.fn(
      async (_file: TFile, updater: (data: string) => string) => {
        content = updater(content);
        return content;
      },
    );
    const metadataRead = vi.fn(async () => ({ frontmatter: null }));
    const writeFrontmatter = vi.fn(
      (_file: TFile, data: Record<string, unknown>) =>
        `title: ${String(data.title ?? "")}`,
    );

    const manager = new FileManager({
      configuration: createConfiguration(),
      vault: { read, process },
      metadataCache: {
        getFileCache: () => null,
        read: metadataRead,
        writeFrontmatter,
      },
    } as any);

    await manager.processFrontMatter(file, (frontmatter) => {
      frontmatter.title = "Example";
    });

    expect(content).toBe("---\ntitle: Example\n---\nBody\n");
    expect(writeFrontmatter).toHaveBeenCalledWith(file, { title: "Example" });
  });

  it("removes the frontmatter block when the last property is cleared", async () => {
    const file = createFile("TaskNotes/Tasks/remove-frontmatter.md");
    let content = ["---", "status: open", "---", "", "Body"].join("\n");

    const read = vi.fn(async () => content);
    const process = vi.fn(
      async (_file: TFile, updater: (data: string) => string) => {
        content = updater(content);
        return content;
      },
    );
    const writeFrontmatter = vi.fn();

    const manager = new FileManager({
      configuration: createConfiguration(),
      vault: { read, process },
      metadataCache: {
        getFileCache: () => ({ frontmatter: { status: "open" } }),
        read: vi.fn(),
        writeFrontmatter,
      },
    } as any);

    await manager.processFrontMatter(file, (frontmatter) => {
      delete frontmatter.status;
    });

    expect(content).toBe("Body");
    expect(writeFrontmatter).not.toHaveBeenCalled();
  });

  it("suppresses unnecessary writes when the mutation is a no-op", async () => {
    const file = createFile("TaskNotes/Tasks/no-op.md");
    const read = vi.fn(async () => "---\ntitle: Example\n---\nBody\n");
    const process = vi.fn();

    const manager = new FileManager({
      configuration: createConfiguration(),
      vault: { read, process },
      metadataCache: {
        getFileCache: () => ({ frontmatter: { title: "Example" } }),
        read: vi.fn(),
        writeFrontmatter: vi.fn(),
      },
    } as any);

    await manager.processFrontMatter(file, (frontmatter) => {
      frontmatter.title = "Example";
    });

    expect(process).not.toHaveBeenCalled();
  });

  it("retries against the latest content when the file changes during mutation", async () => {
    const file = createFile("TaskNotes/Tasks/retry.md");
    const initialContent = ["---", "title: Example", "---", "", "Body"].join(
      "\n",
    );
    const newerContent = [
      "---",
      "title: Example",
      "owner: steve",
      "---",
      "",
      "Body",
    ].join("\n");
    let content = initialContent;
    let processCalls = 0;

    const read = vi.fn(async () => content);
    const process = vi.fn(
      async (_file: TFile, updater: (data: string) => string) => {
        processCalls += 1;
        if (processCalls === 1) {
          content = newerContent;
          return updater(newerContent);
        }

        content = updater(content);
        return content;
      },
    );
    const metadataRead = vi.fn(async (currentContent: string) => {
      if (currentContent === newerContent) {
        return { frontmatter: { title: "Example", owner: "steve" } };
      }

      return { frontmatter: { title: "Example" } };
    });
    const writeFrontmatter = vi.fn(
      (_file: TFile, data: Record<string, unknown>) =>
        [
          `title: ${String(data.title ?? "")}`,
          ...(data.owner ? [`owner: ${String(data.owner)}`] : []),
          ...(data.status ? [`status: ${String(data.status)}`] : []),
        ].join("\n"),
    );

    const manager = new FileManager({
      configuration: createConfiguration(),
      vault: { read, process },
      metadataCache: {
        getFileCache: () => null,
        read: metadataRead,
        writeFrontmatter,
      },
    } as any);

    await manager.processFrontMatter(file, (frontmatter) => {
      frontmatter.status = "open";
    });

    expect(process).toHaveBeenCalledTimes(2);
    expect(content).toContain("owner: steve");
    expect(content).toContain("status: open");
  });

  it("propagates frontmatter read failures without writing the file", async () => {
    const file = createFile("TaskNotes/Tasks/bad-frontmatter.md");
    const read = vi.fn(async () => "---\nstatus: [oops\n---\n");
    const process = vi.fn();
    const failure = new Error("Invalid YAML");

    const manager = new FileManager({
      configuration: createConfiguration(),
      vault: { read, process },
      metadataCache: {
        getFileCache: () => null,
        read: vi.fn(async () => {
          throw failure;
        }),
        writeFrontmatter: vi.fn(),
      },
    } as any);

    await expect(
      manager.processFrontMatter(file, (frontmatter) => {
        frontmatter.status = "open";
      }),
    ).rejects.toThrow("Invalid YAML");
    expect(process).not.toHaveBeenCalled();
  });
});
