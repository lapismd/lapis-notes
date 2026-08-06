import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { expect, userEvent, within } from "storybook/test";
import TextareaDemo from "./TextareaDemo.svelte";
import { apiStoryMeta } from "./_shared";

const meta = {
  title: "API/Textarea",
  component: TextareaDemo,
} satisfies Meta<typeof TextareaDemo>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Textarea: Story = {
  ...apiStoryMeta("api-textarea", "Multiline textarea used by api settings.", { baselineImage: "/visual-baselines/stories/api/textarea-chromium.png" }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByLabelText("Notes");
    await userEvent.clear(field);
    await userEvent.type(field, "line one{Enter}line two");
    await expect(canvas.getByTestId("api-ui-status")).toHaveTextContent(
      "value: line one line two",
    );
  },
};
