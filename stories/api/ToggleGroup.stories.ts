import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import ToggleGroupDemo from "./ToggleGroupDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Toggle Group",
  component: ToggleGroupDemo,
} satisfies Meta<typeof ToggleGroupDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ToggleGroup: Story = {
  ...apiStoryMeta(
    "api-toggle-group",
    "Multi toggle group used by api editor search options.",
    { baselineImage: "/visual-baselines/stories/api/toggle-group-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "case" }));
    await userEvent.click(canvas.getByRole("button", { name: "regex" }));
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("case,regex");
  },
};
