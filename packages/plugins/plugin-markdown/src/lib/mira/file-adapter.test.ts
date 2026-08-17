import type { App, TFile } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import { createLapisMiraFileAdapter } from "./file-adapter";

function file(path: string): TFile {
  const name = path.split("/").at(-1) ?? path;
  const parts = name.split(".");
  const extension = parts.length > 1 ? parts.pop()! : "";
  return {
    path,
    name,
    baseName: name,
    basename: parts.join("."),
    extension,
    stat: { size: 1, ctime: 1, mtime: 1 },
  } as TFile;
}

function createAppFixture() {
  const source = file("Notes/Source.md");
  const target = file("Notes/Target.md");
  const pdf = file("Files/Guide.pdf");
  const files = [source, target, pdf];
  const destroy = vi.fn();
  const renderEmbed = vi.fn(() => ({ destroy }));
  const openFile = vi.fn(async () => undefined);
  const modify = vi.fn(async () => undefined);
  const app = {
    vault: {
      getFileByPath: (path: string) =>
        files.find((candidate) => candidate.path === path) ?? null,
      getAllLoadedFiles: () => [{ path: "/", children: files }, ...files],
      cachedRead: vi.fn(async (candidate: TFile) => `# ${candidate.basename}`),
      modify,
      on: vi.fn(() => ({})),
      offref: vi.fn(),
    },
    metadataCache: {
      getFirstLinkpathDest: (path: string) =>
        path === "Target" || path === target.path ? target : null,
      getFileCache: () => ({
        headings: [{ heading: "Overview", level: 2 }],
      }),
      on: vi.fn(() => ({})),
      offref: vi.fn(),
    },
    embedRegistry: {
      get: (extension: string) => (extension === "pdf" ? renderEmbed : null),
    },
    openFile,
  } as unknown as App;
  return {
    app,
    source,
    target,
    pdf,
    renderEmbed,
    destroy,
    openFile,
    modify,
  };
}

describe("Lapis Mira file adapter", () => {
  it("reuses one adapter instance for the same App", () => {
    const { app } = createAppFixture();
    expect(createLapisMiraFileAdapter(app)).toBe(
      createLapisMiraFileAdapter(app),
    );
  });

  it("resolves, reads, lists, and opens vault files", async () => {
    const { app, target, openFile } = createAppFixture();
    const adapter = createLapisMiraFileAdapter(app);
    const resolved = await adapter.resolveLink({
      href: "Target",
      path: "Target",
      sourcePath: "Notes/Source.md",
    });

    expect(resolved).toMatchObject({
      path: target.path,
      name: target.name,
      kind: "markdown",
    });
    await expect(adapter.readMarkdown?.(resolved!)).resolves.toBe("# Target");
    expect(await adapter.listFiles?.()).toHaveLength(3);
    expect(await adapter.getHeadings?.(resolved!)).toEqual([
      { id: "Overview", text: "Overview", level: 2 },
    ]);
    await adapter.openFile?.(resolved!);
    expect(openFile).toHaveBeenCalledWith(target);
  });

  it("delegates registered embeds and declines portable Markdown", () => {
    const { app, target, pdf, renderEmbed, destroy } = createAppFixture();
    const adapter = createLapisMiraFileAdapter(app);
    const element = { replaceChildren: vi.fn() } as unknown as HTMLElement;

    expect(
      adapter.renderEmbed?.(
        {
          href: target.path,
          path: target.path,
          file: {
            path: target.path,
            name: target.name,
            extension: target.extension,
            kind: "markdown",
          },
        },
        element,
      ),
    ).toBe(false);

    const cleanup = adapter.renderEmbed?.(
      {
        href: pdf.path,
        path: pdf.path,
        file: {
          path: pdf.path,
          name: pdf.name,
          extension: pdf.extension,
          kind: "unknown",
        },
      },
      element,
    );
    expect(renderEmbed).toHaveBeenCalledWith(
      expect.objectContaining({
        app,
        containerEl: element,
        state: expect.objectContaining({ file: pdf, id: pdf.path }),
      }),
    );
    expect(typeof cleanup).toBe("function");
    if (typeof cleanup === "function") cleanup();
    expect(destroy).toHaveBeenCalledOnce();
  });

  it("writes only existing Markdown files through the Lapis vault", async () => {
    const { app, target, pdf, modify } = createAppFixture();
    const adapter = createLapisMiraFileAdapter(app);

    await expect(
      adapter.writeMarkdown?.(
        { path: target.path, name: target.name, kind: "markdown" },
        "# Updated",
      ),
    ).resolves.toBeUndefined();
    expect(modify).toHaveBeenCalledWith(target, "# Updated");

    await expect(
      adapter.writeMarkdown?.(
        { path: pdf.path, name: pdf.name, kind: "markdown" },
        "not a PDF",
      ),
    ).rejects.toThrow("Cannot write non-Markdown file");
    await expect(
      adapter.writeMarkdown?.(
        { path: "Missing.md", name: "Missing.md", kind: "markdown" },
        "missing",
      ),
    ).rejects.toThrow("Markdown file not found");
  });
});
