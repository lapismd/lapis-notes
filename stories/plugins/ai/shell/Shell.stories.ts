import type { App, WorkspaceLeaf } from "@lapis-notes/api";
import { AiHistoryViewType, AiViewType } from "@lapis-notes/ai";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../../catalog/catalog.mjs";
import { WORKSPACE_SHELL_DOCS_STORY } from "../../../workspace/docs-parameters";
import { aiWorkspaceExampleSource } from "./Shell.example-sources";
import AiWorkspaceDemo from "./ShellDemo.svelte";
import { LOCAL_CONVERSATION_ID } from "./create-shell-demo";

const meta = {
  title: "Plugins/AI/Shell",
  component: AiWorkspaceDemo,
  tags: ["visual-pending", "test"],
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-shell-desktop"),
    layout: "fullscreen",
    docs: {
      canvas: { className: "workspace-shell-docs-canvas" },
      description: {
        component:
          "A real Lapis App restores Explorer on the left, AI Chat in the main workspace, and retained Search in the collapsed right sidebar.",
      },
      source: {
        code: aiWorkspaceExampleSource,
        language: "svelte",
        type: "code",
      },
      story: WORKSPACE_SHELL_DOCS_STORY,
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/shell/desktop-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
} satisfies Meta<typeof AiWorkspaceDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

function demoApp(canvasElement: HTMLElement): App {
  const root = canvasElement.querySelector<HTMLElement & { __lapisApp?: App }>(
    '[data-testid="ai-workspace-demo"]',
  );
  if (!root?.__lapisApp) {
    throw new Error("The AI workspace story has no active Lapis app");
  }
  return root.__lapisApp;
}

function mainAiLeaves(app: App): WorkspaceLeaf[] {
  const leaves: WorkspaceLeaf[] = [];
  app.workspace.iterateRootLeaves((leaf) => {
    if (leaf.view.getViewType() === AiViewType) leaves.push(leaf);
  });
  return leaves;
}

function releaseAiInitialization(canvasElement: HTMLElement): void {
  const root = canvasElement.querySelector<
    HTMLElement & { __releaseAiInitialization?: () => void }
  >('[data-testid="ai-workspace-demo"]');
  if (!root?.__releaseAiInitialization) {
    throw new Error("The delayed AI workspace has no initialization gate");
  }
  root.__releaseAiInitialization();
}

function assertStackedComposer(panel: HTMLElement): void {
  const layout = panel.querySelector(
    '[data-ui-component="ai-chat-layout"]',
  ) as HTMLElement | null;
  const dock = panel.querySelector(
    '[data-ui-part="composer-dock"]',
  ) as HTMLElement | null;
  const shell = panel.querySelector(
    '[data-ui-part="scroll-shell"]',
  ) as HTMLElement | null;
  const composerBody = panel.querySelector(
    '[data-ui-component="ai-chat-composer"] [data-ui-part="body"]',
  ) as HTMLElement | null;
  const empty = panel.querySelector(
    '[data-ui-part="empty-state"]',
  ) as HTMLElement | null;
  expect(layout).not.toBeNull();
  expect(dock).not.toBeNull();
  expect(shell).not.toBeNull();
  expect(composerBody).not.toBeNull();
  expect(empty).not.toBeNull();
  expect(getComputedStyle(dock!).position).toBe("relative");
  expect(parseFloat(getComputedStyle(panel).paddingBottom)).toBe(0);
  const panelBox = panel.getBoundingClientRect();
  const layoutBox = layout!.getBoundingClientRect();
  const dockBox = dock!.getBoundingClientRect();
  const shellBox = shell!.getBoundingClientRect();
  const emptyBox = empty!.getBoundingClientRect();
  expect(layoutBox.height).toBeGreaterThan(panelBox.height * 0.8);
  expect(shellBox.height).toBeGreaterThanOrEqual(
    layoutBox.height - dockBox.height - 2,
  );
  expect(emptyBox.height).toBeGreaterThan(shellBox.height * 0.7);
  expect(shellBox.bottom).toBeLessThanOrEqual(dockBox.top + 2);
  expect(
    dockBox.bottom - composerBody!.getBoundingClientRect().bottom,
  ).toBeGreaterThanOrEqual(20);
  expect(dockBox.bottom).toBeLessThanOrEqual(panelBox.bottom + 2);
  expect(dockBox.top).toBeGreaterThan(panelBox.top + panelBox.height * 0.4);
}

function assertNoMessageOverlap(panel: HTMLElement): void {
  const dock = panel.querySelector(
    '[data-ui-part="composer-dock"]',
  ) as HTMLElement | null;
  const viewport = panel.querySelector(
    '[data-ui-part="scroll-area-viewport"]',
  ) as HTMLElement | null;
  const messages = panel.querySelectorAll(
    '[data-ui-component="ai-chat-message"]',
  );
  const last = messages[messages.length - 1] as HTMLElement | undefined;
  expect(dock).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(last).toBeDefined();
  expect(viewport!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    dock!.getBoundingClientRect().top + 2,
  );
  expect(getComputedStyle(viewport!).overflowY).toMatch(/auto|scroll/);
}

export const Desktop: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Explorer remains visible on the left, AI Chat fills the main workspace, and retained Search starts and finishes collapsed on the right. Opening Settings shows the AI runtime controls.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      () => {
        expect(canvas.getByTestId("ai-workspace-status")).toHaveTextContent(
          "ready",
        );
      },
      { timeout: 12_000 },
    );

    const app = demoApp(canvasElement);
    expect(app.workspace.leftSplit.collapsed).toBe(false);
    expect(app.workspace.rightSplit.collapsed).toBe(true);
    expect(app.workspace.bottomPanel.collapsed).toBe(true);
    await expect(canvas.getByLabelText("Left sidebar")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Open right sidebar" }),
    ).toBeVisible();
    await expect(
      canvasElement.querySelector('[data-ui-component="workspace-explorer"]'),
    ).toBeVisible();

    const ribbon = canvas.getByLabelText("left ribbon");
    const openChat = within(ribbon).getByRole("button", { name: "Open Chat" });
    await expect(openChat).toBeVisible();
    await userEvent.click(openChat);
    expect(mainAiLeaves(app)).toHaveLength(1);

    const panel = await canvas.findByTestId("ai-chat-panel");
    const demo = canvas.getByTestId("ai-workspace-demo");
    const workspaceShell = demo.querySelector(
      '[data-ui-component="lapis-workspace-shell"]',
    ) as HTMLElement | null;
    expect(workspaceShell).not.toBeNull();
    expect(
      workspaceShell!.getBoundingClientRect().bottom,
    ).toBeGreaterThanOrEqual(demo.getBoundingClientRect().bottom - 2);
    const mainTabs = panel.closest(
      '[data-ui-component="workspace-tabs"]',
    ) as HTMLElement | null;
    expect(mainTabs).not.toBeNull();
    const surface = panel.closest("[data-workspace-surface]");
    expect(surface).toHaveAttribute("data-workspace-surface", "body");
    const panelStyles = getComputedStyle(panel);
    const viewPaint = panelStyles
      .getPropertyValue("--ui-workspace-view-background")
      .trim();
    const bodyPaint = panelStyles.getPropertyValue("--background").trim();
    expect(viewPaint === "var(--background)" || viewPaint === bodyPaint).toBe(
      true,
    );
    const composerBody = panel.querySelector(
      '[data-ui-component="ai-chat-composer"] [data-ui-part="body"]',
    ) as HTMLElement | null;
    const status = canvas.getByLabelText("Workspace status");
    expect(composerBody).not.toBeNull();
    expect(composerBody!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      status.getBoundingClientRect().top - 8,
    );
    expect(getComputedStyle(panel).fontFamily).toMatch(/DM Sans/i);
    assertStackedComposer(panel);
    expect(panel.querySelector('[data-ui-part="empty-state"]')).not.toBeNull();
    expect(
      within(panel).getByRole("combobox", { name: "Message" }),
    ).toBeVisible();
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      within(panel).getByRole("button", { name: "Effort and model" }),
    );
    const modelMenu = body.getByTestId("ai-chat-model");
    await expect(modelMenu).toBeVisible();
    await userEvent.hover(modelMenu);
    await expect(
      await body.findByRole("menuitemradio", { name: "gpt-5.6-sol" }),
    ).toHaveAttribute("data-state", "checked");
    await userEvent.hover(body.getByTestId("ai-chat-thinking"));
    await expect(
      await body.findByRole("menuitemradio", { name: "Medium" }),
    ).toHaveAttribute("data-state", "checked");
    await userEvent.keyboard("{Escape}");

    const input = within(panel).getByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Summarize this note");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        panel.querySelector('[data-ui-component="ai-chat-reasoning"]'),
      ).not.toBeNull();
      expect(within(panel).getByText("vault.read")).toBeVisible();
      expect(
        within(panel).getByRole("article", { name: "Message from assistant" }),
      ).toHaveTextContent("Summary");
    });
    assertNoMessageOverlap(panel);
    const bubble = panel.querySelector(
      '[data-ui-component="ai-chat-message-bubble"]',
    ) as HTMLElement | null;
    expect(bubble).not.toBeNull();
    const bubbleStyles = getComputedStyle(bubble!);
    expect(bubbleStyles.fontFamily).toMatch(/DM Sans/i);
    expect(bubbleStyles.fontSize).toBe("14px");
    expect(bubbleStyles.lineHeight).toBe("22px");
    const heading = bubble!.querySelector("h2");
    if (heading) {
      expect(getComputedStyle(heading).fontSize).toBe(bubbleStyles.fontSize);
      expect(getComputedStyle(heading).fontFamily).toBe(
        bubbleStyles.fontFamily,
      );
    }

    await userEvent.click(
      await canvas.findByRole("button", { name: "Open settings" }),
    );
    const dialog = canvas.getByRole("dialog", { name: "Settings" });
    await userEvent.click(
      await within(dialog).findByRole("button", { name: "AI" }),
    );
    const runtimeLabel = within(dialog).getByText("Default runtime");
    await expect(runtimeLabel).toBeVisible();
    await expect(within(dialog).getByText("ACP agent")).toBeVisible();
    await expect(within(dialog).getByText("Default model")).toBeVisible();
    await expect(within(dialog).getByText("Thinking")).toBeVisible();
    expect(getComputedStyle(runtimeLabel).fontFamily).toMatch(/DM Sans/i);
    expect(getComputedStyle(runtimeLabel).fontFamily).toBe(
      getComputedStyle(dialog).fontFamily,
    );

    const modelField = within(dialog).getByRole("combobox", {
      name: "Default model",
    });
    await expect(modelField).toBeVisible();
    expect(
      within(dialog).queryByRole("textbox", { name: "Default model" }),
    ).toBeNull();

    const agentField = within(dialog).getByRole("combobox", {
      name: "ACP agent",
    });
    await userEvent.click(agentField);
    await userEvent.click(await body.findByRole("option", { name: "Cursor" }));
    await waitFor(async () => {
      const raw =
        await demoApp(canvasElement).vault.adapter.read(".obsidian/ai.json");
      expect(JSON.parse(raw).settings.acpAgent).toBe("cursor");
    });
    const closeSettings = within(dialog).getByRole("button", {
      name: "Close settings",
    });
    await waitFor(() => {
      expect(getComputedStyle(closeSettings).pointerEvents).not.toBe("none");
    });
    await userEvent.click(closeSettings);
    const raw =
      await demoApp(canvasElement).vault.adapter.read(".obsidian/ai.json");
    expect(JSON.parse(raw)).not.toHaveProperty("sessions");
    expect(app.workspace.rightSplit.collapsed).toBe(true);
  },
};

export const CommunityToolOptIn: Story = {
  args: { scenario: "community-tools" },
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-shell-community-tools"),
    docs: {
      description: {
        story:
          "Registered application tools appear by name with their contributing plugin. A community tool starts disabled and can be enabled for newly created native bindings.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/shell/community-tool-opt-in-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-workspace-status")).toHaveTextContent(
        "ready",
      ),
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Open settings" }),
    );
    const dialog = canvas.getByRole("dialog", { name: "Settings" });
    await userEvent.click(
      await within(dialog).findByRole("button", { name: "AI" }),
    );
    const master = within(dialog).getByRole("switch", {
      name: "Application tools",
    });
    const community = within(dialog).getByRole("switch", {
      name: "story_word_count",
    });
    await expect(master).toHaveAttribute("data-state", "checked");
    await expect(community).toHaveAttribute("data-state", "unchecked");
    for (const [name, contributor] of [
      ["notes_search", "Search"],
      ["notes_read", "Markdown"],
      ["notes_list", "Markdown"],
      ["notes_patch", "Markdown"],
    ] as const) {
      const toggle = within(dialog).getByRole("switch", { name });
      await expect(toggle).toHaveAttribute("data-state", "checked");
      expect(
        dialog.querySelector(`[data-setting-id="ai.appTools.${name}"]`)
          ?.textContent,
      ).toContain(contributor);
    }
    expect(
      dialog.querySelector('[data-setting-id="ai.appTools.story_word_count"]')
        ?.textContent,
    ).toContain("story-community");
    await userEvent.click(community);
    await expect(community).toHaveAttribute("data-state", "checked");
    await waitFor(async () => {
      const raw =
        await demoApp(canvasElement).vault.adapter.read(".obsidian/ai.json");
      const persisted = JSON.parse(raw).settings;
      expect(persisted.enabledAppToolNames).toContain("story_word_count");
      expect(persisted).not.toHaveProperty("enabledCommunityToolPluginIds");
    });
  },
};

export const Mobile: Story = {
  args: { displayMode: "mobile" },
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-shell-mobile"),
    docs: {
      description: {
        story:
          "The same persisted Explorer, AI Chat, and collapsed Search layout renders through the mobile workspace shell.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/shell/mobile-chromium.png",
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-workspace-status")).toHaveTextContent(
        "ready",
      ),
    );
    const app = demoApp(canvasElement);
    expect(app.plugins.isPluginEnabled("ai")).toBe(true);
    expect(app.plugins.isPluginEnabled("lapis-file-explorer")).toBe(true);
    expect(app.plugins.isPluginEnabled("search")).toBe(true);
    expect(app.workspace.rightSplit.collapsed).toBe(true);
    await expect(canvas.getByTestId("ai-chat-panel")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /Open tabs/u }),
    ).toBeVisible();
  },
};

export const ImmediateInitializingComposer: Story = {
  args: { scenario: "initializing" },
  parameters: {
    docs: {
      description: {
        story:
          "The complete sidebar chat layout renders before the delayed model catalog resolves. Its composer remains visibly disabled until agent preparation finishes.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-workspace-status")).toHaveTextContent(
        "ready",
      ),
    );
    const panel = await canvas.findByTestId("ai-chat-panel");
    const composer = within(panel).getByRole("combobox", { name: "Message" });
    expect(panel).toHaveAttribute("data-initializing", "true");
    await expect(
      within(panel).getByRole("status", { name: "" }),
    ).toHaveTextContent("Preparing AI…");
    await expect(composer).toHaveAttribute("aria-disabled", "true");
    await expect(composer).toHaveAttribute("contenteditable", "false");
    await expect(
      within(panel).getByRole("button", { name: "Effort and model" }),
    ).toBeDisabled();

    releaseAiInitialization(canvasElement);
    await waitFor(() => {
      expect(panel).toHaveAttribute("data-initializing", "false");
      expect(composer).toHaveAttribute("aria-disabled", "false");
      expect(composer).toHaveAttribute("contenteditable", "true");
    });
  },
};

export const LocalConversations: Story = {
  args: { scenario: "local-conversations" },
  parameters: {
    docs: {
      description: {
        story:
          "The retained History button reveals a dedicated folder-aware sidebar view. Scope-local rows come from Notes/.lapis, archived rows can be revealed, and New chat can target the vault root before a row returns to chat.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-workspace-status")).toHaveTextContent(
        "ready",
      ),
    );
    const panel = await canvas.findByTestId("ai-chat-panel");
    const app = demoApp(canvasElement);
    const sidebarChatLeaf = app.workspace.getLeavesOfType(AiViewType)[0];
    expect(sidebarChatLeaf).toBeDefined();
    assertStackedComposer(panel);
    await userEvent.click(
      within(panel).getByRole("button", {
        name: "Show conversation history",
      }),
    );
    await waitFor(() =>
      expect(app.workspace.getLeavesOfType(AiHistoryViewType)).toHaveLength(1),
    );
    const history = await canvas.findByTestId("ai-conversation-history");
    const historyLeaf = app.workspace.getLeavesOfType(AiHistoryViewType)[0];
    expect(historyLeaf).toBeDefined();
    expect(app.workspace.getLeavesOfType(AiViewType)).toContain(
      sidebarChatLeaf,
    );
    expect(sidebarChatLeaf?.view.getViewType()).toBe(AiViewType);
    await waitFor(() => {
      expect(within(history).getByText("Notes")).toBeVisible();
      expect(
        within(history).getByText("Summarize project notes"),
      ).toBeVisible();
    });
    expect(within(history).queryByText("Archived planning chat")).toBeNull();

    await userEvent.click(
      within(history).getByRole("button", {
        name: "Show conversation options",
      }),
    );
    await userEvent.click(
      within(history).getByRole("switch", {
        name: "Show archived conversations",
      }),
    );
    await expect(
      within(history).getByText("Archived planning chat"),
    ).toBeVisible();
    const activeItem = within(history)
      .getByRole("button", { name: "Summarize project notes" })
      .closest('[role="treeitem"]');
    if (!activeItem)
      throw new Error("Active conversation row was not rendered");
    await userEvent.click(
      within(activeItem).getByRole("button", {
        name: "Conversation actions for Summarize project notes",
      }),
    );
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await body.findByRole("menuitem", { name: "Archive" }),
    );
    const archivedActiveItem = within(history)
      .getByRole("button", { name: "Summarize project notes" })
      .closest('[role="treeitem"]');
    if (!archivedActiveItem) {
      throw new Error("Archived active conversation row was not rendered");
    }
    const restoreActions = within(archivedActiveItem).getByRole("button", {
      name: "Conversation actions for Summarize project notes",
    });
    await waitFor(() => {
      expect(getComputedStyle(restoreActions).pointerEvents).not.toBe("none");
    });
    await userEvent.click(restoreActions);
    await userEvent.click(
      await body.findByRole("menuitem", { name: "Restore" }),
    );
    const archivedItem = within(history)
      .getByRole("button", { name: "Archived planning chat" })
      .closest('[role="treeitem"]');
    if (!archivedItem) {
      throw new Error("Archived conversation row was not rendered");
    }
    const deleteActions = within(archivedItem).getByRole("button", {
      name: "Conversation actions for Archived planning chat",
    });
    await waitFor(() => {
      expect(getComputedStyle(deleteActions).pointerEvents).not.toBe("none");
    });
    await userEvent.click(deleteActions);
    await userEvent.click(
      await body.findByRole("menuitem", { name: "Delete" }),
    );
    await waitFor(() =>
      expect(within(history).queryByText("Archived planning chat")).toBeNull(),
    );

    const newChat = within(history).getByRole("button", { name: "New chat" });
    await waitFor(() => {
      expect(getComputedStyle(newChat).pointerEvents).not.toBe("none");
    });
    await userEvent.click(newChat);
    await userEvent.click(
      await body.findByRole("menuitem", { name: "Vault root" }),
    );
    await waitFor(() => expect(mainAiLeaves(app)).toHaveLength(1));
    const emptyConversationLeaf = mainAiLeaves(app)[0]!;
    const emptyChat = emptyConversationLeaf.containerEl.querySelector(
      '[data-testid="ai-chat-panel"]',
    ) as HTMLElement | null;
    expect(emptyChat).not.toBeNull();
    await expect(
      within(emptyChat!).getByRole("combobox", { name: "Message" }),
    ).toBeVisible();

    await userEvent.click(
      within(emptyChat!).getByRole("button", {
        name: "Show conversation history",
      }),
    );
    const rootHistory = await canvas.findByTestId("ai-conversation-history");
    expect(app.workspace.getLeavesOfType(AiHistoryViewType)).toEqual([
      historyLeaf,
    ]);
    expect(
      within(rootHistory)
        .getAllByText("Notes")
        .some((element) => element.getClientRects().length > 0),
    ).toBe(true);
    const conversationButton = within(rootHistory).getByRole("button", {
      name: "Summarize project notes",
    });
    await waitFor(() => {
      expect(getComputedStyle(conversationButton).pointerEvents).not.toBe(
        "none",
      );
    });
    await userEvent.click(conversationButton);
    let restoredLeaf: WorkspaceLeaf | undefined;
    await waitFor(() => {
      restoredLeaf = mainAiLeaves(app).find((leaf) => {
        const state = leaf.getViewState().state;
        return state?.conversationId === LOCAL_CONVERSATION_ID;
      });
      expect(restoredLeaf).toBeDefined();
      expect(mainAiLeaves(app)).toHaveLength(2);
    });
    const restored = restoredLeaf!.containerEl.querySelector(
      '[data-testid="ai-chat-panel"]',
    ) as HTMLElement | null;
    expect(restored).not.toBeNull();
    await expect(
      within(restored!).getByText(
        "The project has one welcome note and one TODO.",
      ),
    ).toBeVisible();
    await expect(
      within(restored!).getByRole("progressbar", {
        name: "Context window usage",
      }),
    ).toBeVisible();
    await waitFor(() => {
      expect(getComputedStyle(conversationButton).pointerEvents).not.toBe(
        "none",
      );
    });
    await userEvent.click(conversationButton);
    await waitFor(() => {
      expect(mainAiLeaves(app)).toHaveLength(2);
      expect(
        mainAiLeaves(app).find(
          (leaf) =>
            leaf.getViewState().state?.conversationId === LOCAL_CONVERSATION_ID,
        ),
      ).toBe(restoredLeaf);
    });
    expect(app.workspace.getLeavesOfType(AiHistoryViewType)).toEqual([
      historyLeaf,
    ]);
    await expect(
      demoApp(canvasElement).vault.adapter.read(
        "Notes/.lapis/agents/sessions/123e4567-e89b-42d3-a456-426614174000/transcript.jsonl",
      ),
    ).resolves.toContain("Summarize the project");
    if (!app.workspace.rightSplit.collapsed) {
      await userEvent.click(
        canvas.getByRole("button", { name: "Close right sidebar" }),
      );
    }
    expect(app.workspace.rightSplit.collapsed).toBe(true);
  },
};

export const AgentSwitching: Story = {
  args: { scenario: "agent-switching" },
  parameters: {
    docs: {
      description: {
        story:
          "One filesystem conversation reconstructs Codex ACP and Cursor ACP dividers, attributed messages, active usage, and copy actions without a running provider.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-workspace-status")).toHaveTextContent(
        "ready",
      ),
    );
    const panel = await canvas.findByTestId("ai-chat-panel");
    expect(panel.getBoundingClientRect().height).toBeGreaterThan(500);
    await expect(
      await within(panel).findByText(
        "Codex ACP · gpt-5.6-sol",
        {},
        { timeout: 8_000 },
      ),
    ).toBeVisible();
    await expect(
      await within(panel).findByText("Cursor ACP · composer-2.5"),
    ).toBeVisible();
    await expect(
      await within(panel).findByText(
        "Cursor continued in the same local conversation.",
      ),
    ).toBeVisible();
    expect(
      await within(panel).findAllByRole("button", { name: "Copy response" }),
    ).toHaveLength(2);
    await expect(
      within(panel).getByRole("progressbar", {
        name: "Context window usage",
      }),
    ).toHaveAttribute("value", "12920");
  },
};

export const Recovery: Story = {
  args: { scenario: "recovery" },
  parameters: {
    docs: {
      description: {
        story:
          "A malformed final append is tolerated, durable content paints before native resume, and the missing runtime session remains visible as composer validation plus a retryable failed response.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() =>
      expect(canvas.getByTestId("ai-workspace-status")).toHaveTextContent(
        "ready",
      ),
    );
    const panel = await canvas.findByTestId("ai-chat-panel");
    expect(panel.getBoundingClientRect().height).toBeGreaterThan(500);
    await expect(
      await within(panel).findByText(
        "The durable response remains available offline.",
        {},
        { timeout: 8_000 },
      ),
    ).toBeVisible();
    await expect(
      await within(panel).findByText(
        "Agent host restarted before the turn completed.",
      ),
    ).toBeVisible();
    await expect(
      within(panel).getByRole("button", { name: "Retry message" }),
    ).toBeEnabled();
    await expect(
      await within(panel).findByText(
        /Could not resume the previous agent session/u,
      ),
    ).toBeVisible();
  },
};
