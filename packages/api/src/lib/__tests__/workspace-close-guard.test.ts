import { describe, expect, it, vi } from "vitest";
import { workspaceCloseGuard } from "../workspace-close-guard";
import { FileEditingSessionRegistry } from "../file-editing-sessions";
import type { Workspace } from "../workspace.svelte";

function fixture() {
  const registry = new FileEditingSessionRegistry();
  const input = document.createElement("input");
  document.body.append(input);
  input.focus();
  const workspace = {
    app: { fileEditingSessions: registry },
    getLeafById: () => null,
    getCommandHostIdForLeaf: () => "root",
    getCommandHostDocument: () => document,
    flushLayout: vi.fn(async () => {}),
  } as unknown as Workspace;
  return { registry, workspace, input, close: vi.fn() };
}

describe("owned shell close admission", () => {
  it("blurs focused controls and holds editing protection through removal", async () => {
    const { registry, workspace, input, close } = fixture();
    let protectedNow = false;
    registry.register("note.txt", {
      dirty: false,
      flush: async () => {},
      protect: async () => {
        protectedNow = true;
        return () => {
          protectedNow = false;
        };
      },
    });
    close.mockImplementation(() => {
      expect(protectedNow).toBe(true);
      expect(document.activeElement).not.toBe(input);
    });
    await workspaceCloseGuard(workspace)(["note"], close);
    expect(close).toHaveBeenCalledOnce();
    expect(protectedNow).toBe(false);
    input.remove();
  });
  it("retains content after rejected saving and allows retry", async () => {
    const { registry, workspace, input, close } = fixture();
    let failing = true;
    registry.register("note.txt", {
      get dirty() {
        return failing;
      },
      flush: async () => {},
      protect: async () => {
        if (failing) throw new Error("save failed");
        return () => {};
      },
    });
    const guard = workspaceCloseGuard(workspace);
    await expect(guard(["note"], close)).rejects.toThrow("save failed");
    expect(close).not.toHaveBeenCalled();
    failing = false;
    await guard(["note"], close);
    expect(close).toHaveBeenCalledOnce();
    input.remove();
  });
  it("does not remove views when layout persistence fails", async () => {
    const { workspace, input, close } = fixture();
    vi.mocked(workspace.flushLayout).mockRejectedValue(
      new Error("layout failed"),
    );
    await expect(
      workspaceCloseGuard(workspace)(["note"], close),
    ).rejects.toThrow("layout failed");
    expect(close).not.toHaveBeenCalled();
    input.remove();
  });
});
