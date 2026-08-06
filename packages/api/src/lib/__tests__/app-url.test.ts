import { describe, expect, it, vi } from "vitest";
import { AppUrlService, createLapisFileUrl } from "../app-url";
import type { App } from "../context.svelte";
import { Plugin } from "../plugin";
import { TFile, TFolder } from "../storage/fs";

class TestPlugin extends Plugin {
  onload(): void {}
}

function createFile(path: string): TFile {
  return new TFile(path, { size: 1, ctime: 1, mtime: 1 }, null);
}

function createTestApp(files: TFile[] = []): App {
  const openFile = vi.fn(async () => undefined);
  const leafOpenFile = vi.fn(async () => undefined);
  const app = {
    appDatabase: { vaultId: "vault-id" },
    session: {
      profile: { id: "vault-id", name: "Vault" },
      vaultAdapter: { getName: () => "Vault", getVaultId: () => "vault-id" },
    },
    vault: {
      adapter: { getName: () => "Vault", getVaultId: () => "vault-id" },
      getName: () => "Vault",
      getFileByPath: (path: string) =>
        files.find((file) => file.path === path) ?? null,
      getAllLoadedFiles: () => [new TFolder("/"), ...files],
    },
    workspace: {
      activeLeaf: null,
      getLeaf: vi.fn(() => ({ openFile: leafOpenFile })),
    },
    openFile,
  } as unknown as App;
  Object.defineProperty(app, "urls", {
    value: new AppUrlService(app),
  });
  return app;
}

describe("app URL service", () => {
  it("creates encoded Lapis file URLs", () => {
    expect(
      createLapisFileUrl(
        "Vault",
        "02 - Areas/Swift/MX/ISO20022 A Deep Dive on Pacs-008.pdf",
      ),
    ).toBe(
      "lapis://open?vault=Vault&file=02%20-%20Areas%2FSwift%2FMX%2FISO20022%20A%20Deep%20Dive%20on%20Pacs-008.pdf",
    );
  });

  it("parses open URLs with lenient unencoded file paths", () => {
    const app = createTestApp();
    const parsed = app.urls.parse(
      "lapis://open?vault=vault&file=02 - Areas/Swift/MX/ISO20022 A Deep Dive on Pacs-008.pdf",
    );

    expect(parsed).toEqual({
      scheme: "lapis",
      action: "open",
      params: {
        action: "open",
        vault: "vault",
        file: "02 - Areas/Swift/MX/ISO20022 A Deep Dive on Pacs-008.pdf",
      },
    });
  });

  it("parses Obsidian-style shorthand vault and absolute path URLs", () => {
    const app = createTestApp();

    expect(app.urls.parse("lapis://vault/Vault/Folder/Note.md")).toMatchObject({
      action: "open",
      params: {
        vault: "Vault",
        file: "Folder/Note.md",
      },
    });

    expect(app.urls.parse("lapis:///Users/me/Vault/Note.md")).toMatchObject({
      action: "open",
      params: {
        path: "/Users/me/Vault/Note.md",
      },
    });
  });

  it("opens current-vault files and supports markdown extension fallback", async () => {
    const file = createFile("Folder/Note.md");
    const app = createTestApp([file]);

    await expect(
      app.urls.dispatch("lapis://open?vault=Vault&file=Folder/Note"),
    ).resolves.toBe(true);

    expect(app.openFile).toHaveBeenCalledWith(file);
  });

  it("accepts the stored profile name as a vault URL alias", async () => {
    const file = createFile("Folder/Note.md");
    const openFile = vi.fn(async () => undefined);
    const app = {
      appDatabase: { vaultId: "desktop-folder:/Vault" },
      session: {
        profile: { id: "desktop-folder:/Vault", name: "Renamed Vault" },
        vaultAdapter: {
          getName: () => "Vault Folder",
          getVaultId: () => "desktop-folder:/Vault",
        },
      },
      vault: {
        adapter: {
          getName: () => "Vault Folder",
          getVaultId: () => "desktop-folder:/Vault",
        },
        getName: () => "Vault Folder",
        getFileByPath: (path: string) => (path === file.path ? file : null),
        getAllLoadedFiles: () => [new TFolder("/"), file],
      },
      workspace: {
        activeLeaf: null,
        getLeaf: vi.fn(() => ({ openFile: vi.fn(async () => undefined) })),
      },
      openFile,
    } as unknown as App;
    Object.defineProperty(app, "urls", {
      value: new AppUrlService(app),
    });

    await expect(
      app.urls.dispatch(
        "lapis://open?vault=Renamed%20Vault&file=Folder/Note.md",
      ),
    ).resolves.toBe(true);

    expect(openFile).toHaveBeenCalledWith(file);
  });

  it("routes tab and split pane types through workspace leaves", async () => {
    const file = createFile("Folder/Note.md");
    const app = createTestApp([file]);

    await expect(
      app.urls.dispatch(
        "lapis://open?vault=Vault&file=Folder/Note.md&paneType=tab",
      ),
    ).resolves.toBe(true);

    expect(app.workspace.getLeaf).toHaveBeenCalledWith("tab");
  });

  it("routes window pane types through workspace popout leaves", async () => {
    const file = createFile("Folder/Note.md");
    const app = createTestApp([file]);

    await expect(
      app.urls.dispatch(
        "lapis://open?vault=Vault&file=Folder/Note.md&paneType=window",
      ),
    ).resolves.toBe(true);

    expect(app.workspace.getLeaf).toHaveBeenCalledWith("window");
  });

  it("returns false when a requested window pane is unsupported", async () => {
    const file = createFile("Folder/Note.md");
    const app = createTestApp([file]);
    app.workspace.getLeaf = vi.fn(() => {
      throw new Error("unsupported");
    });

    await expect(
      app.urls.dispatch(
        "lapis://open?vault=Vault&file=Folder/Note.md&paneType=window",
      ),
    ).resolves.toBe(false);
  });

  it("registers plugin protocol handlers and cleans them up on unload", async () => {
    const app = createTestApp();
    const handler = vi.fn();
    const plugin = new TestPlugin(app, {
      id: "protocol-plugin",
      name: "Protocol plugin",
      version: "1.0.0",
      minAppVersion: "0.0.0",
      description: "Protocol handler test plugin",
      author: "Lapis Notes",
      isDesktopOnly: false,
    });

    plugin.load();
    plugin.registerObsidianProtocolHandler("demo", handler);
    await expect(app.urls.dispatch("lapis://demo?key=value")).resolves.toBe(
      true,
    );
    expect(handler).toHaveBeenCalledWith({ action: "demo", key: "value" });

    await plugin.unload();
    await expect(app.urls.dispatch("lapis://demo?key=value")).resolves.toBe(
      false,
    );
  });
});
