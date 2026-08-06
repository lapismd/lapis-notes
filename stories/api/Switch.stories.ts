import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import SwitchDemo from "./SwitchDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Switch",
  component: SwitchDemo,
} satisfies Meta<typeof SwitchDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Switch: Story = {
  ...apiStoryMeta("api-switch", "Boolean switch used in api configuration rows.", { baselineImage: "/visual-baselines/stories/api/switch-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("off");
    await userEvent.click(canvas.getByRole("switch", { name: "Enabled" }));
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("on");
    await expect(canvas.getByRole("switch", { name: "Disabled switch" })).toBeDisabled();
  },
};
