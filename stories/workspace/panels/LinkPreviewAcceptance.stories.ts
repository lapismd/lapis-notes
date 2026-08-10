import type { Meta, StoryObj } from "@storybook/svelte-vite";
import PanelDemo from "./PanelDemo.svelte";

const meta = {
  title: "Workspace/Panels/Markdown/Link Preview Acceptance",
  component: PanelDemo,
  tags: ["visual-pending", "!dev", "!autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof PanelDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OutgoingLinks: Story = {
  args: {
    kind: "outgoing-links",
    layout: "middle-top-tabs",
  },
};

export const Backlinks: Story = {
  args: {
    kind: "backlinks",
    layout: "middle-top-tabs",
  },
};
