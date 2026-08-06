import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import TooltipDemo from "./TooltipDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Tooltip",
  component: TooltipDemo,
} satisfies Meta<typeof TooltipDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Tooltip: Story = {
  ...apiStoryMeta("api-tooltip", "Tooltip provider/root used by api editor chrome.", { baselineImage: "/visual-baselines/stories/api/tooltip-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: "Hint me" });
    trigger.focus();
    await userEvent.click(trigger);
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("triggered");
  },
};
