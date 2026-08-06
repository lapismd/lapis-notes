import type { AppShellController } from "@lapismd/design-core/workspace/core";
import type { Workspace } from "./workspace.svelte";

export interface WorkspaceHostBinding {
  readonly controller: AppShellController;
}

const workspaceHostBindings = new WeakMap<Workspace, WorkspaceHostBinding>();

export function setWorkspaceHostBinding(
  workspace: Workspace,
  binding: WorkspaceHostBinding,
): void {
  workspaceHostBindings.set(workspace, Object.freeze(binding));
}

export function resolveWorkspaceHostBinding(
  workspace: Workspace,
): WorkspaceHostBinding | undefined {
  return workspaceHostBindings.get(workspace);
}
