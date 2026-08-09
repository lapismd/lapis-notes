import type { App, TFile, WorkspaceLeaf } from "@lapis-notes/api";
import { FileView } from "@lapis-notes/api";

/** Resolve the file file-scoped panels should follow (active FileView when present). */
export function resolvePanelTargetFile(app: App): TFile | null {
  const active = app.workspace.activeLeaf;
  if (active?.view instanceof FileView && active.view.file) {
    return active.view.file;
  }
  let found: TFile | null = null;
  app.workspace.iterateRootLeaves((leaf) => {
    if (!found && leaf.view instanceof FileView && leaf.view.file) {
      found = leaf.view.file;
    }
  });
  return found;
}

/** True when the leaf lives in the left/right WorkspaceSidedock. */
export function leafInSidebar(leaf: WorkspaceLeaf | null | undefined): boolean {
  let item = leaf?.parent as
    | {
        parent?: unknown;
        inSideBar?: () => boolean;
      }
    | undefined;

  while (item) {
    if (item.inSideBar?.()) {
      return true;
    }
    item = item.parent as typeof item;
  }

  return false;
}
