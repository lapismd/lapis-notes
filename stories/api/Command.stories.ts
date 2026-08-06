import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import CommandDemo from "./CommandDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Command",
  component: CommandDemo,
} satisfies Meta<typeof CommandDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Command: Story = {
  ...apiStoryMeta("api-command", "Command list used by api popover menus.", { baselineImage: "/visual-baselines/stories/api/command-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("option", { name: "Daily" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("selected: Daily"),
    );
  },
};
