import { describe, expect, it } from "vitest";
import type { Workspace } from "./workspace.svelte";
import {
  resolveWorkspaceHostBinding,
  setWorkspaceHostBinding,
  type WorkspaceHostBinding,
} from "./workspace-host-internal";

const HOST_BINDING = Symbol.for("lapis.workspaceHostBinding");

describe("workspace host binding", () => {
  it("reads a binding stored on the workspace by another module copy", () => {
    const workspace = {} as Workspace;
    const binding = {
      controller: { id: "shell" },
    } as unknown as WorkspaceHostBinding;
    Object.defineProperty(workspace, HOST_BINDING, {
      configurable: true,
      value: binding,
    });

    expect(resolveWorkspaceHostBinding(workspace)).toBe(binding);
  });

  it("stores the binding on the workspace as well as the module map", () => {
    const workspace = {} as Workspace;
    const binding = {
      controller: { id: "shell" },
    } as unknown as WorkspaceHostBinding;

    setWorkspaceHostBinding(workspace, binding);

    expect(resolveWorkspaceHostBinding(workspace)?.controller).toEqual(
      binding.controller,
    );
    expect(
      (workspace as Workspace & { [HOST_BINDING]?: WorkspaceHostBinding })[
        HOST_BINDING
      ]?.controller,
    ).toEqual(binding.controller);
  });
});
