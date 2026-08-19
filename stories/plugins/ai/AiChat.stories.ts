import { AiChatPanel } from "@lapis-notes/ai";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import {
  aiChatApprovalExampleSource,
  aiChatExampleSource,
  aiChatSkillsExampleSource,
  aiChatFailureExampleSource,
  aiChatMentionsExampleSource,
  aiChatQuestionExampleSource,
  aiChatScrollExampleSource,
  aiChatTraceExampleSource,
  aiChatToolStateExampleSource,
  aiChatValidationExampleSource,
  createAiChatFailureSeedItems,
  createAiChatScrollSeedItems,
  aiChatSearchResultExampleSource,
  createAiChatToolSeedItems,
  createNotesSearchSeedItems,
  createAppToolPatchPendingSeedItems,
  createAppToolReadSeedItems,
  createAppToolSessionGrantSeedItems,
} from "./AiChat.example-sources";
import AiChatDemo from "./AiChatDemo.svelte";

const meta = {
  title: "Plugins/AI/Chat",
  component: AiChatPanel,
  tags: ["visual-pending", "test"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "AiChatPanel is the public chat surface for @lapis-notes/ai. These stories use FakeAgentRuntime so they do not require a live agent subscription.",
      },
    },
  },
} satisfies Meta<typeof AiChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SendAndComplete: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: false },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-send"),
    docs: {
      description: {
        story:
          "Submitting a prompt through FakeAgentRuntime streams assistant text and a completed turn.",
      },
      source: {
        code: aiChatExampleSource,
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: ["/visual-baselines/stories/plugins/ai/chat-send-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByTestId("ai-chat-panel");
    const dock = panel.querySelector(
      '[data-ui-part="composer-dock"]',
    ) as HTMLElement | null;
    const shell = panel.querySelector(
      '[data-ui-part="scroll-shell"]',
    ) as HTMLElement | null;
    expect(dock).not.toBeNull();
    expect(shell).not.toBeNull();
    expect(getComputedStyle(dock!).position).toBe("relative");
    expect(shell!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      dock!.getBoundingClientRect().top + 2,
    );
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Summarize this note");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        canvas.getByRole("article", { name: "Message from assistant" }),
      ).toHaveTextContent("Summarize this note");
    });
  },
};

export const SkillsAndSlash: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { enableSkills: true },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-skills-and-slash"),
    docs: {
      description: {
        story:
          "A Fake folder skill, reserved /help grouping, reserved /skills, and extension /open-daily-note run through the public chat panel. Disposing the registration removes the command. The play does not require a live agent.",
      },
      source: {
        code: aiChatSkillsExampleSource,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "/research-notes authentication");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(canvas.getByText(/Skill research-notes/u)).toBeInTheDocument();
    });
    await userEvent.type(input, "/help");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(canvas.getByText(/App/u)).toBeInTheDocument();
      expect(canvas.getByText(/\/help/u)).toBeInTheDocument();
    });
    await userEvent.type(input, "/skills");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      const inventory = canvasElement.querySelector(
        '[data-ui-component="ai-inventory-result"]',
      );
      expect(inventory).toBeVisible();
      expect(inventory).toHaveAttribute("data-kind", "skills");
      expect(canvas.getByText("research-notes")).toBeInTheDocument();
    });
    await userEvent.type(input, "/open-daily-note");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(canvas.getByText("/open-daily-note")).toBeInTheDocument();
    });
    await userEvent.click(canvas.getByTestId("ai-chat-unload-extension"));
    await userEvent.type(input, "/open-daily-note");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        canvas.getAllByText(/Unknown command: \/open-daily-note/u).length,
      ).toBeGreaterThan(0);
    });
  },
};

export const SearchToolHits: Story = {
  tags: ["skip-visual", "test"],
  render: () => ({
    Component: AiChatDemo,
    props: {
      enableSearchResult: true,
      seedItems: createNotesSearchSeedItems(),
    },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-search-result"),
    docs: {
      description: {
        story:
          "A completed notes_search tool item expands to Search-owned hit rows. Clicking a hit opens that vault file without replacing the chat panel.",
      },
      source: {
        code: aiChatSearchResultExampleSource,
        language: "tsx",
        type: "code",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole("button", {
      name: "Show details for notes_search",
    });
    await userEvent.click(trigger);
    const hit = await canvas.findByRole("button", { name: "Open auth.md" });
    await expect(hit).toBeVisible();
    await expect(canvas.getByText("OAuth tokens")).toBeVisible();
    await userEvent.click(hit);
    await waitFor(() => {
      expect(canvas.getByTestId("ai-chat-demo")).toHaveAttribute(
        "data-opened-paths",
        "Projects/auth.md",
      );
    });
    await expect(canvas.getByTestId("ai-chat-panel")).toBeVisible();
  },
};

export const ValidationAndEmptyState: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      modelCatalogError: "Agent runtime socket closed unexpectedly.",
    },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-validation"),
    docs: {
      description: {
        story:
          "A provider socket failure appears immediately in the composer's top validation surface while the empty transcript fills the space above the bottom input.",
      },
      source: {
        code: aiChatValidationExampleSource,
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/chat-validation-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = await canvas.findByTestId("ai-chat-panel");
    const alert = canvas.getByRole("alert");
    await expect(alert).toHaveTextContent(
      "Agent runtime socket closed unexpectedly.",
    );
    expect(alert).toHaveAttribute("data-ui-part", "status");
    expect(alert).toHaveAttribute("data-position", "top");

    const layout = panel.querySelector(
      '[data-ui-component="ai-chat-layout"]',
    ) as HTMLElement | null;
    const shell = panel.querySelector(
      '[data-ui-part="scroll-shell"]',
    ) as HTMLElement | null;
    const empty = panel.querySelector(
      '[data-ui-part="empty-state"]',
    ) as HTMLElement | null;
    const dock = panel.querySelector(
      '[data-ui-part="composer-dock"]',
    ) as HTMLElement | null;
    expect(layout).not.toBeNull();
    expect(shell).not.toBeNull();
    expect(empty).not.toBeNull();
    expect(dock).not.toBeNull();
    const layoutBox = layout!.getBoundingClientRect();
    const shellBox = shell!.getBoundingClientRect();
    const emptyBox = empty!.getBoundingClientRect();
    const dockBox = dock!.getBoundingClientRect();
    expect(layoutBox.height).toBeGreaterThan(400);
    expect(shellBox.height).toBeGreaterThanOrEqual(
      layoutBox.height - dockBox.height - 2,
    );
    expect(emptyBox.height).toBeGreaterThan(shellBox.height * 0.7);
    expect(shellBox.bottom).toBeLessThanOrEqual(dockBox.top + 2);
    expect(dockBox.bottom).toBeLessThanOrEqual(layoutBox.bottom + 2);

    await userEvent.click(
      canvas.getByRole("button", { name: "Effort and model" }),
    );
    const menu = canvasElement.ownerDocument
      .querySelector('[data-testid="ai-chat-model"]')
      ?.closest('[role="menu"]') as HTMLElement | null;
    expect(menu).not.toBeNull();
    expect(
      within(menu!).queryByText("Agent runtime socket closed unexpectedly."),
    ).toBeNull();
  },
};

export const PermissionRequested: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: true },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-permission-requested"),
    docs: {
      description: {
        story:
          "FakeAgentRuntime pauses on an ApprovalRequest so the pending permission remains visible in the Design Core Composer Drawer.",
      },
      source: {
        code: aiChatApprovalExampleSource,
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/chat-permission-requested-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Apply the change");
    await userEvent.keyboard("{Enter}");
    const allow = await canvas.findByRole("button", { name: /Allow once/ });
    const drawer = allow.closest(
      '[data-ui-component="ai-chat-composer-drawer"]',
    );
    expect(drawer).not.toBeNull();
    expect(
      canvas.queryByTestId("ai-approval-card")?.closest("article"),
    ).toBeNull();
    await expect(canvas.getByTestId("ai-chat-working")).toHaveTextContent(
      "Agent is working…",
    );
  },
};

export const PermissionAccepted: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: true },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-permission-accepted"),
    docs: {
      description: {
        story:
          "Choosing Allow once records only the safe permission option and leaves the accepted state visible in the transcript.",
      },
      source: {
        code: aiChatApprovalExampleSource,
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/chat-permission-accepted-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Apply the change");
    await userEvent.keyboard("{Enter}");
    const allow = await canvas.findByRole("button", { name: /Allow once/ });
    await userEvent.click(allow);
    await waitFor(() => {
      expect(canvas.getByText(/Approval approved/i)).toBeInTheDocument();
      expect(canvas.queryByTestId("ai-chat-working")).toBeNull();
    });
  },
};

export const QuestionAsked: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireQuestion: true },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-question-asked"),
    docs: {
      description: {
        story:
          "A runtime-neutral agent question remains visible in the Design Core Composer Drawer while the turn waits for required input.",
      },
      source: {
        code: aiChatQuestionExampleSource,
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/chat-question-asked-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Update the sample file");
    await userEvent.keyboard("{Enter}");
    const option = await canvas.findByRole("button", {
      name: /Make the smallest change/,
    });
    expect(
      option.closest('[data-ui-component="ai-chat-composer-drawer"]'),
    ).not.toBeNull();
    await expect(canvas.getByTestId("ai-chat-working")).toHaveTextContent(
      "Agent is working…",
    );
  },
};

export const QuestionAnswered: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireQuestion: true },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-question-answered"),
    docs: {
      description: {
        story:
          "Submitting the selected safe answer leaves an answered notice without retaining the answer value in the visible transcript.",
      },
      source: {
        code: aiChatQuestionExampleSource,
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/chat-question-answered-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Update the sample file");
    await userEvent.keyboard("{Enter}");
    const option = await canvas.findByRole("button", {
      name: /Make the smallest change/,
    });
    await userEvent.click(option);
    const submit = canvas.getByRole("button", { name: "Submit answer" });
    await expect(submit).toBeEnabled();
    await userEvent.click(submit);
    await waitFor(() => {
      expect(canvas.getByText("Question answered")).toBeInTheDocument();
      expect(canvas.queryByTestId("ai-question-card")).toBeNull();
      expect(canvas.queryByTestId("ai-chat-working")).toBeNull();
    });
  },
};

export const ToolRunning: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { seedItems: createAiChatToolSeedItems("running") },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-tool-running"),
    docs: {
      description: {
        story:
          "A running workspace command remains visible with its live status and the exact command that the agent invoked.",
      },
      source: {
        code: aiChatToolStateExampleSource("running"),
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/chat-tool-running-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole("button", {
      name: "Show details for shell.execute",
    });
    await expect(
      trigger.querySelector('[data-ui-part="detail-chevron"]'),
    ).toHaveAttribute("data-direction", "right");
    const status = canvasElement.querySelector(
      '[data-ui-part="call-status"][data-status="running"]',
    );
    expect(status).not.toBeNull();
    await expect(status).toHaveTextContent("Running");
  },
};

export const SuccessfulToolCall: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { seedItems: createAiChatToolSeedItems("completed") },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-tool-success"),
    docs: {
      description: {
        story:
          "A successful tool call discloses the actual command and output, with right and down chevrons communicating collapsed and expanded state.",
      },
      source: {
        code: aiChatToolStateExampleSource("completed"),
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/chat-tool-success-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole("button", {
      name: "Show details for shell.execute",
    });
    const chevron = trigger.querySelector('[data-ui-part="detail-chevron"]');
    await expect(chevron).toHaveAttribute("data-direction", "right");
    await userEvent.click(trigger);
    await expect(chevron).toHaveAttribute("data-direction", "down");
    await expect(
      canvas.getByText("pnpm --filter @lapis-notes/ai test"),
    ).toBeVisible();
    await expect(canvas.getByText("121 tests passed")).toBeVisible();
  },
};

export const AppToolReadTranscript: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { seedItems: createAppToolReadSeedItems() },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-app-tool-read"),
    docs: {
      description: {
        story:
          "A completed read call is projected through the reserved lapis-tools server into the ordinary tool transcript.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/app-tool-read-transcript-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole("button", {
      name: "Show details for read",
    });
    await userEvent.click(trigger);
    expect(canvas.getAllByText(/Notes\/alpha\.md/).length).toBeGreaterThan(0);
    await expect(canvas.getByText(/one TODO/)).toBeVisible();
  },
};

export const AppToolPatchApproval: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      seedItems: createAppToolPatchPendingSeedItems(),
      preservePending: true,
      seededHeight: "26rem",
    },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-app-tool-patch-approval"),
    docs: {
      description: {
        story:
          "A pending edit request shows its scoped path, before/after diff, and the three memory-only decisions.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/app-tool-patch-approval-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Notes/alpha.md")).toBeVisible();
    await expect(canvas.getByText(/--- before/)).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /Allow once/ }),
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: /Allow for this session/ }),
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: /Deny/ })).toBeVisible();
  },
};

export const AppToolSessionGrant: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { seedItems: createAppToolSessionGrantSeedItems() },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-app-tool-session-grant"),
    docs: {
      description: {
        story:
          "One Allow for this session decision is followed by two successful edit calls, demonstrating that the second call did not prompt again.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/app-tool-session-grant-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText(/Approval approved/)).toBeVisible();
    expect(
      canvas.getAllByRole("button", { name: "Show details for edit" }),
    ).toHaveLength(2);
    expect(canvas.queryByRole("button", { name: /Allow once/ })).toBeNull();
  },
};

export const AppToolHostUpgradeRequired: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      modelCatalogError:
        "Application tools require an agent host with protocol v3 support.",
    },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-app-tool-host-upgrade"),
    docs: {
      description: {
        story:
          "An older host leaves chat available while the composer reports that application tools require protocol v3.",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/app-tool-host-upgrade-required-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("alert"),
    ).toHaveTextContent("protocol v3");
  },
};

export const FailedToolCall: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { seedItems: createAiChatToolSeedItems("error") },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-tool-failure"),
    docs: {
      description: {
        story:
          "A failed command keeps its error visible and expands to show the exact command and captured failure output.",
      },
      source: {
        code: aiChatToolStateExampleSource("error"),
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/chat-tool-failure-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Process exited with code 1",
    );
    const trigger = await canvas.findByRole("button", {
      name: "Show details for shell.execute",
    });
    const chevron = trigger.querySelector('[data-ui-part="detail-chevron"]');
    await expect(chevron).toHaveAttribute("data-direction", "right");
    await userEvent.click(trigger);
    await expect(chevron).toHaveAttribute("data-direction", "down");
    await expect(
      canvas.getByText("pnpm --filter @lapis-notes/ai test"),
    ).toBeVisible();
    const output = canvas.getAllByText(/FAIL ai-chat-panel\.test\.ts/);
    await expect(output[output.length - 1]).toBeVisible();
  },
};

export const FileMentions: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: false },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-mentions"),
    docs: {
      description: {
        story:
          "Typing @ searches vault-scoped files and inserts a path mention through the public composer trigger.",
      },
      source: {
        code: aiChatMentionsExampleSource,
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/chat-mentions-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "@alp");
    const option = await canvas.findByText("alpha");
    const menu = option.closest("[data-ui-part='trigger-menu']");
    expect(menu).toBeTruthy();
    const inputBox = input.getBoundingClientRect();
    const menuBox = (menu as HTMLElement).getBoundingClientRect();
    const gap =
      menuBox.top >= inputBox.bottom - 2
        ? menuBox.top - inputBox.bottom
        : inputBox.top - menuBox.bottom;
    expect(gap).toBeGreaterThanOrEqual(-4);
    expect(gap).toBeLessThan(32);
    await userEvent.click(option);
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      const userMessage = canvas.getByRole("article", {
        name: "Message from user",
      });
      expect(
        userMessage.querySelector(
          '[data-ui-component="ai-chat-tokenized-text"]',
        ),
      ).not.toBeNull();
      expect(userMessage).toHaveTextContent("Notes/alpha.md");
    });
  },
};

export const AgentTrace: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: false, trace: "rich" },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-trace"),
    docs: {
      description: {
        story:
          "FakeAgentRuntime rich trace streams thinking, a vault tool call with input/output, Markdown assistant text, a Copy response action, a date divider, timestamps, compact Composer Drawer attachments, and checked Model/Thinking submenus.",
      },
      source: {
        code: aiChatTraceExampleSource,
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: ["/visual-baselines/stories/plugins/ai/chat-trace-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const writeText = fn(async () => undefined);
    Object.defineProperty(navigator.clipboard, "writeText", {
      configurable: true,
      value: writeText,
    });
    await expect(canvas.getByText("Ask anything…")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Effort and model" }),
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
    await userEvent.click(canvas.getByRole("button", { name: "Attach file" }));
    const attachSearch = await body.findByPlaceholderText("Search vault files");
    const attachPopover = attachSearch.closest(
      '[data-ui-component="popover"][data-ai-part="attach-popover"]',
    ) as HTMLElement | null;
    expect(attachPopover).not.toBeNull();
    expect(
      attachPopover!.querySelector(
        '[data-ui-component="command-view"][data-ui-part="root"]',
      ),
    ).not.toBeNull();
    const attachChrome = getComputedStyle(attachPopover!);
    expect(attachChrome.borderTopWidth).not.toBe("0px");
    expect(attachChrome.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(attachChrome.boxShadow).not.toBe("none");
    await userEvent.click(await body.findByText("alpha"));
    await expect(
      canvas.getByRole("button", { name: "Remove alpha" }),
    ).toBeVisible();
    const drawer = canvasElement.querySelector(
      '[data-ui-component="ai-chat-composer-drawer"]',
    ) as HTMLElement | null;
    const attachment = canvas
      .getByRole("button", { name: "Remove alpha" })
      .closest('[data-ui-part="attachment-chip"]') as HTMLElement | null;
    expect(drawer).not.toBeNull();
    expect(attachment).not.toBeNull();
    const drawerPaint = getComputedStyle(drawer!).backgroundColor;
    const attachmentStyles = getComputedStyle(attachment!);
    expect(attachmentStyles.backgroundColor).not.toBe(drawerPaint);
    expect(attachmentStyles.borderTopLeftRadius).not.toBe("999px");
    expect(attachment!.getBoundingClientRect().height).toBeLessThanOrEqual(32);
    expect(
      canvas
        .getByRole("button", { name: "Remove alpha" })
        .getBoundingClientRect().height,
    ).toBeLessThanOrEqual(attachment!.getBoundingClientRect().height);
    await userEvent.click(canvas.getByRole("button", { name: "Attach file" }));
    const openSearch = await body.findByPlaceholderText("Search vault files");
    const openPopover = openSearch.closest(
      '[data-ui-component="popover"][data-ai-part="attach-popover"]',
    ) as HTMLElement | null;
    expect(openPopover).not.toBeNull();
    const popoverBox = openPopover!.getBoundingClientRect();
    const drawerBox = drawer!.getBoundingClientRect();
    expect(popoverBox.bottom).toBeLessThanOrEqual(drawerBox.top + 2);
    const sampleX = Math.floor((popoverBox.left + popoverBox.right) / 2);
    const sampleY = Math.floor((popoverBox.top + popoverBox.bottom) / 2);
    expect(
      canvasElement.ownerDocument
        .elementFromPoint(sampleX, sampleY)
        ?.closest('[data-ai-part="attach-popover"]'),
    ).not.toBeNull();
    await userEvent.keyboard("{Escape}");
    const input = await canvas.findByRole("combobox", { name: "Message" });
    await userEvent.type(input, "Summarize this note");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        canvasElement.querySelector(
          '[data-ui-component="ai-chat-system-message"][data-variant="divider"]',
        ),
      ).toHaveTextContent("Today");
      expect(
        canvasElement.querySelector('[data-ui-component="ai-chat-reasoning"]'),
      ).not.toBeNull();
      expect(
        canvas.getByText("I will read the mentioned note, then summarize it."),
      ).toBeVisible();
      expect(canvas.getByText("vault.read")).toBeVisible();
      expect(
        canvas.getByRole("article", { name: "Message from assistant" }),
      ).toHaveTextContent("Summary");
      expect(
        canvas.getByRole("article", { name: "Message from assistant" }),
      ).toHaveTextContent("TODO");
      expect(
        canvasElement.querySelector(
          '[data-ui-component="ai-chat-message-metadata"] [data-ui-part="timestamp"]',
        ),
      ).not.toBeNull();
      expect(canvas.getByText("Context")).toBeVisible();
      expect(
        canvas.getByRole("progressbar", { name: "Context window usage" }),
      ).toHaveAttribute("value", "12920");
      expect(canvas.queryByText("session updated")).toBeNull();
      expect(canvas.queryByText("available commands updated (75)")).toBeNull();
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "Show details for vault.read" }),
    );
    await expect(canvas.getByText('{"path":"Notes/alpha.md"}')).toBeVisible();
    await expect(canvas.getByText("heading: Notes")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Copy response" }),
    );
    await expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("## Summary"),
    );
    const panel = canvas.getByTestId("ai-chat-panel");
    const dock = panel.querySelector(
      '[data-ui-part="composer-dock"]',
    ) as HTMLElement | null;
    const viewport = panel.querySelector(
      '[data-ui-part="scroll-area-viewport"]',
    ) as HTMLElement | null;
    const assistant = canvas.getByRole("article", {
      name: "Message from assistant",
    });
    const bubble = assistant.querySelector(
      '[data-ui-component="ai-chat-message-bubble"]',
    ) as HTMLElement | null;
    expect(dock).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(bubble).not.toBeNull();
    expect(viewport!.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      dock!.getBoundingClientRect().top + 2,
    );
    expect(getComputedStyle(viewport!).overflowY).toMatch(/auto|scroll/);
    const bubbleStyles = getComputedStyle(bubble!);
    expect(bubbleStyles.fontFamily).toMatch(/DM Sans/i);
    expect(bubbleStyles.fontSize).toBe("14px");
    expect(bubbleStyles.lineHeight).toBe("22px");
    const heading = bubble!.querySelector("h2");
    expect(heading).not.toBeNull();
    expect(getComputedStyle(heading!).fontSize).toBe(bubbleStyles.fontSize);
    expect(getComputedStyle(heading!).fontFamily).toBe(bubbleStyles.fontFamily);
  },
};

export const FailedMessageAndRetry: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      requireApproval: false,
      seedItems: createAiChatFailureSeedItems(),
    },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-failure"),
    docs: {
      description: {
        story:
          "A failed assistant message uses Design Core error metadata and keeps the Retry action visible and enabled without changing the documented failure state.",
      },
      source: {
        code: aiChatFailureExampleSource,
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/chat-failure-chromium.png",
      ],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const failure = await canvas.findByText(
      "The agent connection closed before the response completed.",
    );
    const message = failure.closest(
      '[data-ui-component="ai-chat-message"]',
    ) as HTMLElement | null;
    expect(message).not.toBeNull();
    await expect(
      within(message!).getByRole("alert", { name: "Failed to send" }),
    ).toBeVisible();
    const retry = within(message!).getByRole("button", {
      name: "Retry message",
    });
    await expect(retry).toBeEnabled();
  },
};

export const ScrollRecovery: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: {
      requireApproval: false,
      seedItems: createAiChatScrollSeedItems(),
    },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-scroll"),
    docs: {
      description: {
        story:
          "A seeded Fake session overflows the transcript. Scrolling away reveals Layout scroll-to-latest, which returns to the newest message.",
      },
      source: {
        code: aiChatScrollExampleSource,
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: ["/visual-baselines/stories/plugins/ai/chat-scroll-chromium.png"],
      opacity: 0.5,
      colorInversion: false,
      align: "canvas",
      placement: "right",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByText("Latest seeded message");
    const viewport = canvasElement.querySelector(
      '[data-ui-part="scroll-area-viewport"]',
    ) as HTMLElement | null;
    expect(viewport).not.toBeNull();
    await waitFor(() => {
      expect(viewport!.scrollHeight).toBeGreaterThan(viewport!.clientHeight);
    });
    await waitFor(() => {
      viewport!.dispatchEvent(
        new WheelEvent("wheel", { deltaY: -120, bubbles: true }),
      );
      viewport!.scrollTop = 0;
      viewport!.dispatchEvent(new Event("scroll"));
      expect(viewport!.scrollTop).toBe(0);
      expect(
        canvasElement.querySelector(
          '[data-ui-component="ai-chat-layout-scroll-button"][data-visible="true"]',
        ),
      ).not.toBeNull();
    });
    const scrollButton = canvasElement.querySelector(
      '[data-ui-component="ai-chat-layout-scroll-button"][data-visible="true"] button',
    ) as HTMLButtonElement | null;
    expect(scrollButton).not.toBeNull();
    expect(scrollButton).toHaveAttribute("aria-label", "Scroll to latest");
    scrollButton!.click();
    await waitFor(() => {
      const latest = canvas.getByText("Latest seeded message");
      const viewBox = viewport!.getBoundingClientRect();
      const latestBox = latest.getBoundingClientRect();
      expect(latestBox.bottom).toBeLessThanOrEqual(viewBox.bottom + 16);
      expect(latestBox.top).toBeGreaterThanOrEqual(viewBox.top - 16);
    });
  },
};
