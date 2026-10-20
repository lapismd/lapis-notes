import { tick } from "svelte";
import type { Workspace } from "./workspace.svelte";

/** Keep the App's persistence barrier held through destructive shell changes. */
export function workspaceCloseGuard(
  workspace: Workspace,
  hostDocuments: () => Document[] = () => [],
) {
  return async (ids: string[], remove: () => void): Promise<void> => {
    const targets = ids.map((id) => {
      const leaf = workspace.getLeafById(id);
      const view = leaf?.view;
      return { id, leaf, view, scope: view?.getClosePersistenceScope?.() };
    });
    const documents = new Set(
      ids.map((id) =>
        workspace.getCommandHostDocument(
          workspace.getCommandHostIdForLeaf(workspace.getLeafById(id)),
        ),
      ),
    );
    for (const doc of hostDocuments()) documents.add(doc);
    for (const doc of documents) {
      const active = doc?.activeElement as HTMLElement | null;
      active?.blur?.();
    }
    await tick();
    const registry = workspace.app.fileEditingSessions;
    await registry.settleOperations();
    await workspace.flushLayout();
    const layoutOnly =
      targets.length > 0 &&
      targets.every(
        ({ id, leaf, view, scope }) =>
          scope === "layout" &&
          leaf &&
          workspace.getLeafById(id) === leaf &&
          leaf.view === view &&
          view?.getClosePersistenceScope?.() === "layout",
      );
    if (layoutOnly) {
      remove();
      return;
    }
    await registry.guard(undefined, async () => {
      remove();
    });
  };
}
