import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import { aiLiveHostExampleSource } from "./AiLiveHost.example-sources";
import AiLiveHostDemo from "./AiLiveHostDemo.svelte";

const meta = {
  title: "Plugins/AI/Live Host",
  component: AiLiveHostDemo,
  tags: ["skip-visual", "test", "!autodocs"],
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-live-host"),
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Manual live ACP lane. Default Plugins/AI stories stay Fake. Start lapis-ai-host yourself, set URL and token, then use this story. The play never sends a prompt.",
      },
      source: {
        code: aiLiveHostExampleSource,
        language: "svelte",
        type: "code",
      },
    },
  },
} satisfies Meta<typeof AiLiveHostDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ManualAttach: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "When URL or token is missing, the canvas shows setup copy. When both are set, the real AI workspace boots with ACP. The play does not type or send.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const setup = canvas.queryByTestId("ai-live-host-setup");
    if (setup) {
      expect(setup).toHaveAttribute("data-attach", "missing");
      expect(
        canvas.getByRole("heading", { name: "Live AI host" }),
      ).toBeVisible();
      expect(canvas.queryByTestId("ai-chat-panel")).toBeNull();
      return;
    }

    await waitFor(
      () => {
        expect(canvas.getByTestId("ai-workspace-status")).toHaveTextContent(
          "ready",
        );
      },
      { timeout: 20_000 },
    );
    await expect(canvas.getByTestId("ai-chat-panel")).toBeVisible();
    expect(
      canvas.getByRole("combobox", { name: "Message" }),
    ).toBeVisible();
  },
};
