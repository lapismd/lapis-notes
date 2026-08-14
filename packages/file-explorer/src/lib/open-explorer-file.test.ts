import type { App, TFile, WorkspaceLeaf } from "@lapis-notes/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { openExplorerFile } from "./open-explorer-file";

const { findOpenFileLeaf } = vi.hoisted(() => ({
  findOpenFileLeaf: vi.fn(),
}));

vi.mock("@lapis-notes/api", () => ({ findOpenFileLeaf }));

function createFile(path = "Notes/Ideas.markdown"): TFile {
  return { path } as TFile;
}

function createLeaf(file: TFile | null = null): WorkspaceLeaf {
  return {
    openFile: vi.fn().mockResolvedValue(undefined),
    view: file ? { file } : null,
  } as unknown as WorkspaceLeaf;
}

function createApp(options: {
  newLeaf?: WorkspaceLeaf;
} = {}) {
  const newLeaf = options.newLeaf ?? createLeaf();
  const workspace = {
    activeLeaf: null as WorkspaceLeaf | null,
    activateLeaf: vi.fn(() => true),
    getLeaf: vi.fn(() => newLeaf),
    revealLeaf: vi.fn().mockResolvedValue(undefined),
  };
  const app = {
    openFile: vi.fn().mockResolvedValue(undefined),
    workspace,
  } as unknown as App;

  return { app, workspace, newLeaf };
}

describe("openExplorerFile", () => {
  beforeEach(() => {
    findOpenFileLeaf.mockReset();
  });

  it("opens a single-click request through the current-tab app policy", async () => {
    const file = createFile();
    const { app, workspace } = createApp();

    await openExplorerFile(app, file, "current");

    expect(app.openFile).toHaveBeenCalledWith(file);
    expect(workspace.getLeaf).not.toHaveBeenCalled();
  });

  it("activates an existing file leaf for a double-click request", async () => {
    const file = createFile();
    const existingLeaf = createLeaf(file);
    const { app, workspace } = createApp();
    findOpenFileLeaf.mockReturnValue(existingLeaf);

    await openExplorerFile(app, file, "reveal-or-new-tab");

    expect(findOpenFileLeaf).toHaveBeenCalledWith(app.workspace, file);
    expect(workspace.activateLeaf).toHaveBeenCalledWith(existingLeaf, {
      operation: "open-explorer-existing-file",
    });
    expect(workspace.revealLeaf).not.toHaveBeenCalled();
    expect(workspace.getLeaf).not.toHaveBeenCalled();
  });

  it("creates a tab for a double-click request when the file is not open", async () => {
    const file = createFile();
    const { app, workspace, newLeaf } = createApp();
    findOpenFileLeaf.mockReturnValue(null);

    await openExplorerFile(app, file, "reveal-or-new-tab");

    expect(findOpenFileLeaf).toHaveBeenCalledWith(app.workspace, file);
    expect(workspace.getLeaf).toHaveBeenCalledWith("tab");
    expect(newLeaf.openFile).toHaveBeenCalledWith(file);
    expect(workspace.activeLeaf).toBe(newLeaf);
    expect(workspace.revealLeaf).toHaveBeenCalledWith(newLeaf);
  });

  it("always creates a tab for a forced new-tab request", async () => {
    const file = createFile();
    const { app, workspace, newLeaf } = createApp();

    await openExplorerFile(app, file, "new-tab");

    expect(findOpenFileLeaf).not.toHaveBeenCalled();
    expect(workspace.getLeaf).toHaveBeenCalledWith("tab");
    expect(newLeaf.openFile).toHaveBeenCalledWith(file);
    expect(workspace.activeLeaf).toBe(newLeaf);
    expect(workspace.revealLeaf).toHaveBeenCalledWith(newLeaf);
  });
});
