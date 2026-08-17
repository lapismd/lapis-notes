import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, waitFor, within } from "storybook/test";
import { workspaceCatalogParameters } from "../../catalog/catalog.mjs";
import { aiLiveHostExampleSource } from "./AiLiveHost.example-sources";
import AiLiveHostDemo from "./AiLiveHostDemo.svelte";
import {
  LIVE_HOST_RELOAD_ASSISTANT_TEXT,
  LIVE_HOST_VAULT_ID,
  readPortableConversationStorage,
} from "./shell/create-shell-demo";

const meta = {
  title: "Plugins/AI/Live Host",
  component: AiLiveHostDemo,
  tags: ["skip-visual", "test", "!autodocs"],
  argTypes: {
    scenario: { control: false, table: { disable: true } },
  },
  parameters: {
    ...workspaceCatalogParameters("plugins-ai-live-host"),
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Manual live ACP lane. Default Plugins/AI stories stay Fake. The seeded ai:smoke:storybook supervisor starts an isolated host and injects its ephemeral attach, while a lower-level manual attach remains supported. Portable .lapis/agents conversation files persist in browser storage so reloads exercise filesystem restore and native resume. The play never sends a prompt.",
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
          "When URL or token is missing, the canvas shows setup copy. When both are set, the real AI workspace boots with ACP and restores persisted live conversation data. The play does not type or send.",
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
    expect(canvas.getByRole("combobox", { name: "Message" })).toBeVisible();
  },
};

export const ReloadResume: Story = {
  args: { scenario: "reload-resume" },
  parameters: {
    docs: {
      description: {
        story:
          "Seeds the Live Host localStorage key with portable .lapis/agents files, then boots so the restored transcript, agent divider, and usage paint before native resume. The play never sends a prompt.",
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
      { timeout: 20_000 },
    );
    const panel = await canvas.findByTestId("ai-chat-panel");
    await expect(
      await within(panel).findByText(
        LIVE_HOST_RELOAD_ASSISTANT_TEXT,
        {},
        { timeout: 8_000 },
      ),
    ).toBeVisible();
    await expect(
      await within(panel).findByText("Codex ACP · gpt-5.6-sol"),
    ).toBeVisible();
    await expect(
      within(panel).getByRole("progressbar", {
        name: "Context window usage",
      }),
    ).toHaveAttribute("value", "12920");
    expect(canvas.getByRole("combobox", { name: "Message" })).toBeVisible();
    const persisted = readPortableConversationStorage(LIVE_HOST_VAULT_ID);
    expect(
      Object.keys(persisted).some((path) => path.endsWith("/transcript.jsonl")),
    ).toBe(true);
    expect(
      Object.values(persisted).some((value) =>
        value.includes(LIVE_HOST_RELOAD_ASSISTANT_TEXT),
      ),
    ).toBe(true);
  },
};
