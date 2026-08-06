import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import ProgressDemo from "./ProgressDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Progress",
  component: ProgressDemo,
} satisfies Meta<typeof ProgressDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Progress: Story = {
  ...apiStoryMeta("api-progress", "Progress bar used for api install/progress surfaces.", { baselineImage: "/visual-baselines/stories/api/progress-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("value: 40");
    await userEvent.click(canvas.getByRole("button", { name: "Bump to 80" }));
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("value: 80");
  },
};
