import { AiChatPanel } from "@lapis-notes/ai";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import {
  aiChatApprovalExampleSource,
  aiChatExampleSource,
  aiChatMentionsExampleSource,
  aiChatScrollExampleSource,
  aiChatTraceExampleSource,
  aiChatValidationExampleSource,
  createAiChatScrollSeedItems,
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

export const PendingApproval: Story = {
  render: () => ({
    Component: AiChatDemo,
    props: { requireApproval: true },
  }),
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-chat-approval"),
    docs: {
      description: {
        story:
          "FakeAgentRuntime blocks the turn on an ApprovalRequest until respondToApproval runs from the shared approval card.",
      },
      source: {
        code: aiChatApprovalExampleSource,
        language: "tsx",
        type: "code",
      },
    },
    visualDelta: {
      images: [
        "/visual-baselines/stories/plugins/ai/chat-approval-chromium.png",
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
    const allow = await canvas.findByRole("button", { name: "Allow once" });
    await userEvent.click(allow);
    await waitFor(() => {
      expect(canvas.getByText(/Approval approved/i)).toBeInTheDocument();
    });
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
          "FakeAgentRuntime rich trace streams thinking, a vault tool call with input/output, Markdown assistant text, a date divider, timestamps, Composer Drawer attachments, and checked Model/Thinking submenus.",
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
    await userEvent.click(await body.findByText("alpha"));
    await expect(
      canvas.getByRole("button", { name: "Remove alpha" }),
    ).toBeVisible();
    const drawer = canvasElement.querySelector(
      '[data-ui-component="ai-chat-composer-drawer"]',
    ) as HTMLElement | null;
    const attachment = canvas
      .getByRole("button", { name: "Remove alpha" })
      .closest(".ai-chat-panel__chip") as HTMLElement | null;
    expect(drawer).not.toBeNull();
    expect(attachment).not.toBeNull();
    const drawerPaint = getComputedStyle(drawer!).backgroundColor;
    const attachmentStyles = getComputedStyle(attachment!);
    expect(attachmentStyles.backgroundColor).not.toBe(drawerPaint);
    expect(attachmentStyles.borderTopWidth).toBe("1px");
    expect(attachmentStyles.borderTopColor).not.toBe("rgba(0, 0, 0, 0)");
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
    });
    await userEvent.click(
      canvas.getByRole("button", { name: "Show details for vault.read" }),
    );
    await expect(canvas.getByText('{"path":"Notes/alpha.md"}')).toBeVisible();
    await expect(canvas.getByText("heading: Notes")).toBeVisible();
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
