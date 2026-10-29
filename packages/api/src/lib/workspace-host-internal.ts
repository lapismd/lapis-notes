import type { AppShellController } from "@lapismd/design-core/workspace/core";
import type { Workspace } from "./workspace.svelte";

export interface WorkspaceHostBinding {
  readonly controller: AppShellController;
}

const HOST_BINDING = Symbol.for("lapis.workspaceHostBinding");
const workspaceHostBindings = new WeakMap<Workspace, WorkspaceHostBinding>();

type WorkspaceWithHostBinding = Workspace & {
  [HOST_BINDING]?: WorkspaceHostBinding;
};

export function setWorkspaceHostBinding(
  workspace: Workspace,
  binding: WorkspaceHostBinding,
): void {
  const frozen = Object.freeze(binding);
  workspaceHostBindings.set(workspace, frozen);
  Object.defineProperty(workspace, HOST_BINDING, {
    configurable: true,
    enumerable: false,
    value: frozen,
  });
}

export function resolveWorkspaceHostBinding(
  workspace: Workspace,
): WorkspaceHostBinding | undefined {
  return (
    workspaceHostBindings.get(workspace) ??
    (workspace as WorkspaceWithHostBinding)[HOST_BINDING]
  );
}
