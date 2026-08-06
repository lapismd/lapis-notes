import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import ButtonDemo from "./ButtonDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Button",
  component: ButtonDemo,
} satisfies Meta<typeof ButtonDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Button: Story = {
  ...apiStoryMeta("api-button", "Button variants used by api settings and menus.", { baselineImage: "/visual-baselines/stories/api/button-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("clicks: 1");
    await expect(canvas.getByRole("button", { name: "Disabled" })).toBeDisabled();
  },
};
