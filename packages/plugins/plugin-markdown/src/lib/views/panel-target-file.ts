import type { App, TFile } from "@lapis-notes/api";
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
