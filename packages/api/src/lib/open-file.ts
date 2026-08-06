import type { TFile } from "./storage";
import type { View, ViewState } from "./view.svelte";
import {
  ON_DEMAND_PLUGIN_INSTALL_VIEW_TYPE,
  type OpenViewState,
  type WorkspaceLeaf,
} from "./workspace.svelte";

type FileLike = { path?: string } | null;

type FileViewLike = View & {
  canAcceptExtension(extension: string): boolean;
};

function isFileView(view: View): view is FileViewLike {
  return typeof (view as FileViewLike).canAcceptExtension === "function";
}

type LeafLike = {
  view: unknown;
};

type OpenFileWorkspaceLike<Leaf extends LeafLike> = {
  getFocusedCommandHostId(): string;
  getCommandHostIdForLeaf(target: Leaf | null): string;
  iterateAllLeaves<T>(callback: (leaf: Leaf) => T): T | void;
};

function filePathFromView(view: unknown): string | null {
  if (!view || typeof view !== "object" || !("file" in view)) {
    return null;
  }

  const file = (view as { file?: FileLike }).file;
  return typeof file?.path === "string" ? file.path : null;
}

export function leafFilePath(leaf: LeafLike | null | undefined): string | null {
  return filePathFromView(leaf?.view);
}

export function findOpenFileLeaf<Leaf extends LeafLike>(
  workspace: OpenFileWorkspaceLike<Leaf>,
  file: TFile,
): Leaf | null {
  const focusedHostId = workspace.getFocusedCommandHostId();
  let fallbackLeaf: Leaf | null = null;

  const matchingLeaf =
    workspace.iterateAllLeaves<Leaf | undefined>((leaf) => {
      if (leafFilePath(leaf) !== file.path) {
        return undefined;
      }

      if (workspace.getCommandHostIdForLeaf(leaf) === focusedHostId) {
        return leaf;
      }

      fallbackLeaf ??= leaf;
      return undefined;
    }) ?? fallbackLeaf;

  return matchingLeaf ?? null;
}

type LeafViewStateCapture = {
  state: ViewState;
  view?: View;
};

export function captureLeafViewState(leaf: LeafViewStateCapture): ViewState {
  const view = leaf.view;
  if (!view) {
    return cloneViewState(leaf.state);
  }

  return cloneViewState({
    ...leaf.state,
    type: view.getViewType(),
    state: {
      ...(leaf.state.state ?? {}),
      ...view.getState(),
    },
  });
}

export function cloneViewState(state: ViewState): ViewState {
  return {
    ...state,
    state: { ...(state.state ?? {}) },
  };
}

const NON_FILE_HISTORY_VIEW_TYPES = new Set(["empty", "graph", "graph-local"]);

export function historyFilePathForViewState(state: ViewState): string | null {
  if (NON_FILE_HISTORY_VIEW_TYPES.has(state.type)) {
    return null;
  }

  const filePath = state.state?.["file"]?.toString();
  return filePath?.length ? filePath : null;
}

export function resolveViewForOpenFile(
  leaf: WorkspaceLeaf,
  file: TFile,
  explicitView?: View,
): View | undefined {
  if (explicitView) {
    return explicitView;
  }

  const currentView = leaf.view;
  if (
    currentView &&
    isFileView(currentView) &&
    currentView.getViewType() === ON_DEMAND_PLUGIN_INSTALL_VIEW_TYPE &&
    filePathFromView(currentView) === file.path &&
    !leaf.app.workspace.viewCreator(file)
  ) {
    return currentView;
  }

  if (
    currentView &&
    isFileView(currentView) &&
    currentView.canAcceptExtension(file.extension)
  ) {
    const workspace = leaf.app.workspace;
    const targetViewType =
      workspace.determineViewTypeForPath(file.path) ??
      workspace.determineViewType(file.extension);
    if (targetViewType && currentView.getViewType() === targetViewType) {
      return currentView;
    }
  }

  return leaf.app.workspace.viewCreator(file)?.(leaf);
}

export async function applyOpenViewStateToLeaf(
  leaf: WorkspaceLeaf,
  openState?: OpenViewState,
): Promise<void> {
  if (!openState?.state || Object.keys(openState.state).length === 0) {
    return;
  }

  const view = leaf.view;
  if (!view || typeof view.setState !== "function") {
    return;
  }

  const mergedState = {
    ...(typeof view.getState === "function" ? view.getState() : {}),
    ...openState.state,
  };
  await view.setState(mergedState);
  leaf.state = {
    ...leaf.state,
    state: {
      ...(leaf.state.state ?? {}),
      ...openState.state,
    },
  };
}
