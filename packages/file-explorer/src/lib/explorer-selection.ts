import type { App } from "@lapis-notes/api";

export const FILE_EXPLORER_SELECTION_CHANGE_EVENT =
  "file-explorer:selection-change";

type WorkspaceEventBus = {
  trigger(name: string, ...args: unknown[]): void;
};

export type ExplorerSelectionController = {
  selectedPath: string;
  setSelectedPath(path: string): void;
  selectRoot(): void;
  revealPath(path: string, options?: { flash?: boolean }): void;
};

function workspaceEvents(app: App): WorkspaceEventBus {
  return app.workspace as unknown as WorkspaceEventBus;
}

export function notifyFileExplorerSelection(app: App, path: string): void {
  workspaceEvents(app).trigger(FILE_EXPLORER_SELECTION_CHANGE_EVENT, path);
}

export function bindExplorerSelectionNotifications(
  app: App,
  controller: ExplorerSelectionController,
): void {
  const notify = () => notifyFileExplorerSelection(app, controller.selectedPath);
  const setSelectedPath = controller.setSelectedPath.bind(controller);
  const selectRoot = controller.selectRoot.bind(controller);
  const revealPath = controller.revealPath.bind(controller);
  controller.setSelectedPath = (path: string) => {
    setSelectedPath(path);
    notify();
  };
  controller.selectRoot = () => {
    selectRoot();
    notify();
  };
  controller.revealPath = (path: string, options?: { flash?: boolean }) => {
    revealPath(path, options);
    notify();
  };
}
