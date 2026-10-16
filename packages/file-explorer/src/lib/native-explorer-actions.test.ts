import { NativeDesktopVaultAdapter } from "@lapis-notes/api/desktop-native";
import { WorkspaceMenu } from "@lapismd/design-core/workspace/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Notice } from "@lapis-notes/api";
import {
  appendNativeExplorerMenu,
  hasNativeExplorerActions,
  revealInFileManagerLabel,
  copyExplorerText,
} from "./native-explorer-actions";

const {
  hasNativeDesktopCapability,
  getNativeDesktopPlatform,
  resolveNativeDesktopVaultPath,
  openNativeDesktopVaultPath,
  revealNativeDesktopVaultPath,
  NativeDesktopVaultAdapterMock,
} = vi.hoisted(() => {
  class NativeDesktopVaultAdapterMock {
    constructor(readonly rootPath: string) {}
  }
  return {
    hasNativeDesktopCapability: vi.fn(),
    getNativeDesktopPlatform: vi.fn(),
    resolveNativeDesktopVaultPath: vi.fn(),
    openNativeDesktopVaultPath: vi.fn(),
    revealNativeDesktopVaultPath: vi.fn(),
    NativeDesktopVaultAdapterMock,
  };
});

vi.mock("@lapis-notes/api", () => ({
  createLapisFileUrl: (vault: string, file: string) =>
    `lapis://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(file)}`,
  Notice: vi.fn(),
}));

vi.mock("@lapis-notes/api/desktop-native", () => ({
  NativeDesktopVaultAdapter: NativeDesktopVaultAdapterMock,
  hasNativeDesktopCapability,
  getNativeDesktopPlatform,
  resolveNativeDesktopVaultPath,
  openNativeDesktopVaultPath,
  revealNativeDesktopVaultPath,
}));

function createApp(adapter: object) {
  return {
    vault: {
      adapter,
      getName: () => "Demo Vault",
    },
  } as unknown as import("@lapis-notes/api").App;
}

function titles(menu: WorkspaceMenu): string[] {
  return menu.entries.flatMap((entry) => {
    if (entry.kind === "item") return [entry.title];
    if (entry.kind === "submenu") {
      return [
        entry.title,
        ...entry.menu.entries.flatMap((child) =>
          child.kind === "item" ? [child.title] : [],
        ),
      ];
    }
    return [];
  });
}

describe("native explorer actions", () => {
  beforeEach(() => {
    vi.mocked(Notice).mockClear();
    hasNativeDesktopCapability.mockReset();
    getNativeDesktopPlatform.mockReset();
    resolveNativeDesktopVaultPath.mockReset();
    openNativeDesktopVaultPath.mockReset();
    revealNativeDesktopVaultPath.mockReset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("attributes clipboard success to the explicitly owned App", async () => {
    const app = createApp({});
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await copyExplorerText(app, "vault path", "Notes/café.md");
    expect(writeText).toHaveBeenCalledWith("Notes/café.md");
    expect(Notice).toHaveBeenCalledWith("Copied vault path", undefined, app);
  });

  it("rejects missing clipboard support without a success notice", async () => {
    vi.stubGlobal("navigator", {});
    await expect(
      copyExplorerText(createApp({}), "path", "note.md"),
    ).rejects.toThrow(/clipboard/i);
    expect(Notice).not.toHaveBeenCalled();
  });

  it("reports native provider failures through its originating App", async () => {
    hasNativeDesktopCapability.mockReturnValue(true);
    getNativeDesktopPlatform.mockReturnValue({ os: "macos" });
    const app = createApp(new NativeDesktopVaultAdapter("/vault"));
    const menu = new WorkspaceMenu();
    openNativeDesktopVaultPath.mockRejectedValueOnce(
      new Error("native denied"),
    );
    appendNativeExplorerMenu(
      menu,
      { kind: "file", path: "note.md", name: "note.md" },
      app,
    );
    const open = menu.entries.find(
      (entry) => entry.kind === "item" && entry.title === "Open in default app",
    );
    if (open?.kind !== "item") throw new Error("Missing existing Open action");
    await open.callback?.();
    await vi.waitFor(() =>
      expect(Notice).toHaveBeenCalledWith("native denied", undefined, app),
    );
  });

  it("labels reveal by host OS", () => {
    expect(revealInFileManagerLabel("macos")).toBe("Reveal in Finder");
    expect(revealInFileManagerLabel("windows")).toBe("Reveal in File Explorer");
    expect(revealInFileManagerLabel("linux")).toBe("Reveal in file manager");
    expect(revealInFileManagerLabel(undefined)).toBe("Reveal in file manager");
  });

  it("hides extras without a native vault or capability", () => {
    hasNativeDesktopCapability.mockReturnValue(false);
    expect(hasNativeExplorerActions({ kind: "memory" } as never)).toBe(false);

    const adapter = new NativeDesktopVaultAdapter("/Users/me/vault");
    expect(hasNativeExplorerActions(adapter)).toBe(false);

    const menu = new WorkspaceMenu();
    menu.addMenu("Copy Path", (submenu) => {
      submenu.addItem((item) => item.setTitle("From vault folder"));
    });
    appendNativeExplorerMenu(
      menu,
      { path: "Notes/Welcome.md", name: "Welcome.md", kind: "file" },
      createApp(adapter),
    );
    expect(titles(menu)).toEqual(["Copy Path", "From vault folder"]);
  });

  it("adds system copy, Lapis URL, open, and reveal for desktop files", () => {
    hasNativeDesktopCapability.mockImplementation(
      (id: string) => id === "file-system-actions",
    );
    getNativeDesktopPlatform.mockReturnValue({ os: "macos" });
    const adapter = new NativeDesktopVaultAdapter("/Users/me/vault");
    expect(hasNativeExplorerActions(adapter)).toBe(true);

    const menu = new WorkspaceMenu();
    menu.addMenu("Copy Path", (submenu) => {
      submenu.addItem((item) => item.setTitle("From vault folder"));
    });
    appendNativeExplorerMenu(
      menu,
      { path: "Notes/Welcome.md", name: "Welcome.md", kind: "file" },
      createApp(adapter),
    );
    expect(titles(menu)).toEqual([
      "Copy Path",
      "From vault folder",
      "From system root",
      "As Lapis URL",
      "Open in default app",
      "Reveal in Finder",
    ]);
  });

  it("omits the Lapis URL extra for folders", () => {
    hasNativeDesktopCapability.mockReturnValue(true);
    getNativeDesktopPlatform.mockReturnValue({ os: "windows" });
    const menu = new WorkspaceMenu();
    menu.addMenu("Copy Path", (submenu) => {
      submenu.addItem((item) => item.setTitle("From vault folder"));
    });
    appendNativeExplorerMenu(
      menu,
      { path: "Notes", name: "Notes", kind: "folder" },
      createApp(new NativeDesktopVaultAdapter("/Users/me/vault")),
    );
    expect(titles(menu)).toEqual([
      "Copy Path",
      "From vault folder",
      "From system root",
      "Open in default app",
      "Reveal in File Explorer",
    ]);
  });
});
