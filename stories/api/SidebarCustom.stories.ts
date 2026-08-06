import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import SidebarCustomDemo from "./SidebarCustomDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Sidebar Custom",
  component: SidebarCustomDemo,
} satisfies Meta<typeof SidebarCustomDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SidebarCustom: Story = {
  ...apiStoryMeta(
    "api-sidebar-custom",
    "Custom sidebar used by api workspace chrome.",
    { baselineImage: "/visual-baselines/stories/api/sidebar-custom-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("open: true");
    await userEvent.click(canvas.getByRole("button", { name: "Toggle Sidebar" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("open: false"),
    );
  },
};
