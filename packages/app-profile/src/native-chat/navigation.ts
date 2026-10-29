import type { App, WorkspaceLeaf } from "@lapis-notes/api";

export type NativeChatLocation = { scopeDir: string; conversationId?: string };

/** App-owned navigation only; opening a view never submits native work. */
export class NativeChatNavigation {
  #tail = Promise.resolve();
  constructor(readonly app: App) {}
  #run(operation: () => Promise<void>): Promise<void> {
    const result = this.#tail.then(operation);
    this.#tail = result.catch(() => {});
    return result;
  }
  async #reveal(leaf: WorkspaceLeaf): Promise<void> {
    this.app.workspace.activateLeaf(leaf, {
      focusRootHost: false,
      source: "api",
      operation: "open-native-chat",
    });
    await this.app.workspace.revealLeaf(leaf);
  }
  history(): Promise<void> {
    return this.#run(async () => {
      const workspace = this.app.workspace;
      const existing = workspace.getLeavesOfType("ai-conversation-history")[0];
      const leaf =
        existing ??
        workspace.ensureSideLeaf("ai-conversation-history", "right");
      if (!existing)
        await leaf.setViewState({ type: "ai-conversation-history", state: {} });
      await this.#reveal(leaf);
    });
  }
  chat(location?: NativeChatLocation): Promise<void> {
    return this.#run(async () => {
      const workspace = this.app.workspace;
      let existing: WorkspaceLeaf | undefined;
      workspace.iterateRootLeaves((leaf) => {
        if (existing || leaf.view.getViewType() !== "ai") return;
        const state = leaf.view.getState();
        if (
          !location ||
          (location.conversationId &&
            state.conversationId === location.conversationId &&
            (state.scopeDir ?? "") === location.scopeDir)
        )
          existing = leaf;
      });
      const leaf = existing ?? workspace.getLeaf("tab");
      if (!existing)
        await leaf.setViewState({
          type: "ai",
          state: location ?? { scopeDir: "" },
        });
      await this.#reveal(leaf);
    });
  }
}
