import { expect, it, vi } from "vitest";
import type { WorkspaceLeaf } from "@lapis-notes/api";
import type { NativeChatSession } from "./session";

vi.mock("@lapis-notes/api", () => ({
  View: class {
    constructor(readonly leaf: WorkspaceLeaf) {}
    get app() {
      return this.leaf.app;
    }
    state: Record<string, unknown> = {};
    getState() {
      return { ...this.state };
    }
    async setState(state: Record<string, unknown>) {
      this.state = { ...state };
    }
  },
}));
vi.mock("svelte", () => ({ mount: vi.fn(), unmount: vi.fn() }));
vi.mock("./NativeChat.svelte", () => ({ default: {} }));
import { NativeChatView } from "./view";

it("preserves restored conversation and scope during pre-mount layout capture", async () => {
  const view = new NativeChatView(
    {} as WorkspaceLeaf,
    {} as NativeChatSession,
    new Set(),
  );
  const state = {
    conversationId: "saved-native-conversation",
    scopeDir: "Project café",
    retained: true,
  };
  await view.setState(state);
  expect(view.getState()).toEqual(state);
  expect(view.getState()).toEqual(state);
});

it("a mounted draft deliberately clears its restored conversation", async () => {
  const { mount } = await import("svelte");
  const requestSaveLayout = vi.fn();
  const leaf = {
    app: { workspace: { requestSaveLayout } },
  } as unknown as WorkspaceLeaf;
  const view = new NativeChatView(leaf, {} as NativeChatSession, new Set());
  await view.setState({ conversationId: "saved", scopeDir: "Original" });
  view.onload();
  const options = vi.mocked(mount).mock.calls.at(-1)![1] as {
    props: {
      initialSession: string;
      initialScope: string;
      onSelection(id: string, scope: string): void;
    };
  };
  expect(options.props.initialSession).toBe("saved");
  expect(options.props.initialScope).toBe("Original");
  options.props.onSelection("draft:new", "New scope");
  expect(view.getState()).toEqual({
    conversationId: undefined,
    scopeDir: "New scope",
  });
  expect(requestSaveLayout).toHaveBeenCalledOnce();
});
