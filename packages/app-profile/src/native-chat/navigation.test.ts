import { expect, it, vi } from "vitest";
import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import { NativeChatNavigation } from "./navigation";

function fixture() {
  const roots: WorkspaceLeaf[] = [],
    sides: WorkspaceLeaf[] = [];
  function leaf(type = "empty", state: Record<string, unknown> = {}) {
    const result = {
      view: { getViewType: () => type, getState: () => state },
      setViewState: vi.fn(async (next) => {
        type = next.type;
        state = next.state;
      }),
    } as unknown as WorkspaceLeaf;
    return result;
  }
  const workspace = {
    getLeavesOfType: vi.fn((type) =>
      [...roots, ...sides].filter((l) => l.view.getViewType() === type),
    ),
    iterateRootLeaves: (callback: (leaf: WorkspaceLeaf) => void) =>
      roots.forEach(callback),
    getLeaf: vi.fn(() => {
      const next = leaf();
      roots.push(next);
      return next;
    }),
    ensureSideLeaf: vi.fn(() => {
      const next = leaf();
      sides.push(next);
      return next;
    }),
    activateLeaf: vi.fn(),
    revealLeaf: vi.fn(async () => {}),
  };
  const navigation = new NativeChatNavigation({ workspace } as unknown as App);
  return { navigation, workspace, roots, sides, leaf };
}

it("opens History in the ungrouped right sidebar and reuses its owned leaf", async () => {
  const f = fixture();
  await f.navigation.history();
  await f.navigation.history();
  expect(f.workspace.ensureSideLeaf).toHaveBeenCalledExactlyOnceWith(
    "ai-conversation-history",
    "right",
  );
  expect(f.workspace.getLeaf).not.toHaveBeenCalled();
  expect(f.sides[0].view.getViewType()).toBe("ai-conversation-history");
  expect(f.workspace.revealLeaf).toHaveBeenLastCalledWith(f.sides[0]);
});

it("reveals History wherever the user moved it", async () => {
  const f = fixture();
  f.roots.push(f.leaf("ai-conversation-history"));
  await f.navigation.history();
  expect(f.workspace.ensureSideLeaf).not.toHaveBeenCalled();
  expect(f.workspace.revealLeaf).toHaveBeenCalledWith(f.roots[0]);
});

it("opens and reuses only the exact main conversation and scope", async () => {
  const f = fixture();
  const location = { scopeDir: "Project", conversationId: "saved" };
  f.sides.push(f.leaf("ai", location));
  f.roots.push(f.leaf("ai", { ...location, scopeDir: "Other" }));
  await f.navigation.chat(location);
  await f.navigation.chat(location);
  expect(f.workspace.getLeaf).toHaveBeenCalledExactlyOnceWith("tab");
  expect(f.roots[1].view.getState()).toEqual(location);
  expect(f.workspace.revealLeaf).toHaveBeenLastCalledWith(f.roots[1]);
  expect(f.sides[0].setViewState).not.toHaveBeenCalled();
  expect(f.roots[0].setViewState).not.toHaveBeenCalled();
});

it("creates independent local drafts without replacing other conversations", async () => {
  const f = fixture();
  await f.navigation.chat({ scopeDir: "Project" });
  await f.navigation.chat({ scopeDir: "Project" });
  expect(f.roots).toHaveLength(2);
  expect(f.roots.map((l) => l.view.getState())).toEqual([
    { scopeDir: "Project" },
    { scopeDir: "Project" },
  ]);
});

it("serializes simultaneous open requests to avoid duplicate conversation tabs", async () => {
  const f = fixture();
  await Promise.all([
    f.navigation.chat({ scopeDir: "", conversationId: "saved" }),
    f.navigation.chat({ scopeDir: "", conversationId: "saved" }),
  ]);
  expect(f.roots).toHaveLength(1);
});

it("the ribbon reveals a main chat without replacing its state", async () => {
  const f = fixture();
  const existing = f.leaf("ai", {
    scopeDir: "Project",
    conversationId: "saved",
  });
  f.roots.push(existing);
  await f.navigation.chat();
  expect(f.workspace.getLeaf).not.toHaveBeenCalled();
  expect(existing.setViewState).not.toHaveBeenCalled();
  expect(f.workspace.revealLeaf).toHaveBeenCalledWith(existing);
});
