import type { App } from "./context.svelte";
import { TFile } from "./storage/fs";
import { FileView } from "./view.svelte";
import type { WorkspaceLeaf } from "./workspace.svelte";

/** Project into existing owned views; no replacement editor or persistence path. */
export async function projectVaultChange(
  app: App,
  event: string,
  file: TFile,
  context: Record<string, unknown>,
  current: () => boolean,
): Promise<void> {
  if (!current()) return;
  if (context.external === true)
    app.workspace.trigger("file-change", file, event);
  if (event !== "rename" && event !== "delete") return;
  const oldPath = event === "rename" ? String(context.oldPath) : file.path;
  if (app.fileEditingSessions.hasDirty(oldPath)) {
    app.notifications.notify({
      id: `vault-file-change:${oldPath}`,
      title: "File changed on disk",
      message:
        event === "rename"
          ? `${oldPath} moved to ${file.path}. Local edits remain in the original view for recovery.`
          : `${oldPath} was removed on disk. Local edits remain in the original view for recovery.`,
      severity: "warning",
      source: "vault",
    });
    return;
  }
  const leaves: WorkspaceLeaf[] = [];
  app.workspace.iterateAllLeaves((leaf) => {
    if (leaf.view instanceof FileView && leaf.view.file?.path === oldPath)
      leaves.push(leaf);
  });
  for (const leaf of leaves) {
    if (
      !current() ||
      !(leaf.view instanceof FileView) ||
      leaf.view.file?.path !== oldPath
    )
      continue;
    if (event === "rename") await leaf.view.onRename(file.copy());
    else await leaf.setViewState({ type: "empty", state: {} });
    if (current()) app.workspace.requestSaveLayout();
  }
  if (current())
    app.workspace.reconcileFileReference(
      oldPath,
      event === "rename" ? file : null,
    );
}
