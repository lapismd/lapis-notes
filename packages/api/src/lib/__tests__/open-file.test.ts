import { describe, expect, it, vi } from "vitest";
import {
  applyOpenViewStateToLeaf,
  captureLeafViewState,
  historyFilePathForViewState,
  resolveViewForOpenFile,
} from "../open-file";

function createMarkdownView(mode: string) {
  let viewState = { mode, file: "Source.md" };
  return {
    getViewType: () => "markdown",
    getState: () => viewState,
    setState: vi.fn(async (state: Record<string, unknown>) => {
      viewState = state as typeof viewState;
    }),
    canAcceptExtension: (extension: string) => extension === "md",
  };
}

describe("captureLeafViewState", () => {
  it("prefers the live view state over stale leaf state", () => {
    const leaf = {
      state: {
        type: "markdown",
        state: { file: "Source.md", mode: "live-preview" },
      },
      view: {
        getViewType: () => "markdown",
        getState: () => ({ file: "Source.md", mode: "preview" }),
      },
    };

    expect(captureLeafViewState(leaf as never)).toEqual({
      type: "markdown",
      state: { file: "Source.md", mode: "preview" },
    });
  });
});

describe("historyFilePathForViewState", () => {
  it("ignores stale file paths on non-file view history entries", () => {
    expect(
      historyFilePathForViewState({
        type: "graph",
        state: { file: "Notes/Old.md" },
      }),
    ).toBeNull();
  });

  it("keeps file paths for file-backed view history entries", () => {
    expect(
      historyFilePathForViewState({
        type: "markdown",
        state: { file: "Notes/Target.md", mode: "preview" },
      }),
    ).toBe("Notes/Target.md");
  });
});

describe("resolveViewForOpenFile", () => {
  it("reuses the current compatible file view", () => {
    const view = createMarkdownView("preview");
    const leaf = {
      view,
      app: {
        workspace: {
          determineViewTypeForPath: () => "markdown",
          determineViewType: () => "markdown",
          viewCreator: vi.fn(),
        },
      },
    };
    const file = { path: "Target.md", extension: "md" };

    expect(resolveViewForOpenFile(leaf as never, file as never)).toBe(view);
    expect(leaf.app.workspace.viewCreator).not.toHaveBeenCalled();
  });

  it("creates a new view when the current view cannot accept the file", () => {
    const currentView = {
      getViewType: () => "markdown",
      getState: () => ({ mode: "preview" }),
      canAcceptExtension: () => false,
    };
    const nextView = { getViewType: () => "markdown" };
    const viewCreator = vi.fn(() => () => nextView);
    const leaf = {
      view: currentView,
      app: {
        workspace: {
          determineViewTypeForPath: () => "markdown",
          determineViewType: () => "markdown",
          viewCreator,
        },
      },
    };

    expect(
      resolveViewForOpenFile(
        leaf as never,
        {
          path: "Image.png",
          extension: "png",
        } as never,
      ),
    ).toBe(nextView);
  });

  it("reuses an on-demand plugin install prompt for the same file", () => {
    const installPromptView = {
      getViewType: () => "plugin-install-prompt",
      getState: () => ({ file: "Docs/example.lapisdoc" }),
      canAcceptExtension: () => true,
      file: { path: "Docs/example.lapisdoc" },
    };
    const leaf = {
      view: installPromptView,
      app: {
        workspace: {
          determineViewTypeForPath: () => undefined,
          determineViewType: () => undefined,
          viewCreator: vi.fn(() => undefined),
        },
      },
    };

    expect(
      resolveViewForOpenFile(
        leaf as never,
        {
          path: "Docs/example.lapisdoc",
          extension: "lapisdoc",
        } as never,
      ),
    ).toBe(installPromptView);
  });
});

describe("applyOpenViewStateToLeaf", () => {
  it("updates the leaf view and leaf state", async () => {
    const view = createMarkdownView("live-preview");
    const leaf = {
      view,
      state: {
        type: "markdown",
        state: { mode: "live-preview", file: "A.md" },
      },
    };

    await applyOpenViewStateToLeaf(leaf as never, {
      state: { mode: "preview" },
    });

    expect(view.setState).toHaveBeenCalledWith({
      mode: "preview",
      file: "Source.md",
    });
    expect(leaf.state.state).toEqual({ mode: "preview", file: "A.md" });
  });
});
