import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import HelpersDemo from "./HelpersDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Helpers",
  component: HelpersDemo,
} satisfies Meta<typeof HelpersDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Helpers: Story = {
  ...apiStoryMeta(
    "api-helpers",
    "Root helpers (fuzzySearch) used by api menus and settings.",
    { skipVisual: true },
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Filter"), "daily");
    await waitFor(() =>
      expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("top: Daily notes"),
    );
  },
};
