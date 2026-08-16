import type { Meta, StoryObj } from "@storybook/svelte-vite";
import PanelDemo from "../../_shared/panels/PanelDemo.svelte";

const meta = {
  title: "Plugins/Markdown/Panels/Link Preview Acceptance",
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
