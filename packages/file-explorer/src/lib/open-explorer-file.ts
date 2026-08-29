import {
  findOpenFileLeaf,
  type App,
  type TFile,
  type WorkspaceLeaf,
} from "@lapis-notes/api";
import type { ExplorerOpenDisposition } from "@lapismd/design-core/workspace/explorer";

export async function openExplorerFile(
  app: App,
  file: TFile,
  disposition: ExplorerOpenDisposition,
): Promise<void> {
  if (disposition === "current") {
    const activeRootLeaf = app.workspace.activeRootLeaf;
    if (activeRootLeaf?.view.getViewType() === "lapis-landing") {
      app.workspace.activeLeaf = activeRootLeaf;
      await activeRootLeaf.openFile(file);
      await app.workspace.revealLeaf(activeRootLeaf);
      return;
    }
    await app.openFile(file);
    return;
  }

  if (disposition === "reveal-or-new-tab") {
    const existingLeaf = findOpenFileLeaf<WorkspaceLeaf>(app.workspace, file);
    if (existingLeaf) {
      app.workspace.activateLeaf(existingLeaf, {
        operation: "open-explorer-existing-file",
      });
      return;
    }
  }

  const leaf = app.workspace.getLeaf("tab");
  app.workspace.activeLeaf = leaf;
  await leaf.openFile(file);
  await app.workspace.revealLeaf(leaf);
}
