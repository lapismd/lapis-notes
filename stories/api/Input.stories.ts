import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import InputDemo from "./InputDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Input",
  component: InputDemo,
} satisfies Meta<typeof InputDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Input: Story = {
  ...apiStoryMeta("api-input", "Text input used across api settings forms.", { baselineImage: "/visual-baselines/stories/api/input-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Title");
    await userEvent.clear(input);
    await userEvent.type(input, "hello");
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent("value: hello");
    await expect(canvas.getByLabelText("Disabled input")).toBeDisabled();
  },
};
