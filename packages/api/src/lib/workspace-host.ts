import type { Workspace } from "./workspace.svelte";
import {
  resolveWorkspaceHostBinding,
  type WorkspaceHostBinding,
} from "./workspace-host-internal";

export type { WorkspaceHostBinding } from "./workspace-host-internal";

/**
 * Return the renderer binding owned by a Lapis workspace.
 *
 * This host-only entry point intentionally keeps design-core controller types
 * out of the root Obsidian-compatible API export.
 */
export function getWorkspaceHostBinding(
  workspace: Workspace,
): WorkspaceHostBinding {
  const binding = resolveWorkspaceHostBinding(workspace);
  if (!binding) {
    throw new Error("Workspace host binding is not initialized");
  }
  return binding;
}
