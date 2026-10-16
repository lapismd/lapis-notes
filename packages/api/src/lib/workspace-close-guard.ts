import { tick } from "svelte";
import type { Workspace } from "./workspace.svelte";

/** Keep the App's persistence barrier held through destructive shell changes. */
export function workspaceCloseGuard(
  workspace: Workspace,
  hostDocuments: () => Document[] = () => [],
) {
  return async (ids: string[], remove: () => void): Promise<void> => {
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
    await registry.guard(undefined, async () => {
      remove();
    });
  };
}
