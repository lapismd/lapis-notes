import type { App } from "@lapis-notes/api";
import { describe, expect, it, vi } from "vitest";
import {
  FILE_EXPLORER_SELECTION_CHANGE_EVENT,
  bindExplorerSelectionNotifications,
  notifyFileExplorerSelection,
} from "./explorer-selection";

function createApp() {
  const trigger = vi.fn();
  const app = {
    workspace: { trigger },
  } as unknown as App;
  return { app, trigger };
}

describe("explorer selection notifications", () => {
  it("triggers file-explorer:selection-change with the current path", () => {
    const { app, trigger } = createApp();
    notifyFileExplorerSelection(app, "Notes");
    expect(trigger).toHaveBeenCalledWith(
      FILE_EXPLORER_SELECTION_CHANGE_EVENT,
      "Notes",
    );
  });

  it("notifies after setSelectedPath, selectRoot, and revealPath", () => {
    const { app, trigger } = createApp();
    const controller = {
      selectedPath: "",
      setSelectedPath(path: string) {
        this.selectedPath = path;
      },
      selectRoot() {
        this.selectedPath = "";
      },
      revealPath(path: string) {
        this.selectedPath = path;
      },
    };
    bindExplorerSelectionNotifications(app, controller);

    controller.setSelectedPath("Projects");
    expect(controller.selectedPath).toBe("Projects");
    expect(trigger).toHaveBeenLastCalledWith(
      FILE_EXPLORER_SELECTION_CHANGE_EVENT,
      "Projects",
    );

    controller.revealPath("Notes/Welcome.md");
    expect(trigger).toHaveBeenLastCalledWith(
      FILE_EXPLORER_SELECTION_CHANGE_EVENT,
      "Notes/Welcome.md",
    );

    controller.selectRoot();
    expect(trigger).toHaveBeenLastCalledWith(
      FILE_EXPLORER_SELECTION_CHANGE_EVENT,
      "",
    );
  });
});
