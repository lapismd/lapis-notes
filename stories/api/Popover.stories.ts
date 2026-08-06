import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import PopoverDemo from "./PopoverDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Popover",
  component: PopoverDemo,
} satisfies Meta<typeof PopoverDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Popover: Story = {
  ...apiStoryMeta("api-popover", "Popover used by api menus and icon pickers.", { baselineImage: "/visual-baselines/stories/api/popover-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open popover" }));
    await userEvent.click(await body.findByRole("button", { name: "Daily" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("picked Daily"),
    );
  },
};
