import { AiChatPanel } from "@lapis-notes/ai";
import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import {
  aiChatApprovalExampleSource,
  aiChatExampleSource,
  aiChatMentionsExampleSource,
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
    const input = await canvas.findByRole("combobox");
    await userEvent.type(input, "Summarize this note");
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        canvas.getByRole("article", { name: "Message from assistant" }),
      ).toHaveTextContent("Summarize this note");
    });
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
    const input = await canvas.findByRole("combobox");
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
    const input = await canvas.findByRole("combobox");
    await userEvent.type(input, "@alp");
    const option = await canvas.findByText("alpha");
    await userEvent.click(option);
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        canvas.getByRole("article", { name: "Message from user" }),
      ).toHaveTextContent("@Notes/alpha.md");
    });
  },
};
