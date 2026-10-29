import type { MarkdownFileInfo } from "./editor.svelte";
import type { WorkspaceLeaf } from "./workspace.svelte";

/** Retarget a retained editor's DOM services when its view changes document. */
export function attachWorkspaceView(
  target: HTMLElement,
  leaf: WorkspaceLeaf,
): void {
  target.replaceChildren(leaf.containerEl);
  const editor = (leaf.view as Partial<MarkdownFileInfo>).editor;
  const node = target.getRootNode();
  const root =
    node.nodeType === 9 || node.nodeType === 11
      ? (node as Document | ShadowRoot)
      : target.ownerDocument;
  if (editor?.view && editor.view.root !== root) {
    editor.view.setRoot(root);
  }
}
