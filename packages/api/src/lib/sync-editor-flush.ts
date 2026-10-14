import type { Editor } from "./editor.svelte";
import type { Workspace } from "./workspace.svelte";
import type { MarkdownFileInfo } from "./editor.svelte";

/** Capture every workspace-owned editor, including inactive, docked and floating panes. */
export async function flushWorkspaceEditors(
  workspace: Pick<Workspace, "iterateAllLeaves">,
  path?: string,
): Promise<{ flushed: boolean; path?: string }> {
  const editors = new Map<Editor, string>();
  workspace.iterateAllLeaves((leaf) => {
    const view = leaf.view as Partial<MarkdownFileInfo>;
    if (view.editor && view.file && (!path || view.file.path === path))
      editors.set(view.editor, view.file.path);
  });
  const results = await Promise.allSettled(
    [...editors].map(async ([editor, capturedPath]) => {
      await editor.flushChanges();
      if (editor.file?.path !== capturedPath)
        throw new Error("Editor document changed while flushing for Sync");
    }),
  );
  for (const result of results)
    if (result.status === "rejected") throw result.reason;
  const only = editors.size === 1 ? editors.values().next().value : undefined;
  return {
    flushed: editors.size > 0,
    ...((path ?? only) ? { path: path ?? only } : {}),
  };
}
