import { describe, expect, it, vi } from "vitest";
import type { App } from "./context.svelte";
import {
  DailyDocumentProviderRegistry,
  formatDailyDocumentFilename,
  registerDefaultDailyDocumentProvider,
} from "./daily-document-provider";
import type { TFile } from "./storage";

function file(path: string): TFile {
  const name = path.split("/").at(-1) ?? path;
  return {
    path,
    name,
    baseName: name.replace(/\.[^.]+$/u, ""),
    extension: name.split(".").at(-1) ?? "",
    stat: { ctime: 0, mtime: 0, size: 0 },
  } as TFile;
}

function createApp(
  initial: Record<string, string> = {},
  configuration: Record<string, unknown> = {},
): { app: App; contents: Map<string, string>; created: string[] } {
  const contents = new Map(Object.entries(initial));
  const files = new Map(
    [...contents.keys()].map((path) => [path, file(path)] as const),
  );
  const created: string[] = [];
  const schema = { register: vi.fn(), unregister: vi.fn() };
  const app = {
    dailyDocumentProviders: new DailyDocumentProviderRegistry(),
    configuration: {
      schema,
      getConfiguration: () => ({
        get: (key: string, defaultValue: unknown) =>
          configuration[key] ?? defaultValue,
      }),
    },
    metadataCache: { getFileCacheAsync: async () => null },
    vault: {
      getMarkdownFiles: () => [...files.values()],
      getFileByPath: (path: string) => files.get(path) ?? null,
      read: async (candidate: TFile) => contents.get(candidate.path) ?? "",
      mkpath: vi.fn(async () => undefined),
      create: vi.fn(async (path: string, content: string) => {
        const candidate = file(path);
        files.set(path, candidate);
        contents.set(path, content);
        created.push(path);
        return candidate;
      }),
    },
  } as unknown as App;
  return { app, contents, created };
}

describe("DailyDocumentProviderRegistry", () => {
  it("selects one highest-priority provider and rejects ambiguity", () => {
    const registry = new DailyDocumentProviderRegistry();
    registry.register({
      id: "default",
      priority: 0,
      locate: async () => null,
      ensure: async () => file("default.md"),
    });
    const override = registry.register({
      id: "override",
      priority: 10,
      locate: async () => null,
      ensure: async () => file("override.md"),
    });
    expect(registry.resolve().id).toBe("override");
    override.dispose();
    registry.register({
      id: "other",
      locate: async () => null,
      ensure: async () => file("other.md"),
    });
    expect(() => registry.resolve()).toThrow(/Ambiguous daily document/u);
  });
});

describe("default daily document provider", () => {
  it("registers a valid object configuration contribution", () => {
    const { app } = createApp();
    registerDefaultDailyDocumentProvider(app);

    expect(app.configuration.schema.register).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "dailyNotes",
        type: "object",
      }),
    );
  });

  it("uses Luxon formatting and rejects unsafe filename output", () => {
    expect(formatDailyDocumentFilename("2026-08-21", "yyyy LLL dd")).toBe(
      "2026 Aug 21.md",
    );
    expect(() =>
      formatDailyDocumentFilename("2026-08-21", "yyyy/MM/dd"),
    ).toThrow(/one safe filename segment/u);
    expect(() =>
      formatDailyDocumentFilename("2026-02-30", "yyyy-MM-dd"),
    ).toThrow(/Invalid local date/u);
  });

  it("locates an existing daily note by canonical front matter after settings change", async () => {
    const { app, created } = createApp(
      {
        "journal/old-name.md":
          "---\ntype: daily-note\ndate: 2026-08-21\n---\n\nExisting\n",
      },
      {
        "dailyNotes.folder": "new-folder",
        "dailyNotes.dateFormat": "dd-LL-yyyy",
      },
    );
    registerDefaultDailyDocumentProvider(app);

    await expect(
      app.dailyDocumentProviders.resolve().ensure("2026-08-21"),
    ).resolves.toMatchObject({ path: "journal/old-name.md" });
    expect(created).toEqual([]);
  });

  it("creates canonical Markdown at the configured safe path", async () => {
    const { app, contents, created } = createApp(
      {},
      {
        "dailyNotes.folder": "Journal/Daily",
        "dailyNotes.dateFormat": "dd-LL-yyyy",
      },
    );
    registerDefaultDailyDocumentProvider(app);

    const result = await app.dailyDocumentProviders
      .resolve()
      .ensure("2026-08-21");
    expect(result.path).toBe("Journal/Daily/21-08-2026.md");
    expect(created).toEqual(["Journal/Daily/21-08-2026.md"]);
    expect(contents.get(result.path)).toContain(
      "type: daily-note\ndate: 2026-08-21",
    );
  });

  it("fails visibly for duplicate dates or an occupied generated path", async () => {
    const duplicate = createApp({
      "daily/one.md": "---\ntype: daily-note\ndate: 2026-08-21\n---\n",
      "archive/two.md": "---\ntype: daily-note\ndate: 2026-08-21\n---\n",
    });
    registerDefaultDailyDocumentProvider(duplicate.app);
    await expect(
      duplicate.app.dailyDocumentProviders.resolve().locate("2026-08-21"),
    ).rejects.toThrow(/Multiple daily notes/u);

    const occupied = createApp({
      "daily/2026-08-21.md": "# An unrelated note\n",
    });
    registerDefaultDailyDocumentProvider(occupied.app);
    await expect(
      occupied.app.dailyDocumentProviders.resolve().ensure("2026-08-21"),
    ).rejects.toThrow(/already exists/u);
  });
});
