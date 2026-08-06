import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import DropdownMenuDemo from "./DropdownMenuDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Dropdown Menu",
  component: DropdownMenuDemo,
} satisfies Meta<typeof DropdownMenuDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DropdownMenu: Story = {
  ...apiStoryMeta(
    "api-dropdown-menu",
    "Dropdown menu used by api notebook/action menus.",
    { baselineImage: "/visual-baselines/stories/api/dropdown-menu-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "Open menu" }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Rename" }));
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("rename"),
    );
  },
};
